import { createClient } from "npm:@supabase/supabase-js@2";

// Hotmart Webhook 2.0 -> VEREDA access control.
// Hottok: env HOTMART_HOTTOK, or row app_config(key='HOTMART_HOTTOK').
// Products: 8890091 (VEREDA, English) and 8935999 (VEREDA, Spanish) + any extra ids in env HOTMART_PRODUCT_IDS.
// Language: purchases from the Spanish quizzes carry sck=vq_es-...  -> members.lang='es'; other quizzes (vq_...) -> 'en';
// without a quiz sck, the buyer's country decides (Spanish-speaking countries -> 'es').
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const PRODUCT_EN = "8890091", PRODUCT_ES = "8935999";
const PRODUCTS = [...new Set([PRODUCT_EN, PRODUCT_ES, ...(Deno.env.get("HOTMART_PRODUCT_IDS") ?? "").split(",").map((s) => s.trim()).filter(Boolean)])];
const ES_COUNTRIES = new Set(["ES","MX","AR","CO","CL","PE","VE","EC","GT","CU","BO","DO","HN","PY","SV","NI","CR","PA","UY","PR","GQ"]);

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });
const ms = (v: unknown) => { const n = Number(v); if (!n) return null; return new Date(n > 1e12 ? n : n * 1000).toISOString(); };
async function hottok() {
  const env = Deno.env.get("HOTMART_HOTTOK"); if (env) return env;
  const { data } = await sb.from("app_config").select("value").eq("key", "HOTMART_HOTTOK").maybeSingle();
  return data?.value ?? null;
}
function langOf(d: any): string | null {
  if (String(d?.product?.id ?? "") === PRODUCT_ES) return "es";
  const sck = String(d?.purchase?.origin?.sck ?? "");
  if (/^vq_es-/i.test(sck)) return "es";
  if (/^vq_/i.test(sck)) return "en";
  const iso = String(d?.buyer?.address?.country_iso ?? d?.purchase?.checkout_country?.iso ?? "").toUpperCase();
  if (ES_COUNTRIES.has(iso)) return "es";
  return iso ? "en" : null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: true, service: "vereda-hotmart-webhook" });
  let body: any;
  try { body = await req.json(); } catch { return json({ error: "invalid json" }, 400); }

  const expected = await hottok();
  const got = req.headers.get("x-hotmart-hottok") ?? body?.hottok;
  if (!expected) return json({ error: "server not configured" }, 500);
  if (got !== expected) return json({ error: "invalid hottok" }, 401);

  const event: string = body?.event ?? "";
  const d = body?.data ?? {};
  const productId = String(d?.product?.id ?? "");
  const email = String(d?.buyer?.email ?? d?.subscriber?.email ?? "").trim().toLowerCase();
  const name = d?.buyer?.name ?? d?.subscriber?.name ?? null;
  const tx = d?.purchase?.transaction ? String(d.purchase.transaction).toUpperCase() : null;
  const subCode = d?.subscription?.subscriber?.code ?? d?.subscriber?.code ?? null;
  const offer = d?.purchase?.offer?.code ?? null;
  const evId = String(body?.id ?? `${event}:${tx ?? subCode ?? email}:${body?.creation_date ?? Date.now()}`);

  const { error: logErr } = await sb.from("hotmart_events").insert({ id: evId, event, email, transaction: tx, payload: body });
  if (logErr && logErr.code === "23505") return json({ ok: true, duplicate: true });

  if (productId && PRODUCTS.length && !PRODUCTS.includes(productId)) return json({ ok: true, ignored: "other product" });
  if (!email) return json({ ok: true, ignored: "no email" });

  const now = new Date().toISOString();
  let patch: Record<string, unknown> | null = null;
  switch (event) {
    case "PURCHASE_APPROVED":
    case "PURCHASE_COMPLETE": {
      patch = { status: "active", access_until: null };
      const lang = langOf(d);
      if (lang) patch.lang = lang;
      break;
    }
    case "PURCHASE_REFUNDED":
      patch = { status: "refunded", access_until: now }; break;
    case "PURCHASE_CHARGEBACK":
      patch = { status: "chargeback", access_until: now }; break;
    case "PURCHASE_CANCELED":
      patch = { status: "blocked", access_until: now }; break;
    case "PURCHASE_DELAYED":
      patch = { status: "overdue", access_until: now }; break;
    case "PURCHASE_EXPIRED":
      patch = { status: "expired", access_until: now }; break;
    case "SUBSCRIPTION_CANCELLATION": {
      const until = ms(d?.date_next_charge ?? d?.subscription?.date_next_charge ?? d?.purchase?.date_next_charge);
      patch = { status: "canceled", access_until: until && until > now ? until : now }; break;
    }
    default:
      return json({ ok: true, ignored: event });
  }

  const row: Record<string, unknown> = { email, updated_at: now, ...patch };
  if (name) row.name = name;
  if (productId) row.product_id = productId;
  if (tx) row.transaction = tx;
  if (subCode) row.subscriber_code = subCode;
  if (offer) row.offer_code = offer;
  const { error } = await sb.from("members").upsert(row, { onConflict: "email" });
  if (error) return json({ error: error.message }, 500);
  if (tx) await sb.from("member_transactions").upsert({ transaction: tx, email }, { onConflict: "transaction" });
  return json({ ok: true, event, email, status: patch.status, lang: patch.lang ?? null });
});
