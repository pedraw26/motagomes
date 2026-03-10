import type { Context, Config } from "@netlify/functions";

const SUPABASE_URL = Netlify.env.get("SUPABASE_URL") || "";
const SUPABASE_KEY = Netlify.env.get("SUPABASE_SERVICE_KEY") || "";

async function supabase(table: string, data: any) {
  return fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(data),
  });
}

async function upsertSession(session: any) {
  return fetch(`${SUPABASE_URL}/rest/v1/sessions?id=eq.${session.id}`, {
    method: "GET",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  }).then(async (res) => {
    const existing = await res.json();
    if (existing.length > 0) {
      // Update existing session
      return fetch(`${SUPABASE_URL}/rest/v1/sessions?id=eq.${session.id}`, {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          ended_at: new Date().toISOString(),
          pages_viewed: session.pages_viewed || existing[0].pages_viewed,
          max_scroll_depth: Math.max(
            session.max_scroll_depth || 0,
            existing[0].max_scroll_depth || 0
          ),
        }),
      });
    } else {
      return supabase("sessions", session);
    }
  });
}

export default async (req: Request, context: Context) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  try {
    const body = await req.json();
    const { type } = body;

    // Get geo info from Netlify context
    const geo = context.geo;
    const country = geo?.country?.name || "Unknown";
    const city = geo?.city || "Unknown";

    if (type === "pageview") {
      const { session_id, visitor_id, page, referrer, device, browser, is_new } = body;

      await Promise.all([
        supabase("page_views", {
          session_id,
          page,
          referrer: referrer || null,
          country,
          city,
          device,
          browser,
          created_at: new Date().toISOString(),
        }),
        upsertSession({
          id: session_id,
          visitor_id,
          started_at: new Date().toISOString(),
          pages_viewed: 1,
          max_scroll_depth: 0,
          country,
          city,
          device,
          browser,
          is_new_visitor: is_new,
        }),
      ]);
    } else if (type === "event") {
      const { session_id, event_type, event_data, page } = body;

      await supabase("events", {
        session_id,
        event_type,
        event_data: event_data || {},
        page,
        created_at: new Date().toISOString(),
      });

      // Update session scroll depth if it's a scroll event
      if (event_type === "scroll_depth" && event_data?.depth) {
        await upsertSession({
          id: session_id,
          visitor_id: body.visitor_id || session_id,
          max_scroll_depth: event_data.depth,
        });
      }
    } else if (type === "session_end") {
      const { session_id } = body;
      await fetch(`${SUPABASE_URL}/rest/v1/sessions?id=eq.${session_id}`, {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ ended_at: new Date().toISOString() }),
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
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
  path: "/api/track",
};
