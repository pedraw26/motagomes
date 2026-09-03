/**
 * Portfolio Analytics Tracker → Supabase
 * Captures: visitor/session, page, referrer, device, browser, IP, geo, network org.
 * Flags traffic from Amazon / AWS networks (is_amazon).
 * Privacy: anon key can only INSERT (never read). Reads are password-gated server-side.
 */
(function () {
  "use strict";

  var SUPABASE_URL = "https://bgsmzkfaxmgwvdupqhlp.supabase.co";
  var ANON =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnc216a2ZheG1nd3ZkdXBxaGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyOTk2NDIsImV4cCI6MjA5Njg3NTY0Mn0.DTIqPhVGJ4wbPbbyFXkeEwyfZ02X5ieCgF4BIJLtQq4";
  var ENDPOINT = SUPABASE_URL + "/rest/v1/hits";

  // Skip bots / prerender
  if (navigator.webdriver || document.visibilityState === "prerender") return;

  function vid() {
    var id = localStorage.getItem("_pa_vid");
    if (!id) { id = crypto.randomUUID(); localStorage.setItem("_pa_vid", id); }
    return id;
  }
  function sid() {
    var id = sessionStorage.getItem("_pa_sid");
    if (!id) { id = crypto.randomUUID(); sessionStorage.setItem("_pa_sid", id); }
    return id;
  }
  function device() {
    var w = window.innerWidth;
    return w <= 768 ? "mobile" : w <= 1024 ? "tablet" : "desktop";
  }
  function browser() {
    var ua = navigator.userAgent;
    if (ua.indexOf("Edg") > -1) return "Edge";
    if (ua.indexOf("Chrome") > -1) return "Chrome";
    if (ua.indexOf("Firefox") > -1) return "Firefox";
    if (ua.indexOf("Safari") > -1) return "Safari";
    return "Other";
  }
  function page() {
    var h = location.hash.replace("#", "");
    if (h) return h;
    var p = location.pathname;
    if (p === "/" || p === "/index.html") return "home";
    p = p.replace(/^\/|\/$/g, "") || "home";
    // include the project slug so each case study is tracked distinctly
    if (p === "project" || p === "project.html") {
      try {
        var sp = new URLSearchParams(location.search).get("p");
        if (sp) return "project/" + sp;
      } catch (e) {}
    }
    return p;
  }

  var visitor = vid(), session = sid(), dev = device(), br = browser();

  // Admin device flag — open any page with ?admin=1 once to mark THIS device/browser as yours
  // (reliable even on shared carrier/mobile IPs). ?admin=0 clears it.
  var IS_ADMIN = false;
  try {
    if (/[?&]admin=1(?:&|$)/.test(location.search)) localStorage.setItem("_pa_admin", "1");
    if (/[?&]admin=0(?:&|$)/.test(location.search)) localStorage.removeItem("_pa_admin");
    IS_ADMIN = localStorage.getItem("_pa_admin") === "1";
  } catch (e) {}
  function orgOut(org) { return IS_ADMIN ? ((org || "") + " [MG-ADMIN]") : org; }

  function insert(row) {
    try {
      fetch(ENDPOINT, {
        method: "POST",
        keepalive: true,
        headers: {
          apikey: ANON,
          Authorization: "Bearer " + ANON,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(row),
      });
    } catch (e) {}
  }

  // Look up IP / geo / network org once per session (cached), so we don't hammer the API.
  // ipwho.is: HTTPS, free, returns connection.org / connection.isp / asn.
  function getNet(cb) {
    var cached = sessionStorage.getItem("_pa_net");
    if (cached) { try { return cb(JSON.parse(cached)); } catch (e) {} }
    fetch("https://ipwho.is/")
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || d.success === false) throw new Error("geo failed");
        var conn = d.connection || {};
        var net = {
          ip: d.ip || null,
          city: d.city || null,
          region: d.region || null,
          country: d.country || null,
          org: conn.org || conn.isp || null,
          isp: conn.isp || "",
        };
        try { sessionStorage.setItem("_pa_net", JSON.stringify(net)); } catch (e) {}
        cb(net);
      })
      .catch(function () {
        cb({ ip: null, city: null, region: null, country: null, org: null, isp: "" });
      });
  }

  function isAmazon(net) {
    var s = ((net.org || "") + " " + (net.isp || "")).toLowerCase();
    return /amazon|aws|a2z/.test(s);
  }

  function track() {
    getNet(function (net) {
      insert({
        visitor_id: visitor,
        session_id: session,
        page: page(),
        referrer: document.referrer || null,
        device: dev,
        browser: br,
        ip: net.ip,
        city: net.city,
        region: net.region,
        country: net.country,
        org: orgOut(net.org),
        is_amazon: isAmazon(net),
      });
    });
  }

  track();
  window.addEventListener("hashchange", track);

  // Conversion events: log CTA clicks as hits with page "cta/<type>".
  // These flow into the same table and surface in get_stats by_page / recent.
  function ctaLabel(href) {
    if (/^mailto:/i.test(href)) return "email";
    if (/cv\.pdf/i.test(href)) return "cv";
    if (/linkedin\.com/i.test(href)) return "linkedin";
    if (/wa\.me|whatsapp|api\.whatsapp/i.test(href)) return "whatsapp";
    if (/^tel:/i.test(href)) return "phone";
    return null;
  }
  document.addEventListener(
    "click",
    function (e) {
      var a = e.target && e.target.closest ? e.target.closest("a") : null;
      if (!a) return;
      var label = ctaLabel(a.getAttribute("href") || "");
      if (!label) return;
      var src = page();
      getNet(function (net) {
        insert({
          visitor_id: visitor,
          session_id: session,
          page: "cta/" + label,
          referrer: src,
          device: dev,
          browser: br,
          ip: net.ip,
          city: net.city,
          region: net.region,
          country: net.country,
          org: net.org,
          is_amazon: isAmazon(net),
        });
      });
    },
    true
  );

  // Engagement: max scroll depth + dwell time, sent once when the page is hidden/closed.
  var startT = Date.now(), maxScroll = 0, sentEngage = false;
  function scrollPct() {
    var doc = document.documentElement, b = document.body || doc;
    var st = window.pageYOffset || doc.scrollTop || 0;
    var vh = window.innerHeight || doc.clientHeight || 0;
    var dh = Math.max(b.scrollHeight, doc.scrollHeight, b.offsetHeight, doc.offsetHeight, vh);
    if (dh <= vh) return 100;
    return Math.min(100, Math.round(((st + vh) / dh) * 100));
  }
  window.addEventListener(
    "scroll",
    function () { var p = scrollPct(); if (p > maxScroll) maxScroll = p; },
    { passive: true }
  );
  function sendEngage() {
    if (sentEngage) return;
    sentEngage = true;
    var dur = Math.round((Date.now() - startT) / 1000);
    if (maxScroll === 0) maxScroll = scrollPct();
    try {
      fetch(SUPABASE_URL + "/rest/v1/rpc/log_engagement", {
        method: "POST",
        keepalive: true,
        headers: {
          apikey: ANON,
          Authorization: "Bearer " + ANON,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          p_session: session,
          p_page: page(),
          p_duration: dur,
          p_scroll: maxScroll,
        }),
      });
    } catch (e) {}
  }
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") sendEngage();
  });
  window.addEventListener("pagehide", sendEngage);
})();
