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
    return p.replace(/^\/|\/$/g, "") || "home";
  }

  var visitor = vid(), session = sid(), dev = device(), br = browser();

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

  // Look up IP / geo / network org once per session (cached), so we don't hammer the API
  function getNet(cb) {
    var cached = sessionStorage.getItem("_pa_net");
    if (cached) { try { return cb(JSON.parse(cached)); } catch (e) {} }
    fetch("https://ipapi.co/json/")
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var net = {
          ip: d.ip || null,
          city: d.city || null,
          region: d.region || null,
          country: d.country_name || null,
          org: d.org || d.asn || null,
        };
        try { sessionStorage.setItem("_pa_net", JSON.stringify(net)); } catch (e) {}
        cb(net);
      })
      .catch(function () {
        cb({ ip: null, city: null, region: null, country: null, org: null });
      });
  }

  function isAmazon(org) {
    return !!org && /amazon|aws|a2z|awsdns/i.test(org);
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
        org: net.org,
        is_amazon: isAmazon(net.org),
      });
    });
  }

  track();
  window.addEventListener("hashchange", track);
})();
