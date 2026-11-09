// VEREDA — Spiritual Assistant chat (streams plain text back to the app)
import { createClient } from "npm:@supabase/supabase-js@2";
import { kbReply } from "./engine.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Expose-Headers": "x-chat-mode",
};
const MAX_PER_DAY = 60;      // messages per member per day
const MAX_TURNS = 20;        // history sent to the model
const MAX_CHARS = 1500;      // per user message

const SYSTEM = `You are the Spiritual Assistant inside VEREDA, a Christian daily-devotional app.
Your role: a warm, wise, humble companion who helps people grow closer to God through Scripture, prayer and encouragement.

How you speak:
- Always reply in the same language the user writes in.
- Warm, gentle, pastoral, never preachy or judgmental. Short paragraphs (2–4 sentences). No headings, no bullet lists unless asked.
- Ground what you say in the Bible. Quote short verses with their reference (e.g. Psalm 34:18). Never invent verses or references; if unsure, paraphrase and say so.
- When someone shares a struggle: first acknowledge the feeling, then offer one truth from Scripture, then one small practical step. End with one gentle question that helps them open up — or offer to pray together.
- When asked to pray, write a heartfelt prayer in the first person plural or on their behalf, addressed to God, ending "In Jesus' name, Amen."
- Keep answers focused: usually 80–220 words.
- Stay within historic, mainstream Christian teaching. On disputed doctrines between denominations, present the main views respectfully without taking sides.

Boundaries:
- You are not a pastor, therapist, doctor or lawyer. For medical, legal, financial or mental-health treatment questions, offer spiritual support and encourage them to talk to a qualified professional and to their local church.
- If someone mentions wanting to harm themselves or others, being abused, or being in danger: respond with compassion, tell them they are not alone, and urge them to contact emergency services or a crisis line right now (in the US: call or text 988; elsewhere: local emergency number). Keep a path to help open.
- Do not discuss politics, give voting advice, or write content unrelated to faith and life with God; gently steer back.
- Never claim to be human. If asked, say you are an AI assistant created to support their walk with God.`;


function typed(text: string): Response {
  const enc = new TextEncoder();
  const parts = text.match(/\S+\s*/g) || [text];
  const stream = new ReadableStream({
    async start(ctrl) {
      await new Promise((r) => setTimeout(r, 450));
      for (let i = 0; i < parts.length; i += 3) {
        ctrl.enqueue(enc.encode(parts.slice(i, i + 3).join("")));
        await new Promise((r) => setTimeout(r, 35));
      }
      ctrl.close();
    },
  });
  return new Response(stream, { headers: { ...CORS, "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache", "x-chat-mode": "kb" } });
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const url = Deno.env.get("SUPABASE_URL")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, service, { auth: { persistSession: false } });

  // 1) who is calling? (Supabase session token)
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: u, error: ue } = await admin.auth.getUser(token);
  if (ue || !u?.user?.email) return json(401, { error: "Please sign in again to use the assistant." });
  const email = u.user.email.toLowerCase();

  // 2) active member?
  const { data: m } = await admin.from("members").select("status,access_until").eq("email", email).maybeSingle();
  const active = !!m && (m.status === "active" || ((m.status === "canceled") && m.access_until && new Date(m.access_until) > new Date()));
  if (!active) return json(403, { error: "The assistant is available for active members." });

  // 3) input
  let body: { messages?: { role: string; content: string }[] } = {};
  try { body = await req.json(); } catch { return json(400, { error: "Invalid request." }); }
  const msgs = (body.messages || [])
    .filter((x) => (x.role === "user" || x.role === "assistant") && typeof x.content === "string" && x.content.trim())
    .slice(-MAX_TURNS)
    .map((x) => ({ role: x.role, content: x.content.slice(0, MAX_CHARS) }));
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return json(400, { error: "Empty message." });

  // 4) daily limit
  const { data: count } = await admin.rpc("chat_bump", { uid: u.user.id, max_per_day: MAX_PER_DAY });
  if ((count ?? 0) > MAX_PER_DAY) return json(429, { error: "You’ve reached today’s limit for the assistant. Come back tomorrow — and keep talking to God in prayer meanwhile 🙏" });

  // 5) model config (kept in app_config, never in the app)
  const { data: cfg } = await admin.from("app_config").select("key,value").in("key", ["anthropic_api_key", "openai_api_key", "chat_model"]);
  const get = (k: string) => cfg?.find((r) => r.key === k)?.value || "";
  const akey = get("anthropic_api_key"), okey = get("openai_api_key");
  if (!akey && !okey) return typed(kbReply(msgs));

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(ctrl) {
      const push = (t: string) => ctrl.enqueue(enc.encode(t));
      try {
        let r: Response;
        if (akey) {
          r = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "x-api-key": akey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
            body: JSON.stringify({ model: get("chat_model") || "claude-haiku-5-5", max_tokens: 900, system: SYSTEM, messages: msgs, stream: true }),
          });
        } else {
          r = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${okey}`, "content-type": "application/json" },
            body: JSON.stringify({ model: get("chat_model") || "gpt-4o-mini", max_tokens: 900, stream: true, messages: [{ role: "system", content: SYSTEM }, ...msgs] }),
          });
        }
        if (!r.ok || !r.body) { console.error("llm", r.status, await r.text().catch(() => "")); push("\u0000ERR"); ctrl.close(); return; }
        const reader = r.body.getReader(); const dec = new TextDecoder(); let buf = "";
        while (true) {
          const { value, done } = await reader.read(); if (done) break;
          buf += dec.decode(value, { stream: true });
          let i;
          while ((i = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim(); if (!data || data === "[DONE]") continue;
            try {
              const j = JSON.parse(data);
              const t = akey ? (j.type === "content_block_delta" ? j.delta?.text : "") : j.choices?.[0]?.delta?.content;
              if (t) push(t);
            } catch { /* ignore keep-alives */ }
          }
        }
      } catch (e) { console.error(e); push("\u0000ERR"); }
      ctrl.close();
    },
  });
  return new Response(stream, { headers: { ...CORS, "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache", "x-chat-mode": "ai" } });
});
