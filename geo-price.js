/* Country-based pricing for the VEREDA quizzes.
   - Asks /api/geo for the visitor's country, currency and USD rate (cached for the session).
   - Converts the USD plan prices to the local currency for display.
   - Exact local prices can be set per currency in CONFIG.localPrices, e.g.
       localPrices: { BRL: [ {price:49.90, checkoutUrl:"https://pay.hotmart.com/...?off=..."}, {...}, {...} ] }
     (one entry per plan, same order as CONFIG.plans; compareAt optional).
     When a currency has exact prices, they are shown as-is with no "estimate" note.
   - If anything fails, everything stays in USD. */
(function () {
  var KEY = "vq_geo_v1";
  var D = { country: null, currency: "USD", rate: 1 };
  try { var s = JSON.parse(sessionStorage.getItem(KEY) || "null"); if (s && s.currency) D = s; } catch (e) {}

  var qs = new URLSearchParams(location.search);
  var forced = (qs.get("cur") || "").toUpperCase(); // testing: ?cur=BRL&rate=5.4
  var forcedCC = (qs.get("cc") || "").toUpperCase(); // testing: ?cc=IN (price tier only)

  /* Price tiers (English quizzes). High-income countries keep the plans in CONFIG.plans;
     every other country gets LOW_PLANS (half price, own Hotmart offers), same order as CONFIG.plans. */
  var HIGH = ["US","CA","GB","IE","AU","NZ","DE","FR","NL","BE","LU","AT","CH","LI","MC","DK","SE","NO","FI","IS",
              "SG","HK","JP","KR","IL","AE","QA","KW"];
  var LOW_PLANS = [
    { checkoutUrl: "https://pay.hotmart.com/F108347453I?off=2wnf0nfg", price: 9.90,
      terms: "Free for 7 days, then $9.90 every month until you cancel. Cancel anytime before the trial ends and you won\u2019t be charged." },
    { checkoutUrl: "https://pay.hotmart.com/F108347453I?off=bajasnd1", price: 9.90,
      terms: "$9.90 today, then $9.90 every month until you cancel." },
    { checkoutUrl: "https://pay.hotmart.com/F108347453I?off=6t2xvgdg", price: 19.90, compareAt: 29.70,
      terms: "$19.90 today, then $19.90 every 3 months until you cancel." }
  ];
  function country() { return forcedCC || D.country || ""; }
  function isLow() { var c = country(); return !!c && c !== "TEST" && HIGH.indexOf(c) < 0; }
  function applyTier(c) {
    if (!c || c.__tierDone || !Array.isArray(c.plans) || c.plans.length !== LOW_PLANS.length || !isLow()) return;
    c.plans.forEach(function (p, i) { for (var k in LOW_PLANS[i]) p[k] = LOW_PLANS[i][k]; });
    c.__tierDone = true;
  }

  var ready = (D.country && !forced) ? Promise.resolve(D) :
    fetch("/api/geo", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) {
      if (j && j.currency && j.rate) D = { country: j.country, currency: j.currency, rate: Number(j.rate) };
      if (forced) D = { country: "TEST", currency: forced, rate: Number(qs.get("rate")) || D.rate };
      try { sessionStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {}
      applyTier(_cfg);
      return D;
    }).catch(function () { return D; });

  function cfg() { return (V.cfg && V.cfg.localPrices) || {}; }
  function exact() { var l = cfg()[D.currency]; return Array.isArray(l) && l.length ? l : null; }
  function locale() { return (navigator.languages && navigator.languages[0]) || navigator.language || "en-US"; }
  function nf() {
    try { return new Intl.NumberFormat(locale(), { style: "currency", currency: D.currency }); }
    catch (e) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }); }
  }
  function digits() { return nf().resolvedOptions().maximumFractionDigits; }
  function round(v) { var f = Math.pow(10, digits()); return Math.round(v * f) / f; }

  var _cfg = null;
  var V = {
    ready: ready,
    get cfg() { return _cfg; },
    set cfg(c) { _cfg = c; applyTier(c); },
    get tier() { return isLow() ? "low" : "high"; },
    get currency() { return D.currency; },
    get country() { return country() || null; },
    isLocal: function () { return D.currency !== "USD"; },
    isEstimate: function () { return D.currency !== "USD" && !exact(); },
    // Local value of a plan field ("price" | "compareAt") for plan index i.
    plan: function (p, i, field) {
      field = field || "price";
      var ex = exact();
      if (ex && ex[i] && ex[i][field] != null) return Number(ex[i][field]);
      if (ex && ex[i] && field === "compareAt" && p.compareAt && p.price) return round(ex[i].price * p.compareAt / p.price);
      var usd = Number(p[field]);
      return D.currency === "USD" ? usd : round(usd * D.rate);
    },
    // Checkout link for plan i (exact local offer if set, otherwise the plan's own link).
    checkout: function (p, i) { var ex = exact(); return (ex && ex[i] && ex[i].checkoutUrl) || p.checkoutUrl; },
    money: function (v) { return nf().format(Number(v) || 0); },
    // {sym, int, dec} for the big "per day" price layout.
    parts: function (v) {
      var sym = "", int = "", dec = "", sep = false;
      nf().formatToParts(Number(v) || 0).forEach(function (x) {
        if (x.type === "currency") sym = x.value;
        else if (x.type === "integer" || x.type === "group") int += x.value;
        else if (x.type === "fraction") dec = x.value;
      });
      return { sym: sym, int: int, dec: digits() ? (dec || "00") : "" };
    },
    // Plan terms text with the USD amounts swapped for local ones.
    terms: function (p, i) {
      var txt = p.terms || "";
      if (D.currency === "USD" && !exact()) return txt;
      return txt.replace(/\$(\d+(?:\.\d+)?)/g, function (m, v) {
        v = Number(v);
        if (p.price && Math.abs(v - Number(p.price)) < 0.001) return V.money(V.plan(p, i, "price"));
        return V.money(D.currency === "USD" ? v : round(v * D.rate));
      });
    },
    note: function () {
      if (!V.isEstimate()) return "";
      return '<p class="geo-note" style="font-size:11.5px;line-height:1.4;color:#6b6f76;text-align:center;margin:10px 4px 0">Prices shown in ' +
        D.currency + " are converted from USD and may vary slightly. The final amount is shown at checkout.</p>";
    }
  };
  window.VPRICE = V;
})();
