/**
 * nav.js — single shared site nav, injected on every page.
 * Canonical layout: London clock (left) · MⒼ logo (center) · Work·About·Research·Gen Studies (right).
 * Self-contained: own scoped CSS, EB Garamond, London clock. Removes any pre-existing
 * <header class="header"> so there's exactly one nav and it's identical everywhere.
 */
(function () {
  "use strict";
  if (window.__mgNavLoaded) return;
  window.__mgNavLoaded = true;

  // EB Garamond for the clock (only if a page hasn't already loaded it)
  if (!document.querySelector('link[href*="EB+Garamond"], style[data-eb-garamond]')) {
    var lf = document.createElement("link");
    lf.rel = "stylesheet";
    lf.href = "https://fonts.googleapis.com/css2?family=EB+Garamond:wght@500&display=swap";
    document.head.appendChild(lf);
  }

  var css =
    ".mg-nav{position:fixed;top:0;left:0;right:0;z-index:1000;background:transparent;" +
    "backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);" +
    "-webkit-mask-image:linear-gradient(to bottom,#000 55%,rgba(0,0,0,0) 100%);" +
    "mask-image:linear-gradient(to bottom,#000 55%,rgba(0,0,0,0) 100%);}" +
    ".mg-nav .mg-nav-content{width:100%;padding:28px 32px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;box-sizing:border-box;}" +
    ".mg-nav #navClock{font-family:'EB Garamond',Georgia,'Times New Roman',serif;font-style:normal;font-weight:500;font-size:17px;letter-spacing:.02em;color:rgba(255,255,255,.6);font-variant-numeric:tabular-nums;line-height:1;justify-self:start;}" +
    ".mg-nav .mg-nav-logo{justify-self:center;font-size:16px;font-weight:400;letter-spacing:.04em;color:#fff;text-decoration:none;display:inline-flex;align-items:center;gap:6px;opacity:.92;transition:opacity .2s ease;}" +
    ".mg-nav .mg-nav-logo:hover{opacity:1;}" +
    ".mg-nav .mg-nav-logo .mg-g{font-size:1.22em;line-height:1;vertical-align:-.08em;}" +
    ".mg-nav .mg-nav-links{justify-self:end;display:flex;align-items:center;gap:28px;}" +
    ".mg-nav .mg-nav-links a{font-size:.95rem;color:rgba(255,255,255,.9);text-decoration:none;font-weight:400;letter-spacing:-.005em;position:relative;line-height:1;display:inline-flex;align-items:center;transition:color .3s ease;}" +
    ".mg-nav .mg-nav-links a::before{content:'';position:absolute;bottom:-6px;left:0;right:0;height:1px;background:currentColor;transform:scaleX(0);transform-origin:center;transition:transform .35s cubic-bezier(.22,1,.36,1);}" +
    ".mg-nav .mg-nav-links a:hover::before,.mg-nav .mg-nav-links a.is-current::before{transform:scaleX(1);}" +
    ".mg-nav .mg-nav-links a.is-current{color:#fff;}" +
    ".mg-nav .mg-nav-links a.nav-gen{background-image:linear-gradient(90deg,#ff7a7a,#ffb347,#ffe66d,#6ee7b7,#67c8ff,#c084fc,#ff7a7a);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;animation:mg-aislop 6s linear infinite;}" +
    "@keyframes mg-aislop{from{background-position:0% 50%}to{background-position:-200% 50%}}" +
    "@media (max-width:640px){.mg-nav #navClock{display:none}.mg-nav .mg-nav-links{gap:16px}.mg-nav .mg-nav-links a{font-size:.8rem}.mg-nav .mg-nav-content{padding:20px}}" +
    "@media (prefers-reduced-motion:reduce){.mg-nav .mg-nav-links a.nav-gen{animation:none}}";

  if (!document.getElementById("mg-nav-style")) {
    var st = document.createElement("style");
    st.id = "mg-nav-style";
    st.textContent = css;
    document.head.appendChild(st);
  }

  function build() {
    // Drop any bespoke header so there's exactly one, identical nav
    var olds = document.querySelectorAll("header.header");
    for (var i = 0; i < olds.length; i++) olds[i].remove();

    var path = location.pathname;
    if (path === "/" || path === "/index.html") path = "/portfolio.html";

    var links = [
      { label: "Work", href: "/portfolio.html#work", match: "/portfolio.html" },
      { label: "About", href: "/about.html", match: "/about.html" },
      { label: "Research", href: "/research.html", match: "/research.html" },
      { label: "Gen Studies", href: "/gen-studio.html", match: "/gen-studio.html", cls: "nav-gen" },
    ];

    var navHTML = links
      .map(function (l) {
        var classes = [];
        if (l.cls) classes.push(l.cls);
        if (path === l.match) classes.push("is-current");
        var c = classes.length ? ' class="' + classes.join(" ") + '"' : "";
        return '<a href="' + l.href + '"' + c + ">" + l.label + "</a>";
      })
      .join("");

    var header = document.createElement("header");
    header.className = "mg-nav";
    header.innerHTML =
      '<div class="mg-nav-content">' +
      '<div id="navClock">00:00</div>' +
      '<a class="mg-nav-logo" href="/portfolio.html" aria-label="Home"><span>M<span class="mg-g">Ⓖ</span></span></a>' +
      '<nav class="mg-nav-links" aria-label="Primary">' + navHTML + "</nav>" +
      "</div>";
    document.body.insertBefore(header, document.body.firstChild);

    function tick() {
      var el = document.getElementById("navClock");
      if (!el) return;
      el.textContent = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/London",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date());
    }
    tick();
    setInterval(tick, 15000);
  }

  if (document.body) build();
  else document.addEventListener("DOMContentLoaded", build);
})();
