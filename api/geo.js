// Returns the visitor's country, local currency and the USD -> local exchange rate.
// Country comes from Vercel's edge (x-vercel-ip-country). Rates come from open.er-api.com,
// cached at the edge for 12h. If anything fails, the quiz simply keeps showing USD.

const CUR = {
  US:"USD", BR:"BRL", MX:"MXN", AR:"ARS", CL:"CLP", CO:"COP", PE:"PEN", UY:"UYU", PY:"PYG", BO:"BOB",
  GT:"GTQ", HN:"HNL", NI:"NIO", CR:"CRC", PA:"USD", DO:"DOP", EC:"USD", SV:"USD", PR:"USD",
  CA:"CAD", GB:"GBP", AU:"AUD", NZ:"NZD", IE:"EUR", ZA:"ZAR", NG:"NGN", KE:"KES", GH:"GHS",
  PH:"PHP", IN:"INR", SG:"SGD", MY:"MYR", ID:"IDR", JP:"JPY", KR:"KRW", HK:"HKD",
  CH:"CHF", NO:"NOK", SE:"SEK", DK:"DKK", PL:"PLN", CZ:"CZK", HU:"HUF", RO:"RON", BG:"BGN",
  AE:"AED", SA:"SAR", IL:"ILS", TR:"TRY", EG:"EGP",
  DE:"EUR", FR:"EUR", ES:"EUR", PT:"EUR", IT:"EUR", NL:"EUR", BE:"EUR", AT:"EUR", FI:"EUR",
  GR:"EUR", SK:"EUR", SI:"EUR", LT:"EUR", LV:"EUR", EE:"EUR", LU:"EUR", MT:"EUR", CY:"EUR", HR:"EUR"
};

let cache = { at: 0, rates: null };

async function rates() {
  if (cache.rates && Date.now() - cache.at < 6 * 3600e3) return cache.rates;
  const r = await fetch("https://open.er-api.com/v6/latest/USD");
  const j = await r.json();
  if (j && j.result === "success" && j.rates) cache = { at: Date.now(), rates: j.rates };
  return cache.rates;
}

module.exports = async function handler(req, res) {
  const country = String(req.headers["x-vercel-ip-country"] || "").toUpperCase() || null;
  const currency = (country && CUR[country]) || "USD";
  let rate = 1;
  if (currency !== "USD") {
    try { const all = await rates(); rate = all && all[currency] ? all[currency] : null; } catch (e) { rate = null; }
  }
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Content-Type", "application/json");
  res.status(200).send(JSON.stringify(rate ? { country, currency, rate } : { country, currency: "USD", rate: 1 }));
}
