import type { Context, Config } from "@netlify/functions";

const SUPABASE_URL = Netlify.env.get("SUPABASE_URL") || "";
const SUPABASE_KEY = Netlify.env.get("SUPABASE_SERVICE_KEY") || "";

async function query(sql: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  // Fallback: use direct REST queries instead
  return res;
}

async function supabaseGet(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  return res.json();
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export default async (req: Request, context: Context) => {
  try {
    const url = new URL(req.url);
    const range = url.searchParams.get("range") || "7"; // days
    const since = daysAgo(parseInt(range));

    // Fetch all data in parallel
    const [pageViews, sessions, events] = await Promise.all([
      supabaseGet(
        `page_views?created_at=gte.${since}&order=created_at.desc&limit=5000`
      ),
      supabaseGet(
        `sessions?started_at=gte.${since}&order=started_at.desc&limit=5000`
      ),
      supabaseGet(
        `events?created_at=gte.${since}&order=created_at.desc&limit=5000`
      ),
    ]);

    // Calculate metrics
    const totalViews = Array.isArray(pageViews) ? pageViews.length : 0;
    const uniqueVisitors = Array.isArray(sessions)
      ? new Set(sessions.map((s: any) => s.visitor_id)).size
      : 0;

    // Average session duration
    let avgDuration = 0;
    if (Array.isArray(sessions)) {
      const durSessions = sessions.filter((s: any) => s.ended_at);
      if (durSessions.length > 0) {
        const totalMs = durSessions.reduce((sum: number, s: any) => {
          return (
            sum +
            (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime())
          );
        }, 0);
        avgDuration = Math.round(totalMs / durSessions.length / 1000); // seconds
      }
    }

    // Contact rate: contact events / total sessions
    const contactEvents = Array.isArray(events)
      ? events.filter(
          (e: any) =>
            e.event_type === "contact_click" || e.event_type === "email_click"
        ).length
      : 0;
    const contactRate =
      Array.isArray(sessions) && sessions.length > 0
        ? ((contactEvents / sessions.length) * 100).toFixed(2)
        : "0";

    // Average scroll depth
    const avgScroll =
      Array.isArray(sessions) && sessions.length > 0
        ? Math.round(
            sessions.reduce(
              (sum: number, s: any) => sum + (s.max_scroll_depth || 0),
              0
            ) / sessions.length
          )
        : 0;

    // Page breakdown
    const pageCounts: Record<string, number> = {};
    if (Array.isArray(pageViews)) {
      pageViews.forEach((pv: any) => {
        pageCounts[pv.page] = (pageCounts[pv.page] || 0) + 1;
      });
    }

    // Top pages sorted by views
    const topPages = Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([page, views]) => ({ page, views }));

    // Daily views for chart (last N days)
    const dailyViews: Record<string, number> = {};
    const dailyUnique: Record<string, Set<string>> = {};
    const days = parseInt(range);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      dailyViews[key] = 0;
      dailyUnique[key] = new Set();
    }
    if (Array.isArray(pageViews)) {
      pageViews.forEach((pv: any) => {
        const key = pv.created_at.split("T")[0];
        if (dailyViews[key] !== undefined) {
          dailyViews[key]++;
        }
      });
    }
    if (Array.isArray(sessions)) {
      sessions.forEach((s: any) => {
        const key = s.started_at.split("T")[0];
        if (dailyUnique[key]) {
          dailyUnique[key].add(s.visitor_id);
        }
      });
    }

    const chartLabels = Object.keys(dailyViews);
    const chartViews = Object.values(dailyViews);
    const chartUnique = chartLabels.map((k) => dailyUnique[k]?.size || 0);

    // Conversion breakdown by event type
    const conversionCounts: Record<string, number> = {};
    if (Array.isArray(events)) {
      events.forEach((e: any) => {
        conversionCounts[e.event_type] =
          (conversionCounts[e.event_type] || 0) + 1;
      });
    }

    // Geographic data
    const regionCounts: Record<string, number> = {};
    if (Array.isArray(sessions)) {
      sessions.forEach((s: any) => {
        if (s.country) {
          regionCounts[s.country] = (regionCounts[s.country] || 0) + 1;
        }
      });
    }
    const topRegions = Object.entries(regionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([country, count]) => ({ country, count }));

    // Visitor type (new vs returning)
    const newVisitors = Array.isArray(sessions)
      ? sessions.filter((s: any) => s.is_new_visitor).length
      : 0;
    const returningVisitors = Array.isArray(sessions)
      ? sessions.length - newVisitors
      : 0;

    // Recent live activity (last 10 page views)
    const recentActivity = Array.isArray(pageViews)
      ? pageViews.slice(0, 10).map((pv: any) => ({
          page: pv.page,
          city: pv.city,
          country: pv.country,
          device: pv.device,
          time: pv.created_at,
        }))
      : [];

    // Project performance (from events with project data)
    const projectEvents: Record<string, { views: number; engagement: number }> =
      {};
    if (Array.isArray(events)) {
      events
        .filter((e: any) => e.event_type === "project_view")
        .forEach((e: any) => {
          const name = e.event_data?.project || "Unknown";
          if (!projectEvents[name])
            projectEvents[name] = { views: 0, engagement: 0 };
          projectEvents[name].views++;
        });
    }

    const data = {
      overview: {
        total_views: totalViews,
        unique_visitors: uniqueVisitors,
        avg_session_duration: avgDuration,
        contact_rate: parseFloat(contactRate as string),
        avg_scroll_depth: avgScroll,
      },
      chart: {
        labels: chartLabels,
        views: chartViews,
        unique: chartUnique,
      },
      top_pages: topPages,
      conversions: conversionCounts,
      regions: topRegions,
      visitors: {
        new: newVisitors,
        returning: returningVisitors,
      },
      live_activity: recentActivity,
      projects: projectEvents,
    };

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config: Config = {
  path: "/api/analytics",
};
