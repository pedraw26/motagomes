/* ============================================================
   guard.js — image right-click guard for the main site.
   If someone tries to open the context menu on an <img>, swallow
   the event and flash a small "GOTCHA 👀" toast near the cursor.
   Scoped to <img>, <picture>, and any element with [data-no-rclick]
   so links/UI still behave normally.
   ============================================================ */
(function () {
    'use strict';

    // One toast element, reused
    var toast;
    function ensureToast() {
        if (toast) return toast;
        toast = document.createElement('div');
        toast.setAttribute('aria-hidden', 'true');
        toast.style.cssText = [
            'position:fixed',
            'z-index:2147483647',
            'pointer-events:none',
            'transform:translate(-50%,-120%) scale(0.9)',
            'padding:8px 14px',
            'border-radius:999px',
            'background:rgba(10,10,10,0.92)',
            'color:#ffffff',
            'font-family:-apple-system,BlinkMacSystemFont,\'SF Pro Display\',\'SF Pro Text\',\'Helvetica Neue\',sans-serif',
            'font-size:12px',
            'font-weight:600',
            'letter-spacing:0.12em',
            'text-transform:uppercase',
            'white-space:nowrap',
            'box-shadow:0 10px 30px -6px rgba(0,0,0,0.45)',
            'opacity:0',
            'transition:opacity 180ms ease, transform 220ms cubic-bezier(0.22,1,0.36,1)'
        ].join(';');
        toast.textContent = 'Gotcha 👀';
        document.body.appendChild(toast);
        return toast;
    }

    var hideTimer;
    function flash(x, y) {
        var t = ensureToast();
        t.style.left = x + 'px';
        t.style.top = y + 'px';
        // force reflow, then pop in
        t.offsetWidth; // eslint-disable-line
        t.style.opacity = '1';
        t.style.transform = 'translate(-50%,-130%) scale(1)';
        clearTimeout(hideTimer);
        hideTimer = setTimeout(function () {
            t.style.opacity = '0';
            t.style.transform = 'translate(-50%,-120%) scale(0.95)';
        }, 1400);
    }

    function isGuarded(el) {
        if (!el) return false;
        if (el.tagName === 'IMG' || el.tagName === 'PICTURE') return true;
        if (el.closest && (el.closest('img,picture,[data-no-rclick]'))) return true;
        return false;
    }

    document.addEventListener('contextmenu', function (e) {
        if (!isGuarded(e.target)) return;
        e.preventDefault();
        flash(e.clientX, e.clientY);
    }, { capture: true });

    // Long-press on mobile → treat like context menu
    var lp;
    document.addEventListener('touchstart', function (e) {
        if (!isGuarded(e.target)) return;
        var t = e.touches[0];
        if (!t) return;
        var x = t.clientX, y = t.clientY;
        lp = setTimeout(function () { flash(x, y); }, 500);
    }, { passive: true });
    document.addEventListener('touchend',    function () { clearTimeout(lp); }, { passive: true });
    document.addEventListener('touchmove',   function () { clearTimeout(lp); }, { passive: true });
    document.addEventListener('touchcancel', function () { clearTimeout(lp); }, { passive: true });

    // Best-effort drag-protect on images (not bulletproof — anyone can still
    // View Source / DevTools — but it makes casual saving a little harder).
    document.addEventListener('dragstart', function (e) {
        if (e.target && e.target.tagName === 'IMG') e.preventDefault();
    }, { capture: true });
})();
