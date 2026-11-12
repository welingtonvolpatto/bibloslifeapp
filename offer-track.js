/* VEREDA — offer page funnel tracking (shared by all quizzes).
   Call OFFER_TRACK({url, key, sid, quiz, bot, view, getPlan}) right after the offer screen is rendered.
   Each event is logged once per session (table offer_events, unique sid+quiz+ev). */
(function () {
  var SECTIONS = [
    ["s_journey", ".o-journey"],   // week-by-week plan preview
    ["s_benefits", ".o-get"],      // "What you get"
    ["s_prices", "#pA"],           // first price block
    ["s_day", ".dx"],              // "What a day with VEREDA feels like"
    ["s_faq", ".faq"],             // FAQ
    ["s_reviews", ".o-rev"],       // reviews
    ["s_prices2", "#pB"]           // bottom price block
  ];
  var TIMES = [15, 30, 60, 120, 300];

  window.OFFER_TRACK = function (o) {
    if (!o || o.bot || !o.sid || !o.quiz) return;
    var sent = window.__otSent = window.__otSent || {};   // shared across re-renders of the offer
    var device = matchMedia("(pointer:coarse)").matches ? "mobile" : "desktop";
    function send(ev, plan) {
      if (sent[ev]) return; sent[ev] = 1;
      if (window.clarity && /^(view|s_prices|plan_change|faq_open|top_cta|buy|buy_confirm)$/.test(ev)) { try { clarity("event", "offer_" + ev); if (ev === "view") clarity("set", "offer", "seen"); if (ev === "buy") clarity("set", "checkout", "clicked"); } catch (e) {} }
      try {
        fetch(o.url, {
          method: "POST", keepalive: true,
          headers: { apikey: o.key, "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({ sid: o.sid, quiz: o.quiz, ev: ev, device: device, plan: plan == null ? null : plan })
        }).catch(function () {});
      } catch (e) {}
    }
    var root = o.view || document;
    send("view");

    // sections seen (at least 35% visible)
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { send(e.target.__ev); io.unobserve(e.target); } });
      }, { threshold: 0.35 });
      SECTIONS.forEach(function (s) { var el = root.querySelector(s[1]); if (el) { el.__ev = s[0]; io.observe(el); } });
    }

    // scroll depth
    var marks = [25, 50, 75, 100];
    function onScroll() {
      if (!document.body.contains(root.querySelector("#pB"))) { removeEventListener("scroll", onScroll); return; }
      var h = document.documentElement.scrollHeight - innerHeight;
      var pct = h > 0 ? (scrollY / h) * 100 : 100;
      marks.forEach(function (m) { if (pct >= m - 2) send("scroll_" + m); });
    }
    addEventListener("scroll", onScroll, { passive: true });

    // time on page (only while the tab is visible)
    var secs = 0, timer = setInterval(function () {
      if (!document.body.contains(root.querySelector("#pB"))) return clearInterval(timer);
      if (document.visibilityState !== "visible") return;
      secs++;
      TIMES.forEach(function (t) { if (secs >= t) send("t" + t); });
      if (secs >= 300) clearInterval(timer);
    }, 1000);

    // interactions
    if (root.__otBound) return; root.__otBound = true;   // listeners below are attached once
    root.addEventListener("click", function (e) {
      var t = e.target;
      if (t.closest("#getPlan")) send("top_cta");
      var plan = t.closest(".o-plan");
      if (plan) { var i = +plan.dataset.i; if (i !== o.getPlan0) send("plan_change"); send("plan_" + i, i); }
      var sum = t.closest(".faq summary");
      if (sum) { var k = Array.prototype.indexOf.call(root.querySelectorAll(".faq summary"), sum); send("faq_open"); send("faq_" + k); }
      if (t.closest(".o-journey .tabs button")) send("weeks_tab");
      if (t.closest(".dx-tab")) send("day_tab");
      if (t.closest("button.sub")) { var p = o.getPlan ? o.getPlan() : null; send("buy", p); }
      if (t.closest(".co-go")) send("buy_confirm", o.getPlan ? o.getPlan() : null);
      if (t.closest(".co-x")) send("buy_back");
    }, true);
  };
})();
