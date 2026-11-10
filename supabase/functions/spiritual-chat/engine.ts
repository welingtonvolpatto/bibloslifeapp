import { TOPICS, PRAY_KW, YES_KW, GENERIC_PRAYER, FALLBACK, type Topic } from "./kb.ts";
import { TOPICS_ES, PRAY_KW_ES, YES_KW_ES, GENERIC_PRAYER_ES, FALLBACK_ES } from "./kb_es.ts";

// ---------- prepared-answer mode (no AI key) ----------
const norm = (s: string) => " " + s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[’‘`]/g, "'").replace(/[^a-z0-9']+/g, " ").replace(/\s+/g, " ").trim() + " ";
const has = (t: string, p: string) => t.includes(" " + norm(p).trim() + " ");
const LOW = new Set(["greeting", "thanks", "who_are_you"]);

function best(text: string, topics: Topic[] = TOPICS): Topic | null {
  const t = norm(text);
  let top: Topic | null = null, topScore = 0;
  for (const tp of topics) {
    let s = 0;
    for (const k of tp.kw) if (has(t, k)) s += norm(k).trim().split(" ").length;
    if (!s) continue;
    if (tp.id === "crisis") return tp;
    const eff = LOW.has(tp.id) ? s * 0.1 : s;
    if (eff > topScore) { top = tp; topScore = eff; }
  }
  return top;
}

export function kbReply(msgs: { role: string; content: string }[], lang = "en"): string {
  const es = lang === "es";
  const TP = es ? TOPICS_ES : TOPICS, PK = es ? PRAY_KW_ES : PRAY_KW, YK = es ? YES_KW_ES : YES_KW;
  const GP = es ? GENERIC_PRAYER_ES : GENERIC_PRAYER, FB = es ? FALLBACK_ES : FALLBACK;
  const u = msgs[msgs.length - 1].content;
  const prevA = [...msgs].reverse().find((m, i) => i > 0 && m.role === "assistant")?.content || "";
  const tu = norm(u);
  const topic = best(u, TP);
  if (topic?.id === "crisis") return topic.answers[0];

  const askedPray = topic?.id !== "how_pray" && PK.some((k) => has(tu, k));
  const words = tu.trim().split(" ").length;
  const saidYes = words <= 5 && YK.some((k) => has(tu, k)) && /pray with you|ore contigo/i.test(prevA);

  if (askedPray || saidYes) {
    let tp: Topic | null = topic && topic.prayer ? topic : null;
    if (!tp) for (let i = msgs.length - 2; i >= 0 && !tp; i--) if (msgs[i].role === "user") { const b = best(msgs[i].content, TP); if (b?.prayer) tp = b; }
    return es ? "Claro. Oremos juntos:\n\n*" + (tp?.prayer || GP) + "*\n\nAquí estoy cuando quieras seguir hablando 🙏"
      : "Of course. Let’s pray together:\n\n*" + (tp?.prayer || GP) + "*\n\nI’m here whenever you want to talk more 🙏";
  }
  if (topic) {
    const opts = topic.answers.filter((a) => a !== prevA);
    const pool = opts.length ? opts : topic.answers;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  const fb = FB.filter((a) => a !== prevA);
  return fb[Math.floor(Math.random() * fb.length)] || FB[0];
}

