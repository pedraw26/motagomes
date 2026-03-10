import type { Context, Config } from "@netlify/functions";

const SUPABASE_URL = Netlify.env.get("SUPABASE_URL") || "";
const SUPABASE_KEY = Netlify.env.get("SUPABASE_SERVICE_KEY") || "";

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

function calcTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export default async (req: Request, context: Context) => {
  try {
    const url = new URL(req.url);
    const range = parseInt(url.searchParams.get("range") || "7");
    const since = daysAgo(range);
    const prevSince = daysAgo(range * 2);

    // Fetch current + previous period data in parallel
    const [pageViews, sessions, events, prevPageViews, prevSessions, prevEvents] =
      await Promise.all([
        supabaseGet(`page_views?created_at=gte.${since}&order=created_at.desc&limit=5000`),
        supabaseGet(`sessions?started_at=gte.${since}&order=started_at.desc&limit=5000`),
        supabaseGet(`events?created_at=gte.${since}&order=created_at.desc&limit=5000`),
        supabaseGet(`page_views?created_at=gte.${prevSince}&created_at=lt.${since}&order=created_at.desc&limit=5000`),
        supabaseGet(`sessions?started_at=gte.${prevSince}&started_at=lt.${since}&order=started_at.desc&limit=5000`),
        supabaseGet(`events?created_at=gte.${prevSince}&created_at=lt.${since}&order=created_at.desc&limit=5000`),
      ]);

    // ===== CURRENT PERIOD METRICS =====
    const totalViews = Array.isArray(pageViews) ? pageViews.length : 0;
    const uniqueVisitors = Array.isArray(sessions)
      ? new Set(sessions.map((s: any) => s.visitor_id)).size
      : 0;

    let avgDuration = 0;
    if (Array.isArray(sessions)) {
      const durSessions = sessions.filter((s: any) => s.ended_at);
      if (durSessions.length > 0) {
        const totalMs = durSessions.reduce((sum: number, s: any) => {
          return sum + (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime());
        }, 0);
        avgDuration = Math.round(totalMs / durSessions.length / 1000);
      }
    }

    const contactEvents = Array.isArray(events)
      ? events.filter((e: any) => e.event_type === "contact_click" || e.event_type === "email_click").length
      : 0;
    const contactRate =
      Array.isArray(sessions) && sessions.length > 0
        ? ((contactEvents / sessions.length) * 100).toFixed(2)
        : "0";

    const avgScroll =
      Array.isArray(sessions) && sessions.length > 0
        ? Math.round(sessions.reduce((sum: number, s: any) => sum + (s.max_scroll_depth || 0), 0) / sessions.length)
        : 0;

    // Bounce rate
    const bouncedSessions = Array.isArray(sessions)
      ? sessions.filter((s: any) => (s.pages_viewed || 1) <= 1).length
      : 0;
    const bounceRate =
      Array.isArray(sessions) && sessions.length > 0
        ? Math.round((bouncedSessions / sessions.length) * 100)
        : 0;

    // ===== PREVIOUS PERIOD METRICS (for trends) =====
    const prevTotalViews = Array.isArray(prevPageViews) ? prevPageViews.length : 0;
    const prevUniqueVisitors = Array.isArray(prevSessions)
      ? new Set(prevSessions.map((s: any) => s.visitor_id)).size
      : 0;

    let prevAvgDuration = 0;
    if (Array.isArray(prevSessions)) {
      const pds = prevSessions.filter((s: any) => s.ended_at);
      if (pds.length > 0) {
        const ptm = pds.reduce((sum: number, s: any) => {
          return sum + (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime());
        }, 0);
        prevAvgDuration = Math.round(ptm / pds.length / 1000);
      }
    }

    const prevContactEvents = Array.isArray(prevEvents)
      ? prevEvents.filter((e: any) => e.event_type === "contact_click" || e.event_type === "email_click").length
      : 0;
    const prevContactRate =
      Array.isArray(prevSessions) && prevSessions.length > 0
        ? parseFloat(((prevContactEvents / prevSessions.length) * 100).toFixed(2))
        : 0;

    const prevBouncedSessions = Array.isArray(prevSessions)
      ? prevSessions.filter((s: any) => (s.pages_viewed || 1) <= 1).length
      : 0;
    const prevBounceRate =
      Array.isArray(prevSessions) && prevSessions.length > 0
        ? Math.round((prevBouncedSessions / prevSessions.length) * 100)
        : 0;

    // ===== PAGE BREAKDOWN =====
    const pageCounts: Record<string, number> = {};
    if (Array.isArray(pageViews)) {
      pageViews.forEach((pv: any) => {
        pageCounts[pv.page] = (pageCounts[pv.page] || 0) + 1;
      });
    }
    const topPages = Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([page, views]) => ({ page, views }));

    // ===== DAILY CHART DATA =====
    const dailyViews: Record<string, number> = {};
    const dailyUnique: Record<string, Set<string>> = {};
    const dailyDurations: Record<string, number[]> = {};
    const dailyContactEvents: Record<string, number> = {};
    const dailySessionCounts: Record<string, number> = {};

    for (let i = range - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      dailyViews[key] = 0;
      dailyUnique[key] = new Set();
      dailyDurations[key] = [];
      dailyContactEvents[key] = 0;
      dailySessionCounts[key] = 0;
    }

    if (Array.isArray(pageViews)) {
      pageViews.forEach((pv: any) => {
        const key = pv.created_at.split("T")[0];
        if (dailyViews[key] !== undefined) dailyViews[key]++;
      });
    }
    if (Array.isArray(sessions)) {
      sessions.forEach((s: any) => {
        const key = s.started_at.split("T")[0];
        if (dailyUnique[key]) dailyUnique[key].add(s.visitor_id);
        if (dailySessionCounts[key] !== undefined) dailySessionCounts[key]++;
        if (s.ended_at && dailyDurations[key]) {
          const dur = (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 1000;
          dailyDurations[key].push(dur);
        }
      });
    }
    if (Array.isArray(events)) {
      events.forEach((e: any) => {
        if (e.event_type === "contact_click" || e.event_type === "email_click") {
          const key = e.created_at.split("T")[0];
          if (dailyContactEvents[key] !== undefined) dailyContactEvents[key]++;
        }
      });
    }

    const chartLabels = Object.keys(dailyViews);
    const chartViews = Object.values(dailyViews);
    const chartUnique = chartLabels.map((k) => dailyUnique[k]?.size || 0);
    const chartDuration = chartLabels.map((k) => {
      const durs = dailyDurations[k] || [];
      return durs.length > 0 ? Math.round(durs.reduce((a, b) => a + b, 0) / durs.length) : 0;
    });
    const chartContactRate = chartLabels.map((k) => {
      const sc = dailySessionCounts[k] || 0;
      const ce = dailyContactEvents[k] || 0;
      return sc > 0 ? Math.round((ce / sc) * 100) : 0;
    });

    // ===== CONVERSIONS =====
    const conversionCounts: Record<string, number> = {};
    if (Array.isArray(events)) {
      events.forEach((e: any) => {
        conversionCounts[e.event_type] = (conversionCounts[e.event_type] || 0) + 1;
      });
    }

    // ===== REGIONS =====
    const regionCounts: Record<string, number> = {};
    if (Array.isArray(sessions)) {
      sessions.forEach((s: any) => {
        if (s.country) regionCounts[s.country] = (regionCounts[s.country] || 0) + 1;
      });
    }
    const topRegions = Object.entries(regionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([country, count]) => ({ country, count }));

    // ===== VISITORS (new vs returning) =====
    const newVisitors = Array.isArray(sessions) ? sessions.filter((s: any) => s.is_new_visitor).length : 0;
    const returningVisitors = Array.isArray(sessions) ? sessions.length - newVisitors : 0;

    // ===== LIVE ACTIVITY =====
    const recentActivity = Array.isArray(pageViews)
      ? pageViews.slice(0, 10).map((pv: any) => ({
          page: pv.page,
          city: pv.city,
          country: pv.country,
          device: pv.device,
          time: pv.created_at,
        }))
      : [];

    // ===== PROJECTS =====
    const projectEvents: Record<string, { views: number; engagement: number }> = {};
    if (Array.isArray(events)) {
      events
        .filter((e: any) => e.event_type === "project_view")
        .forEach((e: any) => {
          const name = e.event_data?.project || "Unknown";
          if (!projectEvents[name]) projectEvents[name] = { views: 0, engagement: 0 };
          projectEvents[name].views++;
        });
    }

    // ===== REFERRERS / TRAFFIC SOURCES =====
    const referrerCounts: Record<string, number> = {};
    if (Array.isArray(pageViews)) {
      pageViews.forEach((pv: any) => {
        const ref = pv.referrer || "";
        if (!ref) {
          referrerCounts["Direct"] = (referrerCounts["Direct"] || 0) + 1;
          return;
        }
        try {
          const domain = new URL(ref).hostname.replace("www.", "");
          referrerCounts[domain] = (referrerCounts[domain] || 0) + 1;
        } catch {
          referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;
        }
      });
    }
    const topReferrers = Object.entries(referrerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([source, count]) => ({ source, count }));

    // ===== DEVICE BREAKDOWN =====
    const deviceCounts: Record<string, number> = {};
    if (Array.isArray(sessions)) {
      sessions.forEach((s: any) => {
        const dev = s.device || "unknown";
        deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;
      });
    }

    // ===== BROWSER BREAKDOWN =====
    const browserCounts: Record<string, number> = {};
    if (Array.isArray(sessions)) {
      sessions.forEach((s: any) => {
        const br = s.browser || "Unknown";
        browserCounts[br] = (browserCounts[br] || 0) + 1;
      });
    }

    // ===== HOURLY DISTRIBUTION =====
    const hourlyViews = new Array(24).fill(0);
    if (Array.isArray(pageViews)) {
      pageViews.forEach((pv: any) => {
        const hour = new Date(pv.created_at).getUTCHours();
        hourlyViews[hour]++;
      });
    }

    // ===== DAY x HOUR HEATMAP (7 days x 24 hours) =====
    const heatmap: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
    if (Array.isArray(pageViews)) {
      pageViews.forEach((pv: any) => {
        const d = new Date(pv.created_at);
        heatmap[d.getUTCDay()][d.getUTCHours()]++;
      });
    }

    // ===== CONVERSION FUNNEL =====
    const sessionIdSet = new Set(Array.isArray(sessions) ? sessions.map((s: any) => s.id) : []);
    const scrolledSessions = new Set<string>();
    const projectSessions = new Set<string>();
    const contactSessions = new Set<string>();
    if (Array.isArray(events)) {
      events.forEach((e: any) => {
        if (e.event_type === "scroll_depth") scrolledSessions.add(e.session_id);
        if (e.event_type === "project_view") projectSessions.add(e.session_id);
        if (e.event_type === "contact_click" || e.event_type === "email_click")
          contactSessions.add(e.session_id);
      });
    }

    // ===== AVERAGE TIME PER PAGE =====
    const pageSessionMap: Record<string, Set<string>> = {};
    if (Array.isArray(pageViews)) {
      pageViews.forEach((pv: any) => {
        if (!pageSessionMap[pv.page]) pageSessionMap[pv.page] = new Set();
        pageSessionMap[pv.page].add(pv.session_id);
      });
    }
    const sessionDurMap: Record<string, number> = {};
    if (Array.isArray(sessions)) {
      sessions.forEach((s: any) => {
        if (s.ended_at) {
          sessionDurMap[s.id] = (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 1000;
        }
      });
    }
    const timePerPage: { page: string; avg_time: number; views: number }[] = [];
    Object.entries(pageSessionMap).forEach(([page, sids]) => {
      const durations = Array.from(sids)
        .map((sid) => sessionDurMap[sid])
        .filter((d) => d !== undefined);
      if (durations.length > 0) {
        timePerPage.push({
          page,
          avg_time: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
          views: pageCounts[page] || 0,
        });
      }
    });
    timePerPage.sort((a, b) => b.views - a.views);

    // ===== BUILD RESPONSE =====
    const data = {
      overview: {
        total_views: totalViews,
        unique_visitors: uniqueVisitors,
        avg_session_duration: avgDuration,
        contact_rate: parseFloat(contactRate as string),
        avg_scroll_depth: avgScroll,
        bounce_rate: bounceRate,
      },
      trends: {
        views: calcTrend(totalViews, prevTotalViews),
        unique: calcTrend(uniqueVisitors, prevUniqueVisitors),
        duration: calcTrend(avgDuration, prevAvgDuration),
        contact_rate: calcTrend(parseFloat(contactRate as string), prevContactRate),
        bounce_rate: calcTrend(bounceRate, prevBounceRate),
      },
      chart: {
        labels: chartLabels,
        views: chartViews,
        unique: chartUnique,
        duration: chartDuration,
        contact_rate: chartContactRate,
      },
      top_pages: topPages,
      conversions: conversionCounts,
      regions: topRegions,
      visitors: { new: newVisitors, returning: returningVisitors },
      live_activity: recentActivity,
      projects: projectEvents,
      referrers: topReferrers,
      devices: deviceCounts,
      browsers: browserCounts,
      hourly: hourlyViews,
      heatmap,
      funnel: {
        visits: sessionIdSet.size,
        scrolled: scrolledSessions.size,
        project_views: projectSessions.size,
        contacted: contactSessions.size,
      },
      time_per_page: timePerPage,
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
