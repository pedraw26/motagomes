/**
 * Portfolio Analytics Tracker
 * Lightweight, privacy-respecting analytics for pedraw.co.uk
 */
(function () {
  "use strict";

  const ENDPOINT = "/api/track";

  // Generate or retrieve visitor ID (localStorage persists across sessions)
  function getVisitorId() {
    let id = localStorage.getItem("_pa_vid");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("_pa_vid", id);
      return { id, isNew: true };
    }
    return { id, isNew: false };
  }

  // Generate session ID (sessionStorage resets per tab)
  function getSessionId() {
    let id = sessionStorage.getItem("_pa_sid");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("_pa_sid", id);
    }
    return id;
  }

  // Detect device type
  function getDevice() {
    const w = window.innerWidth;
    if (w <= 768) return "mobile";
    if (w <= 1024) return "tablet";
    return "desktop";
  }

  // Get browser name
  function getBrowser() {
    const ua = navigator.userAgent;
    if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
    if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Edg")) return "Edge";
    return "Other";
  }

  // Send data to API (fire and forget, never blocks UI)
  function send(data) {
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(ENDPOINT, JSON.stringify(data));
      } else {
        fetch(ENDPOINT, {
          method: "POST",
          body: JSON.stringify(data),
          keepalive: true,
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch (e) {
      // Silently fail - never impact user experience
    }
  }

  // Don't track bots or prerender
  if (navigator.webdriver || document.visibilityState === "prerender") return;

  const visitor = getVisitorId();
  const sessionId = getSessionId();
  const device = getDevice();
  const browser = getBrowser();

  // Get current page section from URL hash or path
  function getCurrentPage() {
    const hash = window.location.hash.replace("#", "");
    if (hash) return hash;
    const path = window.location.pathname;
    if (path === "/" || path === "/index.html") return "home";
    return path.replace(/^\/|\/$/g, "");
  }

  // Track page view
  send({
    type: "pageview",
    session_id: sessionId,
    visitor_id: visitor.id,
    page: getCurrentPage(),
    referrer: document.referrer || null,
    device: device,
    browser: browser,
    is_new: visitor.isNew,
  });

  // Track scroll depth (debounced, fires at 25%, 50%, 75%, 100%)
  let maxScroll = 0;
  const scrollThresholds = [25, 50, 75, 100];
  let firedThresholds = new Set();

  function trackScroll() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    const percent = Math.round((scrollTop / docHeight) * 100);

    if (percent > maxScroll) {
      maxScroll = percent;
      for (const t of scrollThresholds) {
        if (percent >= t && !firedThresholds.has(t)) {
          firedThresholds.add(t);
          send({
            type: "event",
            session_id: sessionId,
            visitor_id: visitor.id,
            event_type: "scroll_depth",
            event_data: { depth: t },
            page: getCurrentPage(),
          });
        }
      }
    }
  }

  let scrollTimer;
  window.addEventListener(
    "scroll",
    function () {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(trackScroll, 200);
    },
    { passive: true }
  );

  // Track clicks on key elements
  document.addEventListener("click", function (e) {
    const target = e.target.closest("a, button, .gallery-card");
    if (!target) return;

    // Contact/email clicks
    const href = target.getAttribute("href") || "";
    if (href.startsWith("mailto:")) {
      send({
        type: "event",
        session_id: sessionId,
        visitor_id: visitor.id,
        event_type: "email_click",
        event_data: {},
        page: getCurrentPage(),
      });
      return;
    }

    // External link clicks (social, etc.)
    if (href.startsWith("http") && !href.includes(window.location.hostname)) {
      let channel = "external";
      if (href.includes("instagram")) channel = "instagram";
      else if (href.includes("linkedin")) channel = "linkedin";
      else if (href.includes("youtube")) channel = "youtube";
      else if (href.includes("spotify")) channel = "spotify";

      send({
        type: "event",
        session_id: sessionId,
        visitor_id: visitor.id,
        event_type: "social_click",
        event_data: { channel, url: href },
        page: getCurrentPage(),
      });
      return;
    }

    // Contact CTA clicks
    if (
      target.textContent?.includes("Let's Talk") ||
      target.classList.contains("menu-overlay-cta")
    ) {
      send({
        type: "event",
        session_id: sessionId,
        visitor_id: visitor.id,
        event_type: "contact_click",
        event_data: {},
        page: getCurrentPage(),
      });
      return;
    }

    // Project card clicks
    if (target.closest(".gallery-card")) {
      const card = target.closest(".gallery-card");
      const projectName =
        card.querySelector(".gallery-card-title")?.textContent || "Unknown";
      send({
        type: "event",
        session_id: sessionId,
        visitor_id: visitor.id,
        event_type: "project_view",
        event_data: { project: projectName },
        page: getCurrentPage(),
      });
    }
  });

  // Track hash changes (section navigation)
  window.addEventListener("hashchange", function () {
    send({
      type: "pageview",
      session_id: sessionId,
      visitor_id: visitor.id,
      page: getCurrentPage(),
      referrer: null,
      device: device,
      browser: browser,
      is_new: false,
    });
  });

  // End session on page leave
  function endSession() {
    send({
      type: "session_end",
      session_id: sessionId,
    });
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
      endSession();
    }
  });
})();
