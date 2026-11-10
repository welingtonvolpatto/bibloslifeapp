/* VEREDA app — single-file PWA (local-first). */
(function(){
"use strict";
const ES = window.VLANG==="es";
const C = (ES && window.VEREDA_CONTENT_ES) ? Object.assign({}, window.VEREDA_CONTENT, window.VEREDA_CONTENT_ES) : window.VEREDA_CONTENT;
const LOC = window.VLOCALE || "en-US";
const CONFIG = {
  supportEmail: "institutoacademy20@gmail.com",
  renewUrl:"https://pay.hotmart.com/F108347453I?off=t5216fgc", // Hotmart checkout link to renew (fill in)
  manageSubscriptionUrl: "https://consumer.hotmart.com/",
  privacyUrl: "#", termsUrl: "#",
  communityApi: "", // set to a backend URL to share prayer requests between users
  adminEmail: "admin@vereda.app",
  adminHash: "78d1d967273777381e1f8f33b2a69e2deba9125f5eee7eec34f3f32f4a0376ec" // SHA-256 of the admin password (demo access only; real auth comes with the backend)
};
async function sha256(s){ const b=await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join(""); }
const $app = document.getElementById("app");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\*(.+?)\*/g,"<em>$1</em>");
const todayStr = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const fmtDate = s => new Date(s+"T12:00:00").toLocaleDateString(LOC,{month:"long",day:"numeric",year:"numeric"});
const initials = n => (n||"").trim().split(/\s+/).slice(0,2).map(w=>w[0]||"").join("").toUpperCase() || "V";
const uid = () => Math.random().toString(36).slice(2,10);

/* ---------- state ---------- */
const KEY = "vereda_app_v1";
const DEF = { user:null, theme:"light", completed:{}, steps:{}, journal:[], requests:[], prayed:{}, highlights:[], ratings:{}, seen:{}, voice:"", rate:1, bibleBook:0, bibleCh:0, bfs:19, dev:false };
let S;
try { S = Object.assign({}, DEF, JSON.parse(localStorage.getItem(KEY)||"{}")); } catch(e){ S = {...DEF}; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){} if(typeof pushState==="function") pushState(); };
if (/[?&]dev=1/.test(location.search)) { S.dev = true; save(); }
if (/[?&]dev=0/.test(location.search)) { S.dev = false; save(); }
S.theme="light";
let tab = "journey";

/* ---------- lessons ---------- */
const MOD = C.modules[0];
const LESSONS = [];
MOD.chapters.forEach((ch,ci)=>ch.lessons.forEach((t,li)=>LESSONS.push({key:`1-${ci+1}-${li+1}`, title:t, ci, li, idx:LESSONS.length})));
const STEPS = [
  {k:"prayer", label:"Daily Prayer", icon:"eye"},
  {k:"devotional", label:"Scripture & today’s word", icon:"book"},
  {k:"quiz", label:"Quiz", icon:"quiz"},
  {k:"action", label:"One action", icon:"spark"}
];
function currentIndex(){ let i=0; while(i<LESSONS.length && S.completed[LESSONS[i].key]) i++; return i; }
const isAdmin=()=>!!(S.user&&S.user.admin);
function isAvailable(i){
  if (isAdmin()) return true;
  if (i < currentIndex()) return true;
  if (i > currentIndex()) return false;
  if (i === 0 || S.dev) return true;
  return S.completed[LESSONS[i-1].key] < todayStr();
}
function todayLesson(){
  const ci = currentIndex();
  // if today's lesson was just completed today, keep showing it as "done"
  const last = ci>0 ? LESSONS[ci-1] : null;
  if (last && S.completed[last.key] === todayStr()) return {L:last, done:true};
  if (ci >= LESSONS.length) return {L:LESSONS[LESSONS.length-1], done:true};
  return {L:LESSONS[ci], done:false, locked:!isAvailable(ci)};
}
const stepsOf = k => S.steps[k] || (S.steps[k] = {});

/* ---------- icons ---------- */
const P = {
 path:'<path d="M12 22c0-6 6-7 6-13M12 22c0-5-5-6-5-11 0-3 2-5 5-7"/><circle cx="18" cy="5" r="2"/>',
 explore:'<rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/>',
 journal:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
 community:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2c2.8.3 5 2.6 5 5.8"/>',
 bible:'<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5Z"/><path d="M4 21.5V4.5"/><path d="M12 6v8M9 9h6"/>',
 eye:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
 book:'<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2Z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7Z"/>',
 quiz:'<rect x="3" y="4" width="18" height="14" rx="3"/><path d="M8 21h8M7 9h10M7 13h6"/>',
 spark:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2"/>',
 chev:'<path d="m6 9 6 6 6-6"/>', right:'<path d="m9 6 6 6-6 6"/>', back:'<path d="M19 12H5M12 19l-7-7 7-7"/>', x:'<path d="M18 6 6 18M6 6l12 12"/>',
 lock:'<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
 check:'<path d="m5 12 5 5L20 7"/>', up:'<path d="M12 19V5M5 12l7-7 7 7"/>',
 copy:'<rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
 share:'<path d="M12 3v13M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
 lines:'<path d="M4 6h16M4 12h16M4 18h10"/>', head:'<path d="M3 14v-2a9 9 0 0 1 18 0v2"/><rect x="2" y="14" width="5" height="7" rx="2"/><rect x="17" y="14" width="5" height="7" rx="2"/>',
 play:'<path d="M7 4.5v15l13-7.5Z" fill="currentColor" stroke="none"/>', pause:'<rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none"/>',
 rw:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>', fw:'<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
 wave:'<path d="M3 12h2M7 9v6M11 6v12M15 9v6M19 11v2"/>', plus:'<path d="M12 5v14M5 12h14"/>', bookmark:'<path d="M6 3h12v18l-6-4-6 4Z"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
 heart:'<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/>',
 shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>', doc:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>',
 help:'<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>', mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
 star:'<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1Z"/>', moon:'<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
 out:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>', refresh:'<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/>',
 dots:'<circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/>',
 music:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>', sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
 text:'<path d="M4 7V4h16v3M9 20h6M12 4v16"/>', prev:'<path d="M6 5v14"/><path d="M19 5 9 12l10 7Z" fill="currentColor"/>', next:'<path d="M18 5v14"/><path d="M5 5l10 7-10 7Z" fill="currentColor"/>', bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>', flame:'<path d="M12 22c4 0 7-3 7-7 0-5-5-7-5-12-3 2-5 5-5 8-1-1-2-2-2-4-2 2-2 5-2 8 0 4 3 7 7 7Z"/>', gift:'<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M2 9h20M12 9v12M12 9c-2-4-7-5-7-2s4 2 7 2c3 0 7 1 7-2s-5-2-7 2"/>', sprout:'<path d="M12 21v-9"/><path d="M12 13C12 8 8 6 4 6c0 4 3 7 8 7ZM12 11c0-4 3-7 8-7 0 4-3 7-8 7Z"/>', hands:'<path d="M12 3c-1 4-4 7-5 11-.6 2.4.8 4 3 4h2Z"/><path d="M12 3c1 4 4 7 5 11 .6 2.4-.8 4-3 4h-2Z"/><path d="M5 21h14"/>', mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5"/>', trash:'<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15"/>', edit:'<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>', send:'<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4Z"/>', newchat:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'
};
const ic = (n, cls="") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${P[n]||""}</svg>`;
const LOGO = `<img src="images/logo.svg" alt="VEREDA" style="height:30px">`;

/* ---------- illustrations (original SVG) ---------- */
function art(kind){
  const g = {lamp:["#F5D9A8","#E9C8E6"], name:["#CFE3F4","#E6D7F3"], gift:["#F8D9C4","#F3E1EA"], prayer:["#DDD3F3","#CFE3F4"], wait:["#D8EBD9","#DCEAF5"], shield:["#CFE3F4","#D9DDF5"], tree:["#D9EBD2","#F5E6C8"]}[kind] || ["#CFE3F4","#E6D7F3"];
  const glyph = {
   lamp:'<path d="M120 150c0-22 18-30 40-30s40 8 40 30-18 26-40 26-40-4-40-26Z" fill="#fff"/><path d="M200 140c14-4 22 4 18 14" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M160 118c-10-14-2-30 6-38 2 14 14 18 10 32-2 6-10 10-16 6Z" fill="#F2B544"/><circle cx="163" cy="100" r="44" fill="#FFE7A3" opacity=".35"/>',
   name:'<rect x="105" y="85" width="110" height="80" rx="16" fill="#fff"/><rect x="105" y="85" width="110" height="26" rx="13" fill="#0E5F95"/><rect x="125" y="128" width="70" height="10" rx="5" fill="#C9D8E6"/><rect x="138" y="146" width="44" height="8" rx="4" fill="#E2E9F0"/>',
   gift:'<rect x="112" y="108" width="96" height="70" rx="10" fill="#fff"/><rect x="104" y="92" width="112" height="24" rx="8" fill="#fff"/><rect x="153" y="92" width="14" height="86" fill="#E58A7B"/><path d="M160 92c-18-26-40-10-26 0M160 92c18-26 40-10 26 0" stroke="#E58A7B" stroke-width="7" fill="none" stroke-linecap="round"/>',
   prayer:'<path d="M160 70c-6 30-22 50-30 80-4 16 6 30 22 30h8V96Z" fill="#fff"/><path d="M160 70c6 30 22 50 30 80 4 16-6 30-22 30h-8V96Z" fill="#F4F0FF"/><circle cx="160" cy="62" r="36" fill="#fff" opacity=".35"/>',
   wait:'<path d="M110 180h100" stroke="#8B6B4A" stroke-width="10" stroke-linecap="round"/><path d="M160 178V120" stroke="#4F9A5B" stroke-width="7" stroke-linecap="round"/><path d="M160 135c-26-2-34-20-34-30 20 0 32 10 34 30ZM160 125c22-2 32-18 32-28-18 0-30 8-32 28Z" fill="#6DBA78"/><path d="M135 186c8 10 42 10 50 0" stroke="#C9A884" stroke-width="5" fill="none"/>',
   shield:'<path d="M160 70 210 88v34c0 34-24 54-50 64-26-10-50-30-50-64V88Z" fill="#fff"/><path d="m140 128 14 14 28-30" stroke="#0E5F95" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
   tree:'<path d="M160 186v-50" stroke="#8B6B4A" stroke-width="10" stroke-linecap="round"/><circle cx="160" cy="110" r="38" fill="#6DBA78"/><circle cx="132" cy="128" r="24" fill="#5FAE6B"/><circle cx="188" cy="128" r="24" fill="#5FAE6B"/><path d="M110 192c30-8 70-8 100 0" stroke="#7FB6E0" stroke-width="7" fill="none" stroke-linecap="round"/>'
  }[kind] || "";
  return `<svg viewBox="0 0 320 213" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="ag${kind}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${g[0]}"/><stop offset="1" stop-color="${g[1]}"/></linearGradient></defs><rect width="320" height="213" fill="url(#ag${kind})"/><g fill="#fff" opacity=".8"><ellipse cx="40" cy="190" rx="70" ry="26"/><ellipse cx="290" cy="196" rx="80" ry="28"/><ellipse cx="262" cy="48" rx="40" ry="14"/><ellipse cx="60" cy="40" rx="30" ry="10"/></g>${glyph}</svg>`;
}
const HEX = (face1,face2,side,gloss=.35)=>{ const id="h"+face1.slice(1)+side.slice(1); const pth="M33 3.5a12 12 0 0 1 12 0l23 13.3a12 12 0 0 1 6 10.4v26.6a12 12 0 0 1-6 10.4L45 77.5a12 12 0 0 1-12 0L10 64.2a12 12 0 0 1-6-10.4V27.2a12 12 0 0 1 6-10.4Z";
  return `<svg class="shape" viewBox="0 0 78 88"><defs><linearGradient id="${id}" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="${face1}"/><stop offset="1" stop-color="${face2}"/></linearGradient></defs><path d="${pth}" transform="translate(0 7)" fill="${side}"/><path d="${pth}" fill="url(#${id})"/><path d="M33 3.5a12 12 0 0 1 12 0l23 13.3a12 12 0 0 1 3.4 3L39 38 6.6 19.8a12 12 0 0 1 3.4-3Z" fill="#fff" opacity="${gloss}"/></svg>`; };


/* ---------- clouds (original, generated) ---------- */
function cloudBand(seed, fill){
  // two identical halves so translateX(-50%) loops seamlessly
  let r=seed, rnd=()=>{ r=(r*9301+49297)%233280; return r/233280; };
  const circles=[]; let x=0;
  while(x<420){ const rad=26+rnd()*34; circles.push([x,rad]); x+=rad*1.05; }
  const half=circles.map(([cx,rad])=>`<circle cx="${cx.toFixed(1)}" cy="${(120-rad*0.55).toFixed(1)}" r="${rad.toFixed(1)}"/>`).join("");
  let op=1; const m=/rgba\(([^)]+),\s*([\d.]+)\)/.exec(fill); if(m){ fill=`rgb(${m[1]})`; op=+m[2]; }
  return `<svg viewBox="0 0 800 120" preserveAspectRatio="none"><g opacity="${op}"><g fill="${fill}">${half}<rect x="0" y="95" width="400" height="25"/></g><g fill="${fill}" transform="translate(400 0)">${half}<rect x="0" y="95" width="400" height="25"/></g></g></svg>`;
}
function clouds(h=150, tone="white", extra=""){
  const f = tone==="white" ? ["rgba(255,255,255,.45)","rgba(255,255,255,.7)","rgba(255,255,255,.95)"] : tone==="sky" ? ["rgba(214,232,245,.6)","rgba(225,238,248,.85)","#EAF3FA"] : tone;
  const dark = document.documentElement.dataset.theme==="dark";
  if(tone==="bg"){ const c=dark?["#182532","#162029","#141922"]:["#E6F0F8","#F3F8FC","#FFFFFF"]; return `<div class="clouds" style="--ch:${h}px;${extra}"><div class="cl" style="animation-duration:80s;bottom:34%">${cloudBand(11,c[0])}</div><div class="cl" style="animation-duration:55s;bottom:16%">${cloudBand(41,c[1])}</div><div class="cl" style="animation-duration:38s">${cloudBand(97,c[2])}</div></div>`; }
  const ff = dark && tone!=="blue" ? ["rgba(255,255,255,.05)","rgba(255,255,255,.08)","rgba(255,255,255,.11)"] : f;
  return `<div class="clouds" style="--ch:${h}px;${extra}"><div class="cl" style="animation-duration:70s;bottom:28%;opacity:.9">${cloudBand(7,ff[0])}</div><div class="cl" style="animation-duration:48s;bottom:12%">${cloudBand(31,ff[1])}</div><div class="cl" style="animation-duration:34s">${cloudBand(77,ff[2])}</div></div>`;
}
function puff(x,y,w,dur=9,op=.9,delay=0){
  return `<div class="puff" style="left:${x};top:${y};width:${w}px;opacity:${op};animation-duration:${dur}s;animation-delay:-${delay}s"><svg viewBox="0 0 120 50"><g fill="#fff"><circle cx="35" cy="32" r="18"/><circle cx="60" cy="22" r="22"/><circle cx="86" cy="32" r="17"/><rect x="18" y="32" width="86" height="18" rx="9"/></g></svg></div>`;
}
function splash(){
  if(sessionStorage.getItem("vsplash")) return; sessionStorage.setItem("vsplash","1");
  const s=document.createElement("div"); s.className="splash";
  const layer=(bottom,fill,dur,seed,delay)=>`<div class="sp-layer" style="bottom:0;height:calc(${bottom} + 120px);animation-delay:${delay}s"><div class="clouds" style="--ch:120px;top:0;bottom:auto"><div class="cl" style="animation-duration:${dur}s">${cloudBand(seed,fill)}</div></div><div style="position:absolute;left:0;right:0;top:119px;bottom:0;background:${fill}"></div></div>`;
  s.innerHTML=`${layer("44vh","#3C7FB4",60,7,0)}${layer("30vh","#7DAAD2",44,31,.12)}${layer("16vh","#E8F1F9",32,77,.24)}<div class="lgw"><img src="images/logo-stacked.svg" alt="VEREDA"></div><div class="tag">Your daily path closer to God</div>`;
  document.body.appendChild(s);
  setTimeout(()=>{ s.classList.add("out"); setTimeout(()=>s.remove(),620); },2400);
}

/* ---------- ui helpers ---------- */
let toastT;
function toast(msg){ document.querySelector(".toast")?.remove(); const t=document.createElement("div"); t.className="toast"; t.textContent=msg; document.body.appendChild(t); clearTimeout(toastT); toastT=setTimeout(()=>t.remove(),2600); }
function sheet(html, onMount){
  const o=document.createElement("div"); o.className="overlay"; o.innerHTML=`<div class="sheet"><div class="grab"></div>${html}</div>`;
  o.addEventListener("click",e=>{ if(e.target===o) o.remove(); });
  document.body.appendChild(o); onMount && onMount(o.querySelector(".sheet"), ()=>o.remove()); return o;
}
async function copyText(t){ try{ await navigator.clipboard.writeText(t); toast("Copied"); }catch(e){ const a=document.createElement("textarea"); a.value=t; document.body.appendChild(a); a.select(); document.execCommand("copy"); a.remove(); toast("Copied"); } }
async function shareText(t){ if(navigator.share){ try{ await navigator.share({text:t}); }catch(e){} } else copyText(t); }

/* ---------- narrator (Web Speech) ---------- */
const N = {
  sents:[], i:0, playing:false, onupdate:null, title:"",
  voices(){ const v=(window.speechSynthesis?.getVoices()||[]).filter(v=>(ES?/^es/i:/^en/i).test(v.lang)); const pref=v.filter(x=>/natural|premium|enhanced|google|samantha|daniel|karen|moira|aria|jenny|guy/i.test(x.name)); return (pref.length?pref:v).slice(0,4); },
  load(text,title){ this.stop(); this.title=title; this.sents=text.replace(/\s+/g," ").match(/[^.!?…]+[.!?…]+[”"’]?|[^.!?…]+$/g)||[text]; this.sents=this.sents.map(s=>s.trim()).filter(Boolean); this.i=0; this.emit(); },
  total(){ return this.sents.reduce((a,s)=>a+s.length,0)/14/(S.rate||1); },
  elapsed(){ return this.sents.slice(0,this.i).reduce((a,s)=>a+s.length,0)/14/(S.rate||1); },
  speak(){ if(!window.speechSynthesis){ toast("Audio isn’t supported on this browser"); return; }
    speechSynthesis.cancel(); if(this.i>=this.sents.length){ this.playing=false; this.i=this.sents.length; this.emit(); return; }
    const u=new SpeechSynthesisUtterance(this.sents[this.i]); u.lang=ES?"es-ES":"en-US"; u.rate=S.rate||1;
    const vs=this.voices(); const v=vs.find(x=>x.name===S.voice)||vs[0]; if(v) u.voice=v;
    u.onend=()=>{ if(!this.playing) return; this.i++; this.emit(); this.speak(); };
    speechSynthesis.speak(u); },
  play(){ if(typeof Player!=="undefined"&&Player.a) Player.a.pause(); this.playing=true; if(this.i>=this.sents.length) this.i=0; this.speak(); this.emit(); },
  pause(){ this.playing=false; window.speechSynthesis&&speechSynthesis.cancel(); this.emit(); },
  stop(){ this.playing=false; window.speechSynthesis&&speechSynthesis.cancel(); },
  seek(d){ let t=0, target=Math.max(0,this.elapsed()+d), j=0; while(j<this.sents.length && t+this.sents[j].length/14/(S.rate||1) <= target){ t+=this.sents[j].length/14/(S.rate||1); j++; } this.i=Math.min(j,this.sents.length-1); if(this.playing) this.speak(); this.emit(); },
  emit(){ this.onupdate && this.onupdate(); }
};
if (window.speechSynthesis) speechSynthesis.onvoiceschanged = () => N.emit();
const mmss = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(Math.floor(s%60)).padStart(2,"0")}`;

/* ---------- ambient prayer music (WebAudio, generated) ---------- */
const Music = {
  ctx:null, on:false, timer:null, gain:null,
  start(){ try{ this.ctx=this.ctx||new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return; }
    this.ctx.resume(); this.on=true; this.gain=this.ctx.createGain(); this.gain.gain.value=0.0; this.gain.connect(this.ctx.destination);
    this.gain.gain.linearRampToValueAtTime(0.16,this.ctx.currentTime+2);
    const chords=[[261.6,329.6,392.0],[220.0,261.6,329.6],[174.6,220.0,261.6],[196.0,246.9,293.7]]; let k=0;
    const play=()=>{ if(!this.on) return; const t=this.ctx.currentTime; chords[k%4].forEach((f,i)=>{ [1,2].forEach(m=>{ const o=this.ctx.createOscillator(), g=this.ctx.createGain(), lp=this.ctx.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=900; o.type=m===1?"sine":"triangle"; o.frequency.value=f*(m===2?0.5:1); o.detune.value=(i-1)*4; g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(m===1?.22:.12,t+1.8); g.gain.linearRampToValueAtTime(0,t+6.4); o.connect(lp); lp.connect(g); g.connect(this.gain); o.start(t); o.stop(t+6.6); }); }); k++; this.timer=setTimeout(play,5200); };
    play(); },
  stop(){ this.on=false; clearTimeout(this.timer); if(this.gain&&this.ctx){ try{ this.gain.gain.linearRampToValueAtTime(0,this.ctx.currentTime+.6); }catch(e){} } }
};

/* ---------- render root ---------- */
function applyTheme(){ document.documentElement.dataset.theme = (tab==="bible" && S.bibleDark) ? "dark" : "light"; document.querySelector('meta[name=theme-color]')?.setAttribute("content", (tab==="bible"&&S.bibleDark)?"#141922":"#FFFFFF"); }
function render(){
  N.onupdate=null; applyTheme();
  if(!S.user){ renderWelcome(); return; }
  const view = {journey:viewJourney, explore:viewExplore, journal:viewJournal, community:viewCommunity, bible:viewBible}[tab]();
  $app.innerHTML = view + tabbar();
  bindTabbar(); afterRender[tab] && afterRender[tab](); paintMini();
  if(!S.seen.tour && !document.querySelector('.tour')) setTimeout(startTour,350);
}
const afterRender = {};
function tabbar(){
  const t=[["journey","path","Journey"],["explore","explore","Explore"],["journal","journal","Journal"],["community","community","Community"],["bible","bible","Bible"]];
  const jdot = !S.journal.some(j=>j.date===todayStr());
  return `<nav class="tabbar"><span class="lens" id="lens"></span>${t.map(([k,i,l])=>`<button data-tab="${k}" class="${tab===k?"on":""}">${ic(i)}${l}${k==="journal"&&jdot?'<span class="dot"></span>':""}</button>`).join("")}</nav>`;
}
let prevTab=null, tabBusy=false;
function placeLens(from){
  const bar=document.querySelector(".tabbar"), lens=document.getElementById("lens"); if(!bar||!lens) return;
  const btns=[...bar.querySelectorAll("[data-tab]")], to=btns.find(b=>b.dataset.tab===tab); if(!to) return;
  const pos=b=>({x:b.offsetLeft, w:b.offsetWidth});
  const end=pos(to); lens.style.width=end.w+"px"; lens.style.transform=`translateX(${end.x}px)`;
  const src=from&&btns.find(b=>b.dataset.tab===from);
  if(!src||!lens.animate||matchMedia("(prefers-reduced-motion:reduce)").matches){ to.classList.add("on"); return; }
  const st=pos(src), mid=(st.x+end.x)/2, dist=Math.abs(end.x-st.x);
  to.classList.remove("on"); src.classList.add("ghost");
  lens.classList.add("moving");
  const a=lens.animate([
    {transform:`translateX(${st.x}px) scale(1,1)`},
    {transform:`translateX(${st.x+(end.x-st.x)*.15}px) scale(1.22,1.12)`,offset:.18},
    {transform:`translateX(${mid}px) scale(${1.25+Math.min(dist/400,.25)},1.08)`,offset:.5},
    {transform:`translateX(${end.x}px) scale(1.12,1.05)`,offset:.8},
    {transform:`translateX(${end.x}px) scale(.96,1)`,offset:.9},
    {transform:`translateX(${end.x}px) scale(1,1)`}
  ],{duration:520,easing:"cubic-bezier(.3,.7,.2,1)"});
  setTimeout(()=>{ src.classList.remove("ghost"); to.classList.add("on","pop"); },300);
  a.onfinish=()=>{ lens.classList.remove("moving"); setTimeout(()=>to.classList.remove("pop"),400); };
}
function bindTabbar(){
  placeLens(prevTab); prevTab=null;
  document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{
    if(tab===b.dataset.tab||tabBusy) return; tabBusy=true;
    navigator.vibrate&&navigator.vibrate(8);
    const from=tab, scr=document.querySelector("#app .screen");
    const go=()=>{ prevTab=from; tab=b.dataset.tab; Music.stop(); N.stop(); bibleListening=false; window.onscroll=null; render(); window.scrollTo(0,0); const ns=document.querySelector("#app .screen"); ns&&ns.classList.add("tab-in"); tabBusy=false; };
    if(scr&&scr.animate){ scr.animate([{opacity:1,filter:"blur(0)",transform:"scale(1)"},{opacity:0,filter:"blur(6px)",transform:"scale(.985)"}],{duration:140,easing:"ease-in",fill:"forwards"}).onfinish=go; } else go();
  });
}

/* ---------- BACKEND (Supabase) ---------- */
const SB_URL="https://okgqxzehlqzdmwxpjdkj.supabase.co", SB_KEY="sb_publishable_4EvJKXKLm0jrZrm7k-EnGA_u0N5nesc";
const sbc = (window.supabase && window.supabase.createClient) ? window.supabase.createClient(SB_URL, SB_KEY, {auth:{persistSession:true, autoRefreshToken:true, storageKey:"vereda_auth"}}) : null;
async function fnCall(name, body){
  const r=await fetch(`${SB_URL}/functions/v1/${name}`,{method:"POST",headers:{"Content-Type":"application/json","apikey":SB_KEY,"Authorization":`Bearer ${SB_KEY}`},body:JSON.stringify(body)});
  const j=await r.json().catch(()=>({})); if(!r.ok) throw new Error(j.error||"Something went wrong. Please try again."); return j;
}
const SYNC_KEYS=["completed","steps","journal","ratings","highlights","light","pod","seen","bver","bfs","bibleBook","bibleCh","bibleDark","rate","voice","podRate","requests","prayed"];
let syncT=null, syncing=false;
function pushState(){ if(!sbc||!S.user||!S.user.uid) return; clearTimeout(syncT); syncT=setTimeout(async()=>{ const data={}; SYNC_KEYS.forEach(k=>{ if(S[k]!==undefined) data[k]=S[k]; }); try{ await sbc.from("user_state").upsert({user_id:S.user.uid,data,updated_at:new Date().toISOString()}); }catch(e){} },1500); }
async function pullState(uid){
  try{ const {data}=await sbc.from("user_state").select("data").eq("user_id",uid).maybeSingle();
    if(data&&data.data){ const r=data.data;
      // merge: union of completed/journal; remote wins on settings
      S.completed=Object.assign({}, r.completed||{}, S.completed||{});
      const ids=new Set((S.journal||[]).map(j=>j.id)); S.journal=[...(S.journal||[]), ...((r.journal||[]).filter(j=>!ids.has(j.id)))];
      SYNC_KEYS.forEach(k=>{ if(!["completed","journal"].includes(k) && r[k]!==undefined && (S[k]===undefined || JSON.stringify(S[k])==="{}"||JSON.stringify(S[k])==="[]")) S[k]=r[k]; });
      if(r.light && (!S.light || (r.light.total||0)>(S.light.total||0))) S.light=r.light;
      save(); }
  }catch(e){}
}
async function checkAccess(){
  if(!sbc||!S.user||S.user.admin||!S.user.uid||!navigator.onLine) return true;
  try{ const {data:s}=await sbc.auth.getSession(); if(!s.session){ S.user=null; save(); render(); toast("Please sign in again"); return false; }
    const {data,error}=await sbc.rpc("my_access"); if(error) return true;
    const a=Array.isArray(data)?data[0]:data;
    if(!a||!a.active){ renderBlocked(a); return false; }
    if(a.lang && !S.langSet && a.lang!==(S.lang||window.VLANG)){ S.lang=a.lang; save(); location.reload(); return false; }
    if(a.lang && !S.lang){ S.lang=a.lang; save(); }
    return true; }catch(e){ return true; }
}
function renderBlocked(a){
  const reason = !a ? "We couldn’t find an active subscription for this email." : ({refunded:"This purchase was refunded.",chargeback:"This purchase was disputed.",canceled:"Your subscription was canceled.",overdue:"We couldn’t process your last payment.",expired:"Your subscription has expired.",blocked:"This purchase was canceled."}[a.status]||"Your access is not active.");
  $app.innerHTML=`<div class="welcome"><img src="images/logo-stacked.svg" style="width:120px"><div style="flex:1;display:flex;flex-direction:column;justify-content:center">
    <div style="font-size:54px">🕯️</div><h1 style="font-size:24px;margin-top:10px">Your lamp is waiting</h1><p class="muted" style="margin-top:10px;line-height:1.5">${reason} Renew to continue your journey — your progress is saved.</p></div>
    ${CONFIG.renewUrl?`<a class="btn" href="${CONFIG.renewUrl}" target="_blank">Renew my access</a>`:""}<a class="link" href="mailto:${CONFIG.supportEmail}" style="margin-top:16px">Contact support</a><button class="link" id="so" style="margin-top:14px;color:var(--muted)">Sign out</button></div>`;
  document.getElementById("so").onclick=signOut;
}
async function signOut(){ try{ sbc&&await sbc.auth.signOut(); }catch(e){} const keep={}; S.user=null; S.dev=false; save(); render(); }

/* ---------- INSTALL (add to home screen) ---------- */
let deferredPrompt=null;
window.addEventListener("beforeinstallprompt",e=>{ e.preventDefault(); deferredPrompt=e; document.querySelectorAll("[data-install]").forEach(b=>b.classList.remove("hidden")); });
window.addEventListener("appinstalled",()=>{ deferredPrompt=null; toast("VEREDA was added to your home screen"); document.querySelectorAll("[data-install]").forEach(b=>b.classList.add("hidden")); });
const isStandalone=()=>matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
const installBtn=(cls="")=>isStandalone()?"":`<button class="installbtn ${cls}" data-install>${ic("plus").replace("<svg ",'<svg style="width:18px;height:18px" ')} Add VEREDA to your home screen</button>`;
async function doInstall(){
  if(deferredPrompt){ deferredPrompt.prompt(); const r=await deferredPrompt.userChoice; deferredPrompt=null; if(r.outcome==="accepted") toast("Installing VEREDA…"); return; }
  const shareIc=`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#0E5F95" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-5px"><path d="M12 3v13M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>`;
  const steps = isIOS()
    ? [[`Tap the Share button ${shareIc}`,"at the bottom of Safari (or at the top on iPad)."],["Scroll down and tap “Add to Home Screen”","You may need to tap “More” to find it."],["Tap “Add”","VEREDA will appear on your home screen like any other app."]]
    : [["Open your browser menu","Tap the ⋮ (three dots) in the top-right corner."],["Tap “Add to Home screen” or “Install app”",""],["Confirm with “Add” or “Install”","VEREDA will appear on your home screen."]];
  sheet(`<div style="text-align:center"><img src="icons/icon-192.png" style="width:64px;height:64px;border-radius:16px;box-shadow:var(--shadow)"></div><h3 style="margin-top:12px">Add VEREDA to your home screen</h3><p style="font-size:14px">Open the app with one tap, full screen — just like an app from the store.</p>
    ${isIOS()&&!/safari/i.test(navigator.userAgent.replace(/crios|fxios|edgios/i,"x"))?`<p style="font-size:13px;color:var(--bad)">On iPhone, open this page in <b>Safari</b> first.</p>`:""}
    <div class="isteps">${steps.map((s,i)=>`<div class="istep"><span>${i+1}</span><div><b>${s[0]}</b>${s[1]?`<small>${s[1]}</small>`:""}</div></div>`).join("")}</div>
    <button class="btn" data-x style="margin-top:14px">Got it</button>`,(s,c)=>s.querySelector("[data-x]").onclick=c);
}
document.addEventListener("click",e=>{ if(e.target.closest("[data-install]")) doInstall(); });

/* ---------- FIRST-TIME TUTORIAL ---------- */
const TOUR=[
 {tab:null, t:"Welcome to VEREDA", d:"Your daily path closer to God. Here’s a quick tour of everything inside — it takes less than a minute.", art:"welcome"},
 {tab:"journey", t:"Your Journey", d:"One devotional unlocks every day. Each one has a prayer, today’s word, a short quiz and one action. Finish today’s to unlock tomorrow’s.", art:"journey"},
 {tab:"journey", t:"Read or listen", d:"Every prayer and devotional can be read or listened to. Switch anytime with the Read / Listen button at the top.", art:"listen"},
 {tab:"journey", t:"Keep your lamp burning", d:"Each day you complete a devotional, your lamp lights up and your streak grows. Tap the lamp to see your goal, your points and your faith tree.", art:"lamp"},
 {tab:"explore", t:"Explore", d:"Daily verses and audio podcasts with Bible teaching and stories — perfect for your commute or a quiet moment.", art:"explore"},
 {tab:"journal", t:"Journal", d:"Write a short reflection after each devotional and look back on how far God has brought you.", art:"journal"},
 {tab:"community", t:"Community", d:"Share a prayer request and pray for believers around the world. Tap “Amen” when you’ve prayed.", art:"community"},
 {tab:"bible", t:"The Bible", d:"The whole Bible in two versions, with highlights, sharing, light and dark reading modes and audio.", art:"bible"},
];
function tourArt(k){
  const ico={welcome:"path",journey:"path",listen:"head",lamp:null,explore:"explore",journal:"journal",community:"community",bible:"bible"}[k];
  const inner = k==="lamp" ? LAMP(true,86) : k==="welcome" ? `<img src="images/logo-stacked.svg" style="width:120px">` : ic(ico).replace("<svg ",'<svg style="width:72px;height:72px;color:#fff" ');
  return `<div class="tart t-${k}">${clouds(90,"white","opacity:.5")}<div class="tart-in">${inner}</div></div>`;
}
function startTour(){
  let i=0; const el=document.createElement("div"); el.className="tour"; document.body.appendChild(el);
  const tabs=["journey","explore","journal","community","bible"];
  const paint=(dir=1)=>{ const s=TOUR[i];
    el.innerHTML=`<div class="tour-top"><div class="tour-dots">${TOUR.map((_,k)=>`<i class="${k===i?"on":k<i?"done":""}"></i>`).join("")}</div><button class="link" data-skip>Skip</button></div>
      <div class="tour-body ${dir>0?"slideL":"slideR"}">${tourArt(s.art)}<h2>${s.t}</h2><p>${s.d}</p></div>
      ${s.tab?`<div class="tour-tabs">${tabs.map(t=>`<span class="${t===s.tab?"on":""}">${ic({journey:"path",explore:"explore",journal:"journal",community:"community",bible:"bible"}[t])}</span>`).join("")}</div>`:`<div style="height:62px"></div>`}
      <div class="tour-foot">${i>0?`<button class="btn ghost" data-prev style="width:auto;padding:0 22px">${ic("back").replace("<svg ",'<svg style="width:18px;height:18px" ')}</button>`:""}<button class="btn" data-next>${i===TOUR.length-1?"Start my journey":"Next"}</button></div>
      ${i===TOUR.length-1&&!isStandalone()?`<div style="text-align:center;margin-top:10px">${installBtn("light")}</div>`:""}`;
    el.querySelector("[data-skip]").onclick=done; el.querySelector("[data-next]").onclick=()=>{ if(i<TOUR.length-1){ i++; paint(1); } else done(); };
    const p=el.querySelector("[data-prev]"); if(p) p.onclick=()=>{ i--; paint(-1); };
  };
  function done(){ S.seen.tour=1; save(); el.classList.add("out"); setTimeout(()=>el.remove(),300); }
  let x0=null; el.addEventListener("touchstart",e=>x0=e.touches[0].clientX,{passive:true});
  el.addEventListener("touchend",e=>{ if(x0===null) return; const dx=e.changedTouches[0].clientX-x0; if(dx<-50&&i<TOUR.length-1){ i++; paint(1); } else if(dx>50&&i>0){ i--; paint(-1); } x0=null; });
  paint();
}

/* ---------- welcome / auth ---------- */
function renderWelcome(step, prefill){
  if(step){
    const mode = step; // "login" | "first" | "reset"
    const isLogin = mode==="login";
    const title = {login:"Welcome back", first:"Create your access", reset:"Reset your password"}[mode];
    const sub = {login:"Sign in with the email you used to purchase.", first:"Use the email from your purchase and the purchase code we sent you.", reset:"Confirm your purchase to choose a new password."}[mode];
    $app.innerHTML = `<div class="welcome auth" style="justify-content:flex-start;padding-top:calc(env(safe-area-inset-top) + 20px)">
      <button class="icon-btn" id="bk" style="align-self:flex-start">${ic("back")}</button>
      <h1 style="margin:34px 0 8px">${title}</h1><p class="muted" style="margin-bottom:22px">${sub}</p>
      ${mode==="first"?`<input class="field" id="nm" placeholder="Your first name" autocomplete="given-name" style="margin-bottom:12px">`:""}
      <input class="field" id="em" type="email" placeholder="Email from your purchase" autocomplete="email" inputmode="email" value="${esc(prefill||"")}">
      ${isLogin?"":`<input class="field" id="cd" placeholder="Purchase code (starts with HP)" autocapitalize="characters" style="margin-top:12px"><button class="link" id="where" style="align-self:flex-start;font-size:13px;margin-top:8px">Where do I find my purchase code?</button>`}
      <input class="field" id="pw" type="password" placeholder="${isLogin?"Password":"Choose a password (6+ characters)"}" autocomplete="${isLogin?"current-password":"new-password"}" style="margin-top:12px">
      <div class="auth-err" id="err"></div>
      <button class="btn" id="go" style="margin-top:14px">${isLogin?"Sign in":mode==="first"?"Create my access":"Save new password"}</button>
      ${isLogin?`<button class="link" id="fg" style="margin-top:16px">Forgot your password?</button><button class="link" id="fa" style="margin-top:12px">First time here? Create your access</button>`:`<button class="link" id="li" style="margin-top:16px">I already have a password</button>`}
      <p class="muted" style="font-size:12.5px;margin-top:18px">By continuing you agree to our <a class="link" href="${CONFIG.termsUrl}">Terms</a> and <a class="link" href="${CONFIG.privacyUrl}">Privacy Policy</a>.</p></div>`;
    const $=id=>document.getElementById(id), err=m=>{ $("err").textContent=m||""; };
    $("bk").onclick=()=>renderWelcome();
    $("fg")&&($("fg").onclick=()=>renderWelcome("reset",$("em").value)); $("fa")&&($("fa").onclick=()=>renderWelcome("first",$("em").value)); $("li")&&($("li").onclick=()=>renderWelcome("login",$("em").value));
    $("where")&&($("where").onclick=()=>sheet(`<h3>Your purchase code</h3><p style="font-size:14px">After buying, Hotmart sent you an email with your purchase details. Look for the <b>transaction code</b> — it starts with <b>HP</b> (for example HP1234567890).</p><p style="font-size:14px">You can also find it at <b>consumer.hotmart.com</b> → My purchases.</p><button class="btn" data-x>Got it</button>`,(s,c)=>s.querySelector("[data-x]").onclick=c));
    ["em","pw","cd","nm"].forEach(id=>$(id)&&($(id).oninput=()=>err("")));
    $("go").onclick=async()=>{
      const em=$("em").value.trim().toLowerCase(), pw=$("pw").value, btn=$("go");
      if(!/^\S+@\S+\.\S+$/.test(em)){ err("Please enter a valid email."); return; }
      if(em===CONFIG.adminEmail){
        if(await sha256(pw)!==CONFIG.adminHash){ err("Incorrect password."); return; }
        S.user={name:"Admin", email:em, admin:true}; S.dev=true; save(); tab="journey"; render(); toast("Signed in as admin — all days unlocked");
        if(sbc){ sbc.auth.signInWithPassword({email:em,password:pw}).then(({data})=>{ if(data&&data.user){ S.user.uid=data.user.id; save(); } }).catch(()=>{}); }
        return;
      }
      if(!sbc){ err("Can’t connect right now. Check your internet and try again."); return; }
      if(!pw||pw.length<6){ err(isLogin?"Please enter your password.":"Your password needs at least 6 characters."); return; }
      const label=btn.textContent; btn.disabled=true; btn.innerHTML='<span class="spin"></span>';
      try{
        if(!isLogin){
          const code=$("cd").value.trim(); if(!code){ throw new Error("Please enter your purchase code."); }
          await fnCall("member-access",{action:"claim", email:em, code, password:pw, name:$("nm")?$("nm").value.trim():undefined});
        }
        const {data,error}=await sbc.auth.signInWithPassword({email:em,password:pw});
        if(error){ if(isLogin){ const c=await fnCall("member-access",{action:"check",email:em}).catch(()=>null); if(c&&c.member&&!c.hasAccount) throw new Error("This is your first time — create your access with your purchase code."); } throw new Error("Email or password is incorrect."); }
        const uid=data.user.id, nm=(data.user.user_metadata&&data.user.user_metadata.name)||em.split("@")[0];
        S.user={name:nm.charAt(0).toUpperCase()+nm.slice(1), email:em, uid}; S.dev=false; save();
        await pullState(uid);
        if(!(await checkAccess())) return;
        tab="journey"; render(); toast(isLogin?`Welcome back, ${S.user.name}`:"Your access is ready. Welcome!");
      }catch(e){ err(e.message); btn.disabled=false; btn.textContent=label; }
    };
    return;
  }
  $app.innerHTML = `<div class="welcome">
    <img src="images/logo-stacked.svg" alt="VEREDA" style="width:150px">
    <h1 style="margin-top:26px;font-size:24px;line-height:1.3">Find daily peace and grow closer to God</h1>
    <div class="laurel" style="margin-top:22px"><span class="stars">★★★★★</span> 4.8 rating</div>
    <div class="laurel" style="margin-top:6px">Join 950K believers</div>
    <div style="flex:1"></div>
    <svg viewBox="0 0 320 120" style="width:100%;max-width:360px;margin-bottom:24px"><path d="M160 118C150 90 120 80 140 55s40-20 30-50" stroke="#0E5F95" stroke-width="18" fill="none" stroke-linecap="round" opacity=".18"/><path d="M160 118C150 90 120 80 140 55s40-20 30-50" stroke="#0E5F95" stroke-width="3" stroke-dasharray="2 9" fill="none" stroke-linecap="round"/><circle cx="170" cy="5" r="5" fill="#C9973F"/></svg>
    <button class="btn" id="start">Start my journey</button>
    <button class="link" id="have" style="margin-top:18px">I already have an account</button>
    <div style="margin-top:16px;width:100%">${installBtn()}</div></div>`;
  document.getElementById("start").onclick=()=>renderWelcome("first");
  document.getElementById("have").onclick=()=>renderWelcome("login");
}

/* ---------- JOURNEY ---------- */
const GLY={lamp:"flame",name:"heart",gift:"gift",prayer:"hands",wait:"sprout",shield:"shield",tree:"sprout"};
let todayCollapsed=false, cdTimer=null, ROAD=null;
const TREE=`<svg viewBox="0 0 40 56" width="34"><rect x="18" y="38" width="4" height="14" rx="2" fill="#9A7B5B"/><path d="M20 4 34 30H6Z" fill="#8DB89A"/><path d="M20 14 37 42H3Z" fill="#7AAA88"/></svg>`;
const BUSH=`<svg viewBox="0 0 48 30" width="38"><circle cx="14" cy="18" r="10" fill="#9CC3A6"/><circle cx="26" cy="13" r="12" fill="#8DB89A"/><circle cx="37" cy="19" r="9" fill="#A8CCB0"/><circle cx="20" cy="12" r="2" fill="#F4C46A"/><circle cx="33" cy="15" r="2" fill="#F2A3A3"/></svg>`;
function smoothPath(P){ if(P.length<2) return ""; let d=`M${P[0][0]} ${P[0][1]}`; for(let i=0;i<P.length-1;i++){ const p0=P[i-1]||P[i], p1=P[i], p2=P[i+1], p3=P[i+2]||p2; const c1=[p1[0]+(p2[0]-p0[0])/5, p1[1]+(p2[1]-p0[1])/5], c2=[p2[0]-(p3[0]-p1[0])/5, p2[1]-(p3[1]-p1[1])/5]; d+=` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`; } return d; }
function drawRoad(animate){
  const road=document.getElementById("road"), svg=document.getElementById("roadsvg"); if(!road||!svg||!ROAD) return;
  const R=road.getBoundingClientRect();
  const pts=[...road.querySelectorAll("[data-node]")].sort((a,b)=>a.dataset.node-b.dataset.node).map(n=>{ const h=n.querySelector(".hex").getBoundingClientRect(); return {x:h.left+h.width/2-R.left, y:h.top+h.height/2-R.top, i:+n.dataset.node}; });
  let lastDone=-1; LESSONS.forEach(l=>{ if(S.completed[l.key]) lastDone=l.idx; });
  const walkedTo = Math.max(lastDone, ROAD.cur<LESSONS.length && isAvailable(ROAD.cur) ? ROAD.cur : lastDone);
  let dGrey="", dBlue="";
  for(let k=0;k<pts.length-1;k++){
    const a=pts[k], b=pts[k+1]; let seg;
    if(Math.abs(a.y-b.y)<8) seg=`M${a.x} ${a.y} L${b.x} ${b.y}`;
    else { const dy=b.y-a.y; seg=`M${a.x} ${a.y} C${a.x} ${a.y+dy*.55} ${b.x} ${b.y-dy*.55} ${b.x} ${b.y}`; }
    if(b.i<=walkedTo) dBlue+=seg; else dGrey+=seg;
  }
  svg.setAttribute("width",R.width); svg.setAttribute("height",road.scrollHeight);
  svg.innerHTML=`<path d="${dGrey}" stroke="#C9CED6" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-dasharray="0.5 10"/><path class="walk" d="${dBlue}" stroke="#5B9BD0" stroke-width="4" fill="none" stroke-linecap="round" stroke-dasharray="0.5 10"/>`;
  if(animate && dBlue){ const p=svg.querySelector(".walk"); p.style.opacity=0; p.getBoundingClientRect(); p.style.transition="opacity .8s .3s"; p.style.opacity=1; }
}
window.addEventListener("resize",()=>drawRoad(false));
function msToMidnight(){ const n=new Date(), m=new Date(n); m.setHours(24,0,0,0); return m-n; }
const hms = ms => { const s=Math.floor(ms/1000); return [Math.floor(s/3600),Math.floor(s%3600/60),s%60].map(x=>String(x).padStart(2,"0")).join(":"); };
function viewJourney(){
  const T = todayLesson(); const L=T.L; const st=stepsOf(L.key);
  const allDone = T.done;
  const has = !!C.lessons[L.key];
  const steps = STEPS.map(s=>`<div class="st ${allDone||st[s.k]?"done":""}">${ic(s.icon)} ${s.label}<span class="ck"></span></div>`).join("");
  const card = `<div class="today ${todayCollapsed?"collapsed":""}" id="today">
    <div class="lbl">Devotional ${L.idx+1}</div>
    <div class="ttl" id="tgl"><span>${esc(L.title)}</span>${ic("chev")}</div>
    <div class="steps">${steps}</div>
    ${allDone ? "" : T.locked ? `<button class="btn ghost sm" disabled>Unlocks tomorrow</button>` : !has ? `<button class="btn ghost sm" disabled>New lesson coming soon</button>` :
      `<div class="acts"><button class="btn ghost sm" data-open="read">Read</button><button class="btn sm" data-open="listen">Listen</button></div>`}
  </div>${allDone||T.locked?`<div class="countdown">New activities in <span id="cd">${hms(msToMidnight())}</span></div>`:""}`;
  // path
  const cur = currentIndex();
  let html = "";
  MOD.chapters.forEach((ch,ci)=>{
    html += `<div class="ch-head"><small>Chapter ${ci+1}:</small><b>${esc(ch.title)}</b></div>`;
    const items = LESSONS.filter(l=>l.ci===ci);
    for(let k=0;k<items.length;k+=3){
      const pair=items.slice(k,k+2), mid=items[k+2];
      html += `<div class="row">${pair.map(nodeHTML).join("")}</div>`;
      if(mid) html += `<div class="row center">${nodeHTML(mid)}</div>`;
    }
  });
  ROAD={cur};
  html = `<div class="trail" id="road"><svg class="road-svg" id="roadsvg"></svg>${html}</div>`;
  function nodeHTML(l){
    const done=!!S.completed[l.key], current=l.idx===cur && isAvailable(l.idx), open=done||current||isAdmin();
    const hx = current ? HEX("#9CCBEE","#2F7DB8","#1D5F92",.45) : done ? HEX("#C9E0F2","#6FA8D4","#4C86B4",.5) : open ? HEX("#DCEBF7","#8FBCE0","#6A9CC4",.5) : HEX("#F3F5F7","#C9CFD7","#A9B1BC",.55);
    const kind=C.lessons[l.key]?.image; const icon = open ? (GLY[kind]||"path") : "lock";
    return `<button class="node ${open?"open":"locked"} ${current?"current":""}" data-node="${l.idx}"><div class="hex">${hx}${ic(icon,"ico")}</div><span>${esc(l.title)}</span></button>`;
  }
  const next = C.modules[1];
  html += `<div class="next-mod"><span class="tag">UP NEXT</span><b>Module 2: ${esc(next.title)} ${ic("lock").replace('<svg ','<svg style="width:16px;height:16px;vertical-align:-2px" ')}</b><span class="muted" style="font-size:14px">The next modules unlock after you finish the current one</span></div>`;
  return `<div class="screen journey"><div class="safe-top"></div>
    <div class="j-top"><button class="chip" id="mod">Module 1${isAdmin()?' <span style="color:var(--gold);font-weight:800">· ADMIN</span>':""}</button><div style="display:flex;gap:8px">${(()=>{ const w=walkStats(); return `<button class="chip lampchip ${w.doneToday?"lit":""}" id="walk">${LAMP(w.doneToday,18)}<b>${w.cur}</b></button>`; })()}<button class="icon-btn" id="hl">${ic("bookmark")}</button><button class="icon-btn" id="me">${initials(S.user.name)}</button></div></div>
    ${card}<div style="position:relative;height:84px">${clouds(96,"bg","bottom:-2px")}</div><div class="path">${html}</div></div><button class="fab-top hidden" id="top">${ic("up")}</button>
    <div class="j-mini" id="jmini"><button>${esc(L.title)}${ic("chev")}</button>${allDone||T.locked?`<div class="countdown" style="margin:8px 0 0">New activities in <span class="cd2">${hms(msToMidnight())}</span></div>`:""}</div>`;
}
afterRender.journey = () => {
  const anim=!sessionStorage.getItem("vroad"); sessionStorage.setItem("vroad","1"); requestAnimationFrame(()=>drawRoad(anim)); setTimeout(()=>drawRoad(false),600); document.fonts&&document.fonts.ready.then(()=>drawRoad(false));
  document.getElementById("tgl").onclick=()=>{ todayCollapsed=!todayCollapsed; document.getElementById("today").classList.toggle("collapsed",todayCollapsed); };
  document.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>{ const L=todayLesson().L; openLesson(L.key, b.dataset.open); });
  document.querySelectorAll("[data-node]").forEach(b=>b.onclick=()=>{
    const l=LESSONS[+b.dataset.node];
    if(isAdmin()){ if(C.lessons[l.key]) openLesson(l.key,"read",0); else sheet(`<h3>${esc(l.title)}</h3><p>Day ${l.idx+1} · Chapter ${l.ci+1}: ${esc(MOD.chapters[l.ci].title)}<br><br>The content for this day hasn’t been written yet.</p><button class="btn" data-x>Got it</button>`,(s,c)=>s.querySelector("[data-x]").onclick=c); return; }
    if(S.completed[l.key]){ if(C.lessons[l.key]) openLesson(l.key,"read",0,true); return; }
    if(l.idx===currentIndex() && isAvailable(l.idx)){ if(C.lessons[l.key]) openLesson(l.key,"read"); else toast("This lesson is being prepared"); return; }
    if(l.idx===currentIndex()) sheet(`<h3>Come back tomorrow</h3><p>New activities unlock tomorrow if you complete today’s devotional.</p><button class="btn" data-x>Got it</button>`,(s,close)=>s.querySelector("[data-x]").onclick=close);
    else sheet(`<h3>Locked</h3><p>Complete the previous days to unlock “${esc(l.title)}”. A new day opens every day.</p><button class="btn" data-x>Got it</button>`,(s,close)=>s.querySelector("[data-x]").onclick=close);
  });
  document.getElementById("mod").onclick=()=>sheet(`<h3 style="text-align:left">Your progress</h3>
    <div class="card" style="padding:16px;border:1.5px solid var(--blue);margin-bottom:12px"><b style="color:var(--ink)">Module 1: ${esc(MOD.title)}</b><div class="muted" style="font-size:13.5px;margin-top:4px">${esc(MOD.subtitle)}</div>
    <div class="bar" style="margin-top:12px"><i style="width:${Math.round(currentIndex()/LESSONS.length*100)}%"></i></div><div class="muted" style="font-size:12.5px;margin-top:6px">${currentIndex()} of ${LESSONS.length} days completed</div></div>
    <div class="card" style="padding:14px;text-align:center;box-shadow:none;border:1px solid var(--line)"><span class="muted" style="font-size:13.5px">The next modules unlock after you finish the current one</span></div>`);
  document.getElementById("me").onclick=openProfile;
  document.getElementById("hl").onclick=openHighlights;
  document.getElementById("walk").onclick=openWalk;
  const top=document.getElementById("top"); top.onclick=()=>window.scrollTo({top:0,behavior:"smooth"});
  const jm=document.getElementById("jmini"); jm.querySelector("button").onclick=()=>window.scrollTo({top:0,behavior:"smooth"});
  window.onscroll=()=>{ top.classList.toggle("hidden",window.scrollY<500); jm.classList.toggle("show",window.scrollY>330); };
  if(sessionStorage.getItem("vjust")){ sessionStorage.removeItem("vjust"); document.querySelectorAll(".today .st .ck").forEach((c,i)=>c.style.animationDelay=(0.25+i*0.18)+"s"); } else document.querySelectorAll(".today .st .ck").forEach(c=>c.style.animation="none");
  clearInterval(cdTimer); cdTimer=setInterval(()=>{ const e=document.getElementById("cd"); if(!e){ clearInterval(cdTimer); return; } const ms=msToMidnight(); e.textContent=hms(ms); document.querySelectorAll(".cd2").forEach(x=>x.textContent=hms(ms)); if(ms<1500) setTimeout(render,1600); },1000);
  if(!S.seen.notif && "Notification" in window && Notification.permission==="default"){ S.seen.notif=1; save();
    setTimeout(()=>sheet(`<h3>Daily reminder</h3><p>Allow notifications so VEREDA can remind you when your next day unlocks.</p><button class="btn" data-y>Allow</button><button class="btn ghost" data-x style="margin-top:10px">Not now</button>`,(s,close)=>{ s.querySelector("[data-x]").onclick=close; s.querySelector("[data-y]").onclick=()=>{ Notification.requestPermission(); close(); }; }),700); }
};

/* ---------- LESSON PLAYER ---------- */
function laurel(){
  let L="";
  for(const side of [-1,1]) for(let i=0;i<9;i++){
    const a=side<0? 100+i*14 : 80-i*14, r=a*Math.PI/180, x=80+52*Math.cos(r), y=58+52*Math.sin(r), rot=a+(side<0?25:-25);
    L+=`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="5.5" ry="11.5" transform="rotate(${rot.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
    if(i%2===1) L+=`<circle cx="${(x+(side<0?9:-9)).toFixed(1)}" cy="${(y-4).toFixed(1)}" r="3.6" fill="#8A9A3A"/>`;
  }
  return `<svg class="laurel-w" viewBox="0 0 160 130" width="200"><g fill="#6E8F3A">${L}</g></svg>`;
}
function artBox(kind){ return `<div class="art">${art(kind)}${puff("6%","12%",86,10,.85,1)}${puff("62%","6%",64,13,.75,5)}${puff("30%","62%",110,12,.6,3)}</div>`; }
function openLesson(key, mode="read", startStep, review){
  const D = C.lessons[key]; const L = LESSONS.find(l=>l.key===key); if(!D) return;
  const st=stepsOf(key);
  let step = startStep ?? STEPS.findIndex(s=>!st[s.k]); if(step<0) step=0;
  let quiz = {i:-1, answers:[]}; let audioStep=-1;
  const el=document.createElement("div"); el.className="player"; document.body.appendChild(el); document.body.style.overflow="hidden";
  const close=()=>{ N.stop(); el.remove(); document.body.style.overflow=""; render(); };
  const prayerText = D.prayer.join(" ");
  const devText = D.devotional.map(b=>b.h? b.h+"." : b.v? `${b.v} ${b.r}.` : b.p.replace(/\*/g,"")).join(" ");
  const sk = () => STEPS[step].k;
  const audible = () => sk()==="prayer"||sk()==="devotional";
  const subOf = s => s==="prayer"?"Daily Prayer":"Today’s Word";
  function head(){
    const seg = audible();
    return `<div class="p-head"><div class="p-top"><button class="icon-btn" data-back>${ic("back")}</button>${seg?`<div class="seg ${mode==="listen"?"listen":""}"><span class="knob"></span><button class="${mode==="read"?"on":""}" data-mode="read">${ic("lines")}Read</button><button class="${mode==="listen"?"on":""}" data-mode="listen">${ic("head")}Listen</button></div>`:`<div class="p-title">${esc(L.title)}<small>${esc(STEPS[step].label==="Scripture & today’s word"?"":({quiz:"Quiz",action:"One action"})[sk()]||"")}</small></div>`}<button class="icon-btn" data-close>${ic("x")}</button></div>
      <div class="prog">${STEPS.map((s,i)=>`<i class="${i<=step?"on":""}"></i>`).join("")}</div></div>`;
  }
  function audioUI(){
    const vs=N.voices(); const vname=(vs.find(v=>v.name===S.voice)||vs[0]||{name:"Default"}).name.split(/[ (]/)[0];
    const tot=N.total(), e2=N.elapsed(), pct=tot?Math.min(100,e2/tot*100):0;
    return `<div class="aud">${artBox(D.image)}<h2>${esc(L.title)}</h2><div class="sub">${esc(subOf(sk()))}</div>
      <div class="bar"><i style="width:${pct}%;transition:width .4s"></i><b style="left:${pct}%;transition:left .4s"></b></div><div class="times"><span>${mmss(e2)}</span><span>${Math.max(0,Math.round(tot-e2))} sec remaining</span><span>${mmss(tot)}</span></div>
      <div class="ctrls"><button class="spd" data-rate>${S.rate||1}×</button><button class="sk" data-sk="-10">${ic("rw")}</button><button class="play" data-pp>${ic(N.playing?"pause":"play")}</button><button class="sk" data-sk="10">${ic("fw")}</button><span style="width:44px"></span></div>
      <div class="pills"><button class="pill" data-voice>${N.playing?'<span class="wavebars" style="margin:0"><i></i><i></i><i></i><i></i><i></i></span>':ic("wave")} ${esc(vname)}</button></div></div>`;
  }
  function miniUI(){
    if(!(mode==="read" && audioStep===step && (N.playing || N.i>0))) return "";
    const tot=N.total(), pct=tot?Math.min(100,N.elapsed()/tot*100):0;
    return `<div class="mini"><div class="th">${art(D.image)}</div><div style="flex:1"><b>${esc(L.title)}</b><div class="bar"><i style="width:${pct}%"></i></div></div><button data-mpp>${ic(N.playing?"pause":"play").replace("<svg ",'<svg style="width:22px;height:22px" ')}</button></div>`;
  }
  function content(){
    const s=sk();
    if(s==="prayer") return mode==="listen" ? audioUI() : `${artBox(D.image)}<div class="prose">${D.prayer.map(p=>`<p>${md(p)}</p>`).join("")}</div>`;
    if(s==="devotional") return mode==="listen" ? audioUI() : `<div class="prose">${D.devotional.map(b=> b.h?`<h2>${esc(b.h)}</h2>` : b.v?`<div class="verse"><q>${esc(b.v)}</q><div class="ref">${esc(b.r)}</div><div class="va"><button data-copy="${esc(b.v+" — "+b.r)}">${ic("copy")}Copy</button><button data-share="${esc(b.v+" — "+b.r)}">${ic("share")}Share the wisdom</button></div></div>` : `<p>${md(b.p)}</p>`).join("")}</div>`;
    if(s==="quiz") return quizUI();
    if(s==="action") return `<div class="action">${clouds(170,"white","opacity:.8")}<button class="remind" data-remind>${ic("bell")} Remind me later</button><p>${esc(D.action)}</p><button class="tap ${st.action?"done":""}" data-tap>${st.action?ic("check"):""}</button><div class="tap-l">${st.action?"Great job!":"Tap to complete"}</div><div style="margin-top:auto"></div></div>`;
  }
  function quizUI(){
    const Q=D.quiz;
    if(quiz.i===-1) return `<div class="scene sky" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">${clouds(220,"white")}${puff("4%","10%",120,10,.8,2)}${puff("66%","18%",90,12,.7,6)}
      <svg class="floaty-ico" viewBox="0 0 140 140" width="160" height="160" style="margin-top:-60px"><defs><radialGradient id="qb" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".7" stop-color="#E4EAF1"/><stop offset="1" stop-color="#C5D0DC"/></radialGradient></defs><path d="M70 14c31 0 54 21 54 50s-23 50-54 50c-7 0-13-1-19-3l-22 13 6-21C22 94 16 80 16 64c0-29 23-50 54-50Z" fill="url(#qb)"/><path d="M56 52a14 14 0 1 1 20 13c-4 2-6 5-6 10" stroke="#B6C2CF" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="70" cy="90" r="5.5" fill="#B6C2CF"/></svg>
      <div class="k st1" style="color:var(--blue);font-weight:700;margin-top:18px">You made space for God</div><h2 class="st2" style="font-size:28px;color:var(--ink);margin-top:6px">Let’s make it stick</h2></div>`;
    if(quiz.i>=Q.length) return `<div class="scene peach" style="padding-bottom:130px">${clouds(160,"white","top:120px;bottom:auto;opacity:.8")}<div class="center-hero">
      <svg class="floaty-ico" viewBox="0 0 140 140" width="130" height="130"><defs><radialGradient id="sg" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#FFF3C4"/><stop offset="1" stop-color="#F2B544"/></radialGradient></defs><circle cx="70" cy="62" r="46" fill="#FFE7A3" opacity=".35"/><path d="m70 18 14 29 32 4-23 22 6 32-29-15-29 15 6-32-23-22 32-4Z" fill="url(#sg)"/><path d="M40 112c8-14 20-20 30-18s16 8 26 6c8-2 12 4 6 10-10 10-30 14-46 12-8-1-14-4-16-10Z" fill="#E9958A"/></svg>
      <div class="k st1">Good job!</div><h2 class="st2">This is taking root in you</h2></div><div class="stagger">${Q.map((q,i)=>`<div class="sum" style="animation-delay:${0.6+i*0.12}s"><small>${esc(q.q)}</small><div>${esc(q.o[q.a])}</div><button data-why="${i}">?</button></div>`).join("")}</div></div>`;
    const q=Q[quiz.i]; const ans=quiz.answers[quiz.i];
    return `<div class="qwrap"><div class="qcard"><div class="n">Question ${quiz.i+1} of ${Q.length}</div><h3>${esc(q.q)}</h3>${q.o.map((o,j)=>`<button class="opt ${ans!==undefined&&j===q.a?"ok":""} ${ans===j&&j!==q.a?"no":""}" data-opt="${j}">${esc(o)}</button>`).join("")}</div></div>`;
  }
  function foot(){
    const s=sk();
    if(s==="quiz" && quiz.i>=0 && quiz.i<D.quiz.length) return "";
    if(s==="action" && !st.action) return `<div class="p-foot"><button class="btn" disabled>Continue</button></div>`;
    return `<div class="p-foot"><button class="btn" data-next>Continue</button></div>`;
  }
  function paint(anim=true){
    el.classList.remove("immersive");
    const bg = (sk()==="quiz" && (quiz.i===-1||quiz.i>=D.quiz.length)) ? (quiz.i===-1?"#CFE3F4":"#FCE6CC") : "";
    el.style.background = bg && document.documentElement.dataset.theme!=="dark" ? (bg==="#FCE6CC"?"#FFF3D6":bg) : "";
    el.innerHTML = head()+`<div class="p-body"><div class="${anim?"stepin":""}">${content()}</div></div>${miniUI()}${foot()}`;
    bind();
  }
  function bind(){
    el.querySelector("[data-back]").onclick=()=>{ if(sk()==="quiz" && quiz.i>0 && quiz.i<D.quiz.length){ quiz.i--; paint(); return; } if(step>0){ step--; if(sk()==="quiz") quiz.i=D.quiz.length; paint(); } else close(); };
    el.querySelector("[data-close]").onclick=close;
    el.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{ if(mode===b.dataset.mode) return; mode=b.dataset.mode; el.querySelector(".seg")?.classList.toggle("listen",mode==="listen");
      setTimeout(()=>{ if(mode==="listen"){ if(audioStep!==step){ loadAudio(); } paint(); if(!N.playing) N.play(); } else paint(); },180); });
    el.querySelectorAll("[data-copy]").forEach(b=>b.onclick=()=>copyText(b.dataset.copy));
    el.querySelectorAll("[data-share]").forEach(b=>b.onclick=()=>shareText(b.dataset.share+"\n\n— shared from VEREDA"));
    bindAudio();
    const body=el.querySelector(".p-body"); let lastY=0;
    body.onscroll=()=>{ const y=body.scrollTop; if(y>80 && y>lastY+4) el.classList.add("immersive"); else if(y<lastY-4 || y<40) el.classList.remove("immersive"); lastY=y; };
    el.querySelectorAll("[data-opt]").forEach(b=>b.onclick=()=>answer(+b.dataset.opt));
    el.querySelectorAll("[data-why]").forEach(b=>b.onclick=()=>sheet(`<p style="text-align:left">${esc(D.quiz[+b.dataset.why].e)}</p><button class="btn" data-x>Got it!</button>`,(s,c)=>s.querySelector("[data-x]").onclick=c));
    const tap=el.querySelector("[data-tap]"); if(tap) tap.onclick=()=>{ if(st.action) return; st.action=true; save(); navigator.vibrate&&navigator.vibrate(18);
      tap.classList.add("done"); tap.innerHTML=ic("check")+'<span class="rp"></span>'; el.querySelector(".tap-l").textContent="Great job!"; el.querySelector(".p-foot").outerHTML=`<div class="p-foot"><button class="btn" data-next>Continue</button></div>`; el.querySelector("[data-next]").onclick=next; };
    const rm=el.querySelector("[data-remind]"); if(rm) rm.onclick=remindSheet;
    const nx=el.querySelector("[data-next]"); if(nx) nx.onclick=next;
  }
  function bindAudio(){
    const pp=el.querySelector("[data-pp]"); if(pp) pp.onclick=()=>{ N.playing?N.pause():N.play(); };
    const mp=el.querySelector("[data-mpp]"); if(mp) mp.onclick=()=>{ N.playing?N.pause():N.play(); };
    el.querySelectorAll("[data-sk]").forEach(b=>b.onclick=()=>N.seek(+b.dataset.sk));
    const rt=el.querySelector("[data-rate]"); if(rt) rt.onclick=()=>{ const r=[0.75,1,1.25,1.5]; S.rate=r[(r.indexOf(S.rate||1)+1)%r.length]; save(); if(N.playing) N.speak(); N.emit(); };
    const vc=el.querySelector("[data-voice]"); if(vc) vc.onclick=voiceSheet;
  }
  function voiceSheet(){
    const vs=N.voices(); if(!vs.length){ toast("No extra voices on this device"); return; }
    const cur=S.voice||vs[0].name;
    sheet(`<h3 style="text-align:left">Choose a narrator</h3>${vs.map(v=>`<button class="opt ${cur===v.name?"ok":""}" data-v="${esc(v.name)}" style="display:flex;align-items:center"><span><b>${esc(v.name.split(/[ (]/)[0])}</b><div class="muted" style="font-size:12.5px">${esc(v.name)}</div></span>${cur===v.name?'<span class="wavebars"><i></i><i></i><i></i><i></i><i></i></span>':""}</button>`).join("")}<button class="btn" data-ok style="margin-top:6px">Continue</button>`,(s,c)=>{
      let pick=cur; s.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>{ pick=b.dataset.v; s.querySelectorAll("[data-v]").forEach(x=>{ x.classList.toggle("ok",x===b); x.querySelector(".wavebars")?.remove(); }); b.insertAdjacentHTML("beforeend",'<span class="wavebars"><i></i><i></i><i></i><i></i><i></i></span>');
        if(window.speechSynthesis){ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance("Hello, I’ll be reading with you today."); u.voice=vs.find(v=>v.name===pick); u.rate=S.rate||1; speechSynthesis.speak(u); } });
      s.querySelector("[data-ok]").onclick=()=>{ S.voice=pick; save(); c(); if(N.playing) N.speak(); N.emit(); }; });
  }
  function loadAudio(){ if(sk()==="prayer") N.load(prayerText,"Daily Prayer"); else if(sk()==="devotional") N.load(devText,"Today’s Word"); audioStep=step; }
  N.onupdate = () => {
    if(!el.isConnected) return;
    const a=el.querySelector(".aud");
    if(a && audioStep===step){ const pct=N.total()?Math.min(100,N.elapsed()/N.total()*100):0; a.querySelector(".bar i").style.width=pct+"%"; a.querySelector(".bar b").style.left=pct+"%";
      const tm=a.querySelectorAll(".times span"); tm[0].textContent=mmss(N.elapsed()); tm[1].textContent=Math.max(0,Math.round(N.total()-N.elapsed()))+" sec remaining"; tm[2].textContent=mmss(N.total());
      a.querySelector("[data-pp]").innerHTML=ic(N.playing?"pause":"play"); a.querySelector("[data-rate]").textContent=(S.rate||1)+"×";
      const vs=N.voices(); const vname=(vs.find(v=>v.name===S.voice)||vs[0]||{name:"Default"}).name.split(/[ (]/)[0];
      a.querySelector("[data-voice]").innerHTML=(N.playing?'<span class="wavebars" style="margin:0"><i></i><i></i><i></i><i></i><i></i></span>':ic("wave"))+" "+esc(vname); bindAudio(); }
    const m=el.querySelector(".mini");
    if(m){ const pct=N.total()?Math.min(100,N.elapsed()/N.total()*100):0; m.querySelector(".bar i").style.width=pct+"%"; m.querySelector("[data-mpp]").innerHTML=ic(N.playing?"pause":"play").replace("<svg ",'<svg style="width:22px;height:22px" '); }
  };
  function answer(j){
    if(quiz.answers[quiz.i]!==undefined) return; quiz.answers[quiz.i]=j; const q=D.quiz[quiz.i]; const ok=j===q.a; if(ok) addLight(10, "quiz-"+key+"-"+quiz.i, 1);
    el.querySelectorAll("[data-opt]").forEach((b,k)=>{ if(k===q.a) b.classList.add("ok"); if(k===j && !ok) b.classList.add("no"); });
    navigator.vibrate && navigator.vibrate(ok?15:[10,40,10]);
    const f=document.createElement("div"); f.className="feedback"+(ok?" ok":"");
    f.innerHTML=`<b class="${ok?"ok":""}"><span class="bi" style="background:${ok?"var(--ok)":"var(--ink)"}">${ok?"✓":"✕"}</span>${ok?["Well done!","That’s right!","Exactly!","Great answer!"][quiz.i%4]:"Almost there!"}</b><p>${esc(q.e)}</p><button class="btn white" style="border:1px solid var(--line)">Next</button>`;
    el.appendChild(f);
    f.querySelector("button").onclick=()=>{ f.style.transition="transform .2s"; f.style.transform="translate(-50%,100%)"; const card=el.querySelector(".qcard"); card&&card.classList.add("out");
      setTimeout(()=>{ f.remove(); quiz.i++; if(quiz.i>=D.quiz.length){ st.quiz=true; save(); } paint(); },220); };
  }
  function remindSheet(){
    const now=new Date(); let hh=now.getHours(), mm=Math.ceil(now.getMinutes()/5)*5%60;
    const col=(n,step2,sel)=>`<div class="col" data-col><div class="pad"></div>${Array.from({length:n},(_,i)=>`<div data-val="${i*step2}">${String(i*step2).padStart(2,"0")}</div>`).join("")}<div class="pad"></div></div>`;
    const v=C.verses[3];
    sheet(`<h3>Want to come back later?</h3><p style="font-size:14px">Pick a time that works for you — we’ll remind you to come back and complete this step when you’re ready.</p>
      <div class="wheel">${col(24,1)}${col(12,5)}</div>
      <div class="verse" style="margin:0 0 14px"><q>Delight yourself also in Yahweh, and he will give you the desires of your heart.</q><div class="ref" style="margin-bottom:0">Psalm 37:4</div></div>
      <button class="btn" data-set>Set reminder</button>`,(s,c)=>{
      const cols=s.querySelectorAll("[data-col]"); setTimeout(()=>{ cols[0].scrollTop=hh*40; cols[1].scrollTop=(mm/5)*40; },30);
      s.querySelector("[data-set]").onclick=async()=>{ const h=Math.round(cols[0].scrollTop/40), m=Math.round(cols[1].scrollTop/40)*5; const when=new Date(); when.setHours(h,m,0,0); if(when<new Date()) when.setDate(when.getDate()+1);
        let perm="denied"; if("Notification" in window){ perm = Notification.permission==="default" ? await Notification.requestPermission() : Notification.permission; }
        S.reminder={key, at:when.getTime()}; save(); c();
        if(perm==="granted"){ setTimeout(()=>{ try{ new Notification("VEREDA",{body:`Your “${L.title}” step is waiting for you.`, icon:"icons/icon-192.png"}); }catch(e){} }, when-new Date()); }
        toast(perm==="granted"?`We’ll remind you at ${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`:"Turn on notifications in your settings to get reminders"); };
    });
  }
  function next(){
    const s=sk();
    if(s==="quiz" && quiz.i===-1){ quiz.i=0; paint(); return; }
    st[s]=true; save();
    if(N.playing && audible()){ N.stop(); toast(`Want to keep listening? Go back to ${subOf(s)}`); } else N.stop();
    if(step<STEPS.length-1){ step++; if(sk()==="quiz") quiz={i:-1,answers:[]}; if(mode==="listen" && audible()){ loadAudio(); paint(); N.play(); } else paint(); return; }
    finish();
  }
  function finish(){
    const firstTime = !S.completed[key];
    const before=walkStats(); let earned=0, after=before;
    if(firstTime){ S.completed[key]=todayStr(); save(); sessionStorage.setItem("vjust","1"); after=walkStats();
      if(!before.doneToday){ const bonus=Math.round(50*0.05*Math.floor(after.cur/7)); earned=50+bonus; L_().total+=earned; L_().days[todayStr()]=(L_().days[todayStr()]||0)+earned; save(); } }
    const msHit = earned && after.cur!==before.cur && MILESTONES.includes(after.cur) ? after.cur : 0;
    navigator.vibrate && navigator.vibrate([15,60,25]);
    el.style.background = document.documentElement.dataset.theme==="dark" ? "" : "#E3EEDF";
    el.innerHTML = `<div class="p-body" style="padding:0;display:flex"><div class="done-scene scene green" style="margin:0;width:100%">${clouds(200,"white")}<div class="rays"></div>${puff("8%","18%",110,11,.8,2)}${puff("64%","10%",90,13,.7,6)}
      ${laurel()}<h2 class="st2" style="font-size:28px;color:var(--ink);text-align:center;margin-top:10px;line-height:1.2">You did great today!</h2><p class="muted st3" style="margin-top:8px;text-align:center">Before you finish, pause and reflect</p>
      ${earned?`<div class="earned st3"><span class="lampchip lit" style="pointer-events:none">${LAMP(true,18)}<b>${after.cur}</b></span><span>Lamp lit · <b>${after.cur} ${after.cur===1?"day":"days"}</b> in a row</span><span class="plus">+${earned} light</span></div>`:""}
      <div class="refl"><small>${ic("journal").replace("<svg ",'<svg style="width:14px;height:14px" ')} Your daily reflection</small><div>${esc(D.journal)}</div></div></div></div>
      <div class="p-foot st4" style="background:none"><button class="btn" data-ref>Write my reflection</button><button class="btn ghost" data-fin style="margin-top:10px;background:rgba(255,255,255,.75)">Finish for today</button></div>`;
    if(msHit) setTimeout(()=>milestoneCelebrate(msHit),1400);
    el.querySelector("[data-ref]").onclick=()=>{ el.remove(); document.body.style.overflow=""; tab="journal"; render(); openJournalEditor(D.journal, true); };
    el.querySelector("[data-fin]").onclick=()=>{ if(firstTime && !S.ratings[key]) rate(); else close(); };
  }
  function rate(){
    let v=0; el.style.background="";
    el.innerHTML = `<div class="p-top"><span></span><span></span><button class="icon-btn" data-close>${ic("x")}</button></div><div class="p-body center-hero" style="padding-top:40px"><div class="stepin">
      <svg class="floaty-ico" viewBox="0 0 120 80" width="150"><path d="M10 50c20-30 50-40 70-30 10-14 26-16 34-10-8 2-12 8-12 14 0 24-30 40-62 30C30 58 18 60 10 50Z" fill="#B8D4EC"/><circle cx="92" cy="22" r="3" fill="#1E2430"/><path d="M104 18l12-4-8 10" fill="#6DBA78"/></svg>
      <h2 style="font-size:22px;margin-top:10px">How would you rate this devotional?</h2>
      <div class="rate-stars">${[1,2,3,4,5].map(i=>`<button data-s="${i}">★</button>`).join("")}</div>
      <textarea class="field" id="rt" placeholder="Your thoughts (optional)" style="min-height:100px"></textarea></div></div>
      <div class="p-foot"><button class="btn" data-send disabled>Send feedback</button></div>`;
    el.querySelector("[data-close]").onclick=close;
    el.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{ v=+b.dataset.s; el.querySelectorAll("[data-s]").forEach(x=>{ const on=+x.dataset.s<=v; x.classList.toggle("on",on); if(on){ x.style.animation="none"; x.offsetWidth; x.style.animation=`popIn .35s ${(+x.dataset.s)*0.05}s both`; } }); el.querySelector("[data-send]").disabled=false; });
    el.querySelector("[data-send]").onclick=()=>{ S.ratings[key]={v, t:el.querySelector("#rt").value.trim()}; save(); close(); toast("Thank you for your feedback!");
      setTimeout(()=>sheet(`<h3>Come back tomorrow</h3><p>New activities unlock tomorrow if you complete your devotional for the day.</p><button class="btn" data-x>Got it!</button>`,(s,c)=>s.querySelector("[data-x]").onclick=c),900); };
  }
  if(mode==="listen" && audible()){ loadAudio(); paint(); N.play(); } else paint();
  if(!S.seen.listenTip && mode==="read"){ S.seen.listenTip=1; save(); setTimeout(()=>{ const sg=el.querySelector(".seg"); if(!sg) return; const r=sg.getBoundingClientRect(); const tp=document.createElement("div"); tp.className="tip"; tp.style.top=(r.bottom+10)+"px"; tp.style.left=Math.max(12,r.left-20)+"px"; tp.innerHTML="<b>Read or Listen</b>Tap here to choose how you want to experience today’s word"; tp.style.setProperty("--x","40px"); el.appendChild(tp); tp.querySelector; const st2=document.createElement("style"); tp.onclick=()=>tp.remove(); setTimeout(()=>tp.remove(),4200); },700); }
}

/* ---------- YOUR WALK (streak · light · tree · milestones) ---------- */
const MILESTONES=[3,7,21,40,100,365];
const MS_TEXT={3:"Three days in a row. A habit is being born.",7:"A full week walking with God!",21:"21 days — a new rhythm has taken root.",40:"40 days — like Jesus in the wilderness. Remarkable faithfulness.",100:"100 days! Your lamp has been burning for over three months.",365:"One whole year with God, day by day."};
const dayStr=d=>todayStr(d);
const addDays=(s,n)=>{ const d=new Date(s+"T12:00:00"); d.setDate(d.getDate()+n); return dayStr(d); };
const weekKey=s=>{ const d=new Date(s+"T12:00:00"); const dow=(d.getDay()+6)%7; d.setDate(d.getDate()-dow); return dayStr(d); };
function activeDays(){ return new Set(Object.values(S.completed||{})); }
function walkStats(){
  const act=activeDays(), today=todayStr(), list=[...act].sort();
  const total=act.size;
  // current streak: walk back from today (today may still be pending)
  let cur=0, d=act.has(today)?today:addDays(today,-1), rest={}, restDays=[];
  for(let guard=0;guard<4000;guard++){
    if(act.has(d)){ cur++; d=addDays(d,-1); continue; }
    const wk=weekKey(d); if(cur>0 && !rest[wk] && act.has(addDays(d,-1))){ rest[wk]=1; restDays.push(d); d=addDays(d,-1); continue; }
    break;
  }
  // best streak across history (same rules)
  let best=0;
  if(list.length){ let run=0, r={}, x=list[0];
    while(x<=today){ if(act.has(x)){ run++; } else { const wk=weekKey(x); if(run>0 && !r[wk] && act.has(addDays(x,1))){ r[wk]=1; } else { run=0; } } best=Math.max(best,run); x=addDays(x,1); } }
  best=Math.max(best,cur);
  const restLeft = rest[weekKey(today)] ? 0 : 1;
  const months = list.length ? Math.floor((new Date(today)-new Date(list[0]))/(30*864e5)) : 0;
  return {cur,best,total,doneToday:act.has(today),restDays,restLeft,months,first:list[0]};
}
const L_ = () => (S.light = S.light || {total:0, days:{}, caps:{}});
function lightToday(){ return L_().days[todayStr()]||0; }
function addLight(n, capKey, capMax){
  const L=L_(), t=todayStr();
  if(capKey){ const k=t+":"+capKey; const used=L.caps[k]||0; if(capMax!=null && used>=capMax) return 0; L.caps[k]=used+1; }
  L.total+=n; L.days[t]=(L.days[t]||0)+n; save(); lightFly(n); return n;
}
function lightFly(n){ const f=document.createElement("div"); f.className="lightfly"; f.innerHTML=`${ic("spark").replace("<svg ",'<svg style="width:14px;height:14px" ')} +${n} light`; document.body.appendChild(f); setTimeout(()=>f.remove(),1600); }
const LAMP=(lit,size=20)=>`<svg width="${size}" height="${size}" viewBox="0 0 24 24" class="lampsvg ${lit?"lit":""}"><path d="M3 15c0-2 3-3 9-3s9 1 9 3-4 3-9 3-9-1-9-3Z" fill="#C9973F"/><path d="M19 13c2-1 3 1 2 2" stroke="#C9973F" stroke-width="1.6" fill="none"/><path class="fl" d="M12 11c-2-2-1-5 0-7 1 2 3 4 1 7Z" fill="#F2B544"/></svg>`;
const TREE_STAGES=["Seed","Sprout","Sapling","Young tree","Tree","Fruitful tree"];
function treeSVG(m){ m=Math.min(5,m); const h=14+m*9;
  return `<svg viewBox="0 0 120 110" width="110"><ellipse cx="60" cy="100" rx="46" ry="7" fill="#C0DD97"/>${m===0?`<ellipse cx="60" cy="96" rx="7" ry="5" fill="#8A6A44"/>`:`<path d="M60 100V${100-h}" stroke="#854F0B" stroke-width="${3+m}" stroke-linecap="round"/><circle cx="60" cy="${96-h}" r="${8+m*5}" fill="#639922"/>${m>=3?`<circle cx="${48-m}" cy="${102-h}" r="${6+m*2}" fill="#76A93A"/><circle cx="${72+m}" cy="${102-h}" r="${6+m*2}" fill="#76A93A"/>`:""}${m>=5?`<circle cx="50" cy="${92-h}" r="3.5" fill="#E24B4A"/><circle cx="68" cy="${88-h}" r="3.5" fill="#E24B4A"/><circle cx="60" cy="${100-h}" r="3.5" fill="#E24B4A"/>`:""}`}</svg>`; }
function openWalk(){
  const st=walkStats(), lt=lightToday(), goal=100, pct=Math.min(100,Math.round(lt/goal*100));
  const today=todayStr(), wk=weekKey(today), act=activeDays();
  const days=Array.from({length:7},(_,i)=>{ const d=addDays(wk,i); const lab="MTWTFSS"[i];
    const state = act.has(d)?"done": st.restDays.includes(d)?"rest": d===today?"today": d<today?"miss":"future"; return {d,lab,state}; });
  const nextM=MILESTONES.find(m=>m>st.cur)||null;
  page("Your walk",`
    <div class="walk-hero stepin">${clouds(90,"white","opacity:.35")}<div class="wh-top"><span>${st.doneToday?"Lamp lit today":"Your lamp is waiting"}</span><span>${ic("spark").replace("<svg ",'<svg style="width:14px;height:14px" ')} ${(L_().total).toLocaleString("en-US")} light</span></div>
      <div class="walk-lamp ${st.doneToday?"lit":""}">${LAMP(st.doneToday,64)}</div>
      <div class="walk-num">${st.cur}</div><div class="walk-lbl">${st.cur===1?"day":"days"} in a row</div>
      <div class="wh-sub">${st.doneToday?"Beautiful. Come back tomorrow to keep it burning.":st.cur?"Complete today’s devotional to keep your lamp burning.":"Light your lamp today and start a new streak."}</div></div>
    <div class="wcard"><div style="display:flex;justify-content:space-between;align-items:center"><div><small>Today’s goal</small><b>${lt} / ${goal} light</b><div class="muted" style="font-size:12.5px;margin-top:2px">${pct>=100?"Goal reached — you did it!":lt?`Keep going — ${goal-lt} to go`:"You can do it — start with today’s devotional"}</div></div>
      <div class="ring" style="background:conic-gradient(var(--blue) ${pct*3.6}deg,var(--soft) 0)"><span>${pct}%</span></div></div>
      <div class="wweek">${days.map(x=>`<div class="wd wd-${x.state}"><i>${x.state==="rest"?ic("moon").replace("<svg ",'<svg style="width:13px;height:13px" '):x.lab}</i></div>`).join("")}</div>
      <div class="muted" style="font-size:12px;margin-top:8px">${ic("moon").replace("<svg ",'<svg style="width:13px;height:13px;vertical-align:-2px" ')} Sabbath rest: ${st.restLeft?"1 available this week — if you miss a day, your streak is protected.":"used this week."}</div></div>
    <div class="wgrid"><div><small>Best streak</small><b>${st.best} days</b></div><div><small>Total days with God</small><b>${st.total}</b></div><div><small>Total light</small><b>${(L_().total).toLocaleString("en-US")}</b></div><div><small>${nextM?"Next milestone":"Milestones"}</small><b>${nextM?`${nextM-st.cur} ${nextM-st.cur===1?"day":"days"} to go`:"All done!"}</b></div></div>
    <div class="wtree">${treeSVG(st.months)}<div><b>Your faith tree · ${TREE_STAGES[Math.min(5,st.months)]}</b><small>It grows a little more every month you keep walking with God.${st.months<5?` Next stage in ${30-((Date.now()-new Date((st.first||today)+"T12:00:00"))/864e5%30|0)} days.`:""}</small></div></div>
    <div class="muted" style="font-size:13px;margin:18px 0 8px">Milestones</div>
    <div class="wbadges">${MILESTONES.map(m=>`<div class="wb ${st.best>=m?"on":""}"><div class="wbi">${st.best>=m?LAMP(true,26):ic("lock").replace("<svg ",'<svg style="width:18px;height:18px" ')}</div><b>${m}</b><small>days</small></div>`).join("")}</div>
    <div class="muted" style="font-size:13px;margin:18px 0 8px">How to earn light</div>
    <div class="list" style="box-shadow:none;border:1px solid var(--line)">${[["book","Complete today’s devotional","+50"],["check","Answer a quiz question right on the first try","+10"],["journal","Write in your journal","+15"],["heart","Pray for a request (up to 5 a day)","+5"],["head","Finish a podcast episode","+20"],["bible","Read a Bible chapter","+10"],["spark","Streak bonus — every full week in a row","+5%"]].map(([i,t,p])=>`<div class="li">${ic(i)}<span style="flex:1">${t}</span><b style="color:var(--blue)">${p}</b></div>`).join("")}</div>
    <div class="wleague">${ic("star").replace("<svg ",'<svg style="width:20px;height:20px;flex:none" ')}<span><b>Weekly leagues — coming soon</b>Climb from Seed to Lighthouse with believers around the world.</span></div>`);
}
function milestoneCelebrate(n){
  const o=document.createElement("div"); o.className="overlay"; o.style.alignItems="center";
  o.innerHTML=`<div class="mscard"><div class="walk-lamp lit">${LAMP(true,72)}</div><div class="walk-num" style="font-size:48px">${n}</div><div class="walk-lbl">days in a row</div><p>${MS_TEXT[n]||"A new milestone!"}</p><button class="btn" data-sh>Share</button><button class="btn ghost" data-x style="margin-top:10px">Continue</button></div>`;
  document.body.appendChild(o); o.querySelector("[data-x]").onclick=()=>o.remove();
  o.querySelector("[data-sh]").onclick=()=>{ shareText(`🪔 ${n} days in a row walking with God on VEREDA. ${MS_TEXT[n]||""}`); };
}

/* ---------- PROFILE / HIGHLIGHTS ---------- */
function page(title, inner, onMount){
  const el=document.createElement("div"); el.className="player"; el.innerHTML=`<div class="p-top"><button class="icon-btn" data-back>${ic("back")}</button><div class="p-title">${esc(title)}</div><span style="width:36px"></span></div><div class="p-body" style="padding-top:10px">${inner}</div>`;
  document.body.appendChild(el); el.querySelector("[data-back]").onclick=()=>{ el.remove(); render(); }; onMount && onMount(el); return el;
}
function openProfile(){
  page("", `<div style="display:flex;align-items:center;gap:14px;margin:4px 0 22px"><div class="icon-btn" style="width:56px;height:56px;font-size:18px;background:var(--soft);color:var(--blue)">${initials(S.user.name)}</div><div><div style="font-size:22px;font-weight:700;color:var(--ink)">${esc(S.user.name)}</div><button class="muted" data-edit style="font-size:14px">Edit profile ✎</button></div></div>
   ${S.user.admin?`<div class="list" style="margin-bottom:16px;border:1.5px solid var(--gold)"><button class="li" data-admin>${ic("shield")}<span>Admin panel<small>Test tools for the app</small></span><span class="chev">${ic("right")}</span></button></div>`:""}
   <div class="list" style="margin-bottom:16px"><button class="li" data-hl>${ic("bookmark")}Highlights &amp; notes<span class="chev">${ic("right")}</span></button><button class="li" data-jr>${ic("journal")}My journal<span class="chev">${ic("right")}</span></button></div>
   <div class="list"><button class="li" data-set>${ic("settings")}Settings<span class="chev">${ic("right")}</span></button><a class="li" href="${CONFIG.manageSubscriptionUrl}" target="_blank">${ic("heart")}Manage subscription<span class="chev">${ic("right")}</span></a><a class="li" href="${CONFIG.privacyUrl}">${ic("shield")}Privacy Policy<span class="chev">${ic("right")}</span></a><a class="li" href="${CONFIG.termsUrl}">${ic("doc")}Terms &amp; Conditions<span class="chev">${ic("right")}</span></a><button class="li" data-faq>${ic("help")}FAQ<span class="chev">${ic("right")}</span></button><a class="li" href="mailto:${CONFIG.supportEmail}">${ic("mail")}<span>Support<small>${CONFIG.supportEmail}</small></span><span class="chev">${ic("right")}</span></a></div>`,
  el=>{
    el.querySelector("[data-hl]").onclick=openHighlights;
    const ad=el.querySelector("[data-admin]"); if(ad) ad.onclick=()=>openAdmin(el);
    el.querySelector("[data-jr]").onclick=()=>{ el.remove(); tab="journal"; render(); };
    el.querySelector("[data-edit]").onclick=()=>sheet(`<h3>Edit profile</h3><input class="field" id="pn" value="${esc(S.user.name)}"><button class="btn" data-ok style="margin-top:14px">Save</button>`,(s,c)=>s.querySelector("[data-ok]").onclick=()=>{ const v=s.querySelector("#pn").value.trim(); if(v){ S.user.name=v; save(); } c(); el.remove(); openProfile(); });
    el.querySelector("[data-faq]").onclick=()=>page("FAQ",[["How does the Journey work?","A new devotional unlocks every day. Complete today’s prayer, word, quiz and action to unlock tomorrow’s day."],["Can I skip ahead?","No — the Journey is designed to build a daily habit, one step at a time."],["Which Bible version is used?","The World English Bible (WEB), a modern English translation in the public domain."],["How do I listen instead of reading?","Tap “Listen” on any prayer or devotional. You can change the narrator and speed."],["How do I cancel?","Tap Manage subscription in your profile, or contact support."]].map(([q,a])=>`<div class="jentry"><div class="q">${q}</div><div class="a">${a}</div></div>`).join(""));
    el.querySelector("[data-set]").onclick=()=>page("Settings",`<div class="list" style="margin-bottom:16px"><div class="li">${ic("mail")}<span>Email<small>${esc(S.user.email)}</small></span></div><button class="li" data-fs>${ic("text")}Bible text size<span class="chev muted" style="font-size:14px">${S.bfs}px</span></button><button class="li" data-nr>${ic("mic")}Narrator speed<span class="chev muted" style="font-size:14px">${S.rate||1}×</span></button><button class="li" data-lang>${ic("text")}Language<span class="chev muted" style="font-size:14px">${ES?"Español":"English"}</span></button></div>
      <div class="list" style="margin-bottom:16px"><button class="li" data-tour>${ic("help")}Replay the app tour</button>${isStandalone()?"":`<button class="li" data-inst>${ic("plus")}Add VEREDA to your home screen</button>`}</div>
      <div class="list"><button class="li" data-lo>${ic("out")}Sign out</button><button class="li" data-del style="color:var(--bad)">${ic("trash")}Delete my data</button></div><p class="muted" style="text-align:center;font-size:12px;margin-top:18px">VEREDA v1.0</p>`,p=>{
        p.querySelector("[data-fs]").onclick=()=>{ const o=[17,19,21,23]; S.bfs=o[(o.indexOf(S.bfs)+1)%o.length]; save(); p.remove(); el.querySelector("[data-set]").click(); };
        p.querySelector("[data-nr]").onclick=()=>{ const r=[0.75,1,1.25,1.5]; S.rate=r[(r.indexOf(S.rate||1)+1)%r.length]; save(); p.remove(); el.querySelector("[data-set]").click(); };
        p.querySelector("[data-lang]").onclick=()=>{ S.lang=ES?"en":"es"; S.langSet=true; S.bver=undefined; save(); location.reload(); };
        p.querySelector("[data-tour]").onclick=()=>{ p.remove(); el.remove(); tab="journey"; render(); S.seen.tour=0; startTour(); };
        const pi=p.querySelector("[data-inst]"); if(pi) pi.onclick=doInstall;
        p.querySelector("[data-lo]").onclick=()=>{ p.remove(); el.remove(); signOut(); };
        p.querySelector("[data-del]").onclick=()=>sheet(`<h3>Delete all data?</h3><p>This removes your progress, journal and highlights from this device.</p><button class="btn" style="background:var(--bad)" data-y>Delete</button><button class="btn ghost" data-x style="margin-top:10px">Cancel</button>`,(s,c)=>{ s.querySelector("[data-x]").onclick=c; s.querySelector("[data-y]").onclick=()=>{ localStorage.removeItem(KEY); location.reload(); }; });
      });
  });
}

function openAdmin(prof, again){
  const shiftDays=n=>{ for(const k in S.completed){ const d=new Date(S.completed[k]+"T12:00:00"); d.setDate(d.getDate()-n); S.completed[k]=todayStr(d); } };
  const done=Object.keys(S.completed).length;
  const ratings=Object.entries(S.ratings);
  const p=page("Admin panel",`
    <div class="card" style="padding:14px;margin-bottom:16px;box-shadow:none;border:1px solid var(--line);font-size:13.5px"><b style="color:var(--ink)">Progress:</b> ${done} of ${LESSONS.length} days completed · Unlock mode: <b style="color:var(--ink)">${S.dev?"ON":"OFF"}</b></div>
    <div class="list" style="margin-bottom:16px">
      <button class="li" data-a="dev">${ic("lock")}<span>${S.dev?"Turn off":"Turn on"} unlock-all mode<small>${S.dev?"Days follow the real daily schedule when off":"Open every available day without waiting"}</small></span></button>
      <button class="li" data-a="complete">${ic("check")}<span>Complete the current day<small>Marks today’s devotional as done</small></span></button>
      <button class="li" data-a="nextday">${ic("sun")}<span>Simulate a new day<small>Moves your progress one day back so the next day unlocks</small></span></button>
      <button class="li" data-a="tips">${ic("help")}<span>Show onboarding & tips again</span></button>
      <button class="li" data-a="splash">${ic("spark")}<span>Replay the opening animation</span></button>
    </div>
    <div class="list" style="margin-bottom:16px">
      <button class="li" data-a="reset">${ic("refresh")}<span>Reset Journey progress</span></button>
      <button class="li" data-a="community">${ic("community")}<span>Clear prayer requests</span></button>
      <button class="li" data-a="journal">${ic("journal")}<span>Clear journal</span></button>
    </div>
    <h3 style="font-size:16px;color:var(--ink);margin:6px 0 10px">Devotional ratings (this device)</h3>
    ${ratings.length?ratings.map(([k,r])=>`<div class="jentry"><div class="q">${esc(LESSONS.find(l=>l.key===k)?.title||k)} · ${"★".repeat(r.v)}${"☆".repeat(5-r.v)}</div>${r.t?`<div class="a">${esc(r.t)}</div>`:""}</div>`).join(""):`<p class="muted" style="font-size:14px">No ratings yet.</p>`}
    <p class="muted" style="font-size:12px;margin-top:18px">Demo admin access. Data lives on this device until the backend is connected.</p>`,
  el=>{ if(again) el.style.animation="none"; el.querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>{
    const a=b.dataset.a;
    if(a==="dev"){ S.dev=!S.dev; toast(S.dev?"All days unlocked":"Daily schedule restored"); }
    if(a==="complete"){ const i=currentIndex(); if(i<LESSONS.length){ const k=LESSONS[i].key; S.completed[k]=todayStr(); STEPS.forEach(s=>stepsOf(k)[s.k]=true); toast(`Completed: ${LESSONS[i].title}`); } }
    if(a==="nextday"){ shiftDays(1); toast("Simulated a new day — the next devotional is open"); }
    if(a==="tips"){ S.seen={notif:1}; toast("Tips will show again"); }
    if(a==="splash"){ sessionStorage.removeItem("vsplash"); save(); el.remove(); prof.remove(); render(); splash(); return; }
    if(a==="reset"){ S.completed={}; S.steps={}; S.ratings={}; toast("Journey progress reset"); }
    if(a==="community"){ S.requests=[]; S.prayed={}; toast("Prayer requests cleared"); }
    if(a==="journal"){ S.journal=[]; toast("Journal cleared"); }
    save(); el.remove(); openAdmin(prof, true);
  }); });
}
function openHighlights(){
  const items=S.highlights.slice().reverse();
  page("Highlights & notes", items.length? items.map((h,i)=>`<div class="jentry"><div class="q">${esc(h.r)}</div><div class="a" style="font-family:var(--serif);font-size:16px">${esc(h.t)}</div><div style="display:flex;gap:8px;margin-top:10px"><button class="pill" data-c="${i}">${ic("copy").replace("<svg ",'<svg style="width:15px" ')}Copy</button><button class="pill" data-d="${i}">${ic("trash").replace("<svg ",'<svg style="width:15px" ')}Remove</button></div></div>`).join("") :
    `<div class="empty">${ic("bookmark").replace("<svg ",'<svg style="width:56px;height:56px;color:var(--blue)" ')}<b>No highlights yet</b><p class="muted">Tap any verse in the Bible to highlight it. It will appear here.</p></div>`,
  el=>{ el.querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>{ const h=items[+b.dataset.c]; copyText(`${h.t} — ${h.r}`); }); el.querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>{ const h=items[+b.dataset.d]; S.highlights=S.highlights.filter(x=>x!==h); save(); el.remove(); openHighlights(); }); });
}

/* ---------- PODCASTS ---------- */
const PODS = () => ES ? [] : (window.VEREDA_PODCASTS || []);
const podCover = (id, cls="") => {
  const art = {
   hf:`<defs><linearGradient id="pc1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FCE3C8"/><stop offset="1" stop-color="#F6C9A6"/></linearGradient></defs><rect width="200" height="200" fill="url(#pc1)"/><circle cx="100" cy="70" r="46" fill="#FFF3D9" opacity=".8"/><g fill="#fff" opacity=".9"><ellipse cx="30" cy="40" rx="26" ry="9"/><ellipse cx="170" cy="30" rx="22" ry="8"/></g><rect x="28" y="140" width="144" height="10" rx="5" fill="#B9825C"/><g><path d="M52 112h34v18a12 12 0 0 1-12 12h-10a12 12 0 0 1-12-12Z" fill="#fff"/><path d="M86 118c10 0 10 14 0 14" stroke="#fff" stroke-width="5" fill="none"/><path d="M114 112h34v18a12 12 0 0 1-12 12h-10a12 12 0 0 1-12-12Z" fill="#0E5F95"/><path d="M148 118c10 0 10 14 0 14" stroke="#0E5F95" stroke-width="5" fill="none"/></g><g stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9" fill="none"><path d="M64 104c-4-6 4-10 0-16"/><path d="M126 104c-4-6 4-10 0-16"/></g>`,
   rb:`<defs><linearGradient id="pc2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFE3F4"/><stop offset="1" stop-color="#E9F2EA"/></linearGradient></defs><rect width="200" height="200" fill="url(#pc2)"/><g fill="#fff"><ellipse cx="40" cy="44" rx="28" ry="10"/><ellipse cx="160" cy="34" rx="24" ry="9"/></g><path d="M100 40v70" stroke="#7D5A3C" stroke-width="7" stroke-linecap="round"/><circle cx="100" cy="56" r="30" fill="#6DBA78"/><circle cx="78" cy="70" r="20" fill="#5FAE6B"/><circle cx="122" cy="70" r="20" fill="#5FAE6B"/><path d="M40 128c20-8 40-8 60 0 20-8 40-8 60 0v40c-20-8-40-8-60 0-20-8-40-8-60 0Z" fill="#fff"/><path d="M100 128v40" stroke="#C9D8E6" stroke-width="3"/><path d="M100 110c-8 8-20 14-34 16M100 110c8 8 20 14 34 16M100 110v18" stroke="#7D5A3C" stroke-width="4" fill="none" stroke-linecap="round"/>`,
   sg:`<defs><linearGradient id="pc3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1E3A5F"/><stop offset="1" stop-color="#3C86BC"/></linearGradient><radialGradient id="pg3"><stop offset="0" stop-color="#FFE7A3"/><stop offset="1" stop-color="#FFE7A3" stop-opacity="0"/></radialGradient></defs><rect width="200" height="200" fill="url(#pc3)"/><g fill="#fff">${[[30,30],[60,52],[150,26],[172,64],[120,44],[40,86],[180,110]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.8"/>`).join("")}</g><circle cx="100" cy="112" r="60" fill="url(#pg3)"/><path d="M84 84h32l-4 12H88Z" fill="#C9973F"/><rect x="82" y="96" width="36" height="46" rx="6" fill="#FFF3D1" opacity=".95"/><path d="M100 104c-6 8-6 14 0 20 6-6 6-12 0-20Z" fill="#F2B544"/><rect x="80" y="140" width="40" height="8" rx="3" fill="#C9973F"/><path d="M92 84c0-12 16-12 16 0" stroke="#C9973F" stroke-width="4" fill="none"/><path d="M0 178c40-14 80-14 100-6s60 8 100-6v34H0Z" fill="#0A4A75"/>`
  }[id.slice(0,2)] || "";
  return `<svg class="${cls}" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">${art}</svg>`;
};
const fmtMin = s => `${Math.max(1,Math.round(s/60))} min`;
const PP = () => (S.pod = S.pod || {});           // progress: {epId:{t,done}}
const Player = {
  a:null, pod:null, ep:null, onup:new Set(),
  init(){ if(this.a) return; this.a=new Audio(); this.a.preload="metadata";
    ["timeupdate","play","pause","loadedmetadata","ended"].forEach(e=>this.a.addEventListener(e,()=>this.tick(e)));
    if("mediaSession" in navigator){ const ms=navigator.mediaSession;
      ms.setActionHandler("play",()=>this.play()); ms.setActionHandler("pause",()=>this.pause());
      ms.setActionHandler("seekbackward",()=>this.skip(-15)); ms.setActionHandler("seekforward",()=>this.skip(15));
      ms.setActionHandler("previoustrack",()=>this.step(-1)); ms.setActionHandler("nexttrack",()=>this.step(1)); } },
  load(pod, ep, autoplay=true){ this.init(); N.stop(); Music.stop();
    if(this.ep && this.ep.id===ep.id){ if(autoplay) this.play(); return; }
    this.save(); this.pod=pod; this.ep=ep;
    const p=PP()[ep.id]; const startAt = p && !p.done ? p.t||0 : 0;
    this.a.src=`podcasts/${ep.id}.mp3`+(startAt?`#t=${Math.floor(startAt)}`:""); this.a.playbackRate=S.podRate||1;
    if("mediaSession" in navigator) navigator.mediaSession.metadata=new MediaMetadata({title:ep.title, artist:pod.title, album:"VEREDA", artwork:[{src:"icons/icon-512.png",sizes:"512x512",type:"image/png"}]});
    if(autoplay) this.play(); this.emit(); },
  play(){ this.a.play().catch(()=>{}); }, pause(){ this.a.pause(); },
  toggle(){ this.a.paused?this.play():this.pause(); },
  skip(s){ this.a.currentTime=Math.max(0,Math.min(this.a.duration||0,this.a.currentTime+s)); },
  step(d){ const L=this.pod.episodes, i=L.findIndex(e=>e.id===this.ep.id)+d; if(i>=0&&i<L.length) this.load(this.pod,L[i]); },
  save(){ if(!this.ep||!this.a) return; const p=PP(); const cur=p[this.ep.id]||{}; p[this.ep.id]={...cur,t:this.a.currentTime||0}; save(); },
  tick(e){ if(e==="ended"){ if(!(PP()[this.ep.id]||{}).done) addLight(20,"pod-"+this.ep.id,1); PP()[this.ep.id]={t:0,done:true}; save(); const L=this.pod.episodes, i=L.findIndex(x=>x.id===this.ep.id); if(i<L.length-1){ this.load(this.pod,L[i+1]); toast(`Up next: ${L[i+1].title}`); } }
    else if(e==="timeupdate" && Math.floor(this.a.currentTime)%5===0) this.save();
    if(e==="pause") this.save(); this.emit(); },
  emit(){ this.onup.forEach(f=>{ try{f()}catch(e){} }); paintMini(); }
};
function epState(ep){ const p=PP()[ep.id]; if(p&&p.done) return "done"; if(p&&p.t>5) return "partial"; return "new"; }
function epMeta(ep, i){ const st=epState(ep), p=PP()[ep.id];
  if(st==="done") return `Ep. ${i+1} • <span style="color:var(--ok);font-weight:600">Completed ✓</span>`;
  if(st==="partial") return `Ep. ${i+1} • ${fmtMin(ep.dur-p.t)} left`;
  return `Ep. ${i+1} • ${fmtMin(ep.dur)}`; }
function paintMini(){
  let m=document.getElementById("podmini");
  if(!Player.ep || document.querySelector(".podfull")){ m&&m.remove(); return; }
  if(!m){ m=document.createElement("div"); m.id="podmini"; m.className="podmini"; document.body.appendChild(m); m.onclick=e=>{ if(e.target.closest("[data-mt]")) { Player.toggle(); return; } openPodPlayer(); }; }
  const pct=Player.a.duration?Player.a.currentTime/Player.a.duration*100:0;
  m.innerHTML=`<div class="th">${podCover(Player.pod.id)}</div><div style="flex:1;min-width:0"><b>${esc(Player.ep.title)}</b><div class="bar"><i style="width:${pct}%"></i></div></div><button data-mt>${ic(Player.a.paused?"play":"pause").replace("<svg ",'<svg style="width:22px;height:22px" ')}</button>`;
  m.classList.toggle("over-tabs", !!document.querySelector(".tabbar") && !document.querySelector(".player"));
}
function podsRow(){
  const L=PODS(); if(!L.length) return "";
  return `<div class="pad" style="display:flex;justify-content:space-between;align-items:center;margin:22px 0 10px"><div class="muted" style="font-size:14px">Audio podcasts</div><button class="link" data-allpods style="font-size:13.5px">See all</button></div>
   <div class="podrow">${L.map(p=>`<button class="podcard" data-pod="${p.id}"><div class="cv">${podCover(p.id)}</div><b>${esc(p.title)}</b><small>${p.episodes.length} episodes</small></button>`).join("")}</div>`;
}
function openAllPods(){
  page("Podcasts",`<div class="podgrid">${PODS().map(p=>`<button class="podcard" data-pod="${p.id}" style="width:auto"><div class="cv">${podCover(p.id)}</div><b>${esc(p.title)}</b><small>${p.episodes.length} episodes</small></button>`).join("")}</div>`,
   el=>el.querySelectorAll("[data-pod]").forEach(b=>b.onclick=()=>openPod(b.dataset.pod)));
}
function openPod(id){
  const pod=PODS().find(p=>p.id===id); if(!pod) return;
  const el=document.createElement("div"); el.className="player podpage";
  const nextEp=()=>pod.episodes.find(e=>epState(e)!=="done")||pod.episodes[0];
  let first=true, lastKey="";
  const paint=()=>{
    const playingHere = Player.pod&&Player.pod.id===pod.id;
    const key=(Player.ep?Player.ep.id:"")+"|"+(Player.a?Player.a.paused:"")+"|"+pod.episodes.map(e=>epState(e)).join(",");
    if(!first && key===lastKey) return; lastKey=key;
    const sc=el.querySelector(".p-body")?.scrollTop||0;
    el.innerHTML=`<div class="p-top" style="position:absolute;left:0;right:0;z-index:3"><button class="icon-btn" data-back>${ic("back")}</button><span></span><span style="width:36px"></span></div>
    <div class="p-body" style="padding-top:0"><div class="podhero">${podCover(pod.id)}</div>
      <div class="${first?"stepin":""}"><div style="display:flex;gap:6px;margin:14px 0 8px">${pod.tags.map(t=>`<span class="chip" style="height:24px;font-size:11.5px;box-shadow:none;border:1px solid var(--line)">${esc(t)}</span>`).join("")}</div>
      <h2 style="font-size:24px;color:var(--ink)">${esc(pod.title)}</h2><p class="muted" style="font-size:14px;line-height:1.5;margin:6px 0 16px">${esc(pod.desc)}</p>
      <button class="btn" data-next>${ic("play").replace("<svg ",'<svg style="width:18px;height:18px" ')} ${pod.episodes.some(e=>epState(e)!=="new")?"Play next episode":"Play first episode"}</button>
      <div class="muted" style="font-size:14px;margin:20px 0 10px">Episodes</div>
      ${pod.episodes.map((ep,i)=>{ const on=playingHere&&Player.ep.id===ep.id; return `<button class="epcard ${on?"on":""}" data-ep="${ep.id}"><div style="display:flex;gap:12px;align-items:center"><div class="th">${podCover(pod.id)}</div><div style="flex:1;text-align:left"><b>${esc(ep.title)}</b><small>${epMeta(ep,i)}</small></div><span class="pbtn">${ic(on&&!Player.a.paused?"pause":"play")}</span></div><p>${esc(ep.desc)}</p></button>`; }).join("")}
      </div></div>`;
    first=false; el.querySelector(".p-body").scrollTop=sc;
    el.querySelector("[data-back]").onclick=()=>{ el.remove(); paintMini(); };
    el.querySelector("[data-next]").onclick=()=>{ Player.load(pod,nextEp()); openPodPlayer(); };
    el.querySelectorAll("[data-ep]").forEach(b=>b.onclick=()=>{ const ep=pod.episodes.find(e=>e.id===b.dataset.ep);
      if(Player.ep&&Player.ep.id===ep.id){ Player.toggle(); } else { Player.load(pod,ep); openPodPlayer(); } });
  };
  document.body.appendChild(el); paint(); Player.onup.add(()=>{ if(el.isConnected) paint(); }); paintMini();
}
function openPodPlayer(){
  if(!Player.ep) return; document.querySelector(".podfull")?.remove();
  const el=document.createElement("div"); el.className="player podfull"; document.body.appendChild(el); paintMini();
  let dragging=false;
  const paint=()=>{ const a=Player.a, d=a.duration||Player.ep.dur, t=a.currentTime||0, pct=d?t/d*100:0, idx=Player.pod.episodes.findIndex(e=>e.id===Player.ep.id);
    el.innerHTML=`<div class="p-top"><span></span><span></span><button class="icon-btn" data-x>${ic("chev")}</button></div>
    <div class="p-body"><div class="podart">${podCover(Player.pod.id)}</div>
      <h2 style="font-size:22px;color:var(--ink);line-height:1.3;margin-top:22px">${esc(Player.ep.title)}</h2><div class="muted" style="font-size:14px;margin:4px 0 20px">${esc(Player.pod.title)} · Episode ${idx+1}</div>
      <div class="bar seek" id="seek" style="height:6px"><i style="width:${pct}%"></i><b style="left:${pct}%"></b></div>
      <div class="times"><span>${mmss(t)}</span><span>${mmss(Math.max(0,d-t))} left</span><span>${mmss(d)}</span></div>
      <div class="ctrls"><button class="sk" data-pv ${idx===0?'style="opacity:.3"':""}>${ic("prev")}</button><button class="sk" data-rw>${ic("rw")}</button><button class="play" data-pp>${ic(a.paused?"play":"pause")}</button><button class="sk" data-fw>${ic("fw")}</button><button class="sk" data-nx ${idx===Player.pod.episodes.length-1?'style="opacity:.3"':""}>${ic("next")}</button></div>
      <div class="pills"><button class="pill" data-rate>${S.podRate||1}× speed</button><button class="pill" data-list>${ic("lines").replace("<svg ",'<svg style="width:15px" ')} Episodes</button></div></div>`;
    el.querySelector("[data-x]").onclick=close;
    el.querySelector("[data-pp]").onclick=()=>Player.toggle();
    el.querySelector("[data-rw]").onclick=()=>Player.skip(-15); el.querySelector("[data-fw]").onclick=()=>Player.skip(15);
    el.querySelector("[data-pv]").onclick=()=>Player.step(-1); el.querySelector("[data-nx]").onclick=()=>Player.step(1);
    el.querySelector("[data-rate]").onclick=()=>{ const r=[0.75,1,1.25,1.5,2]; S.podRate=r[(r.indexOf(S.podRate||1)+1)%r.length]; Player.a.playbackRate=S.podRate; save(); paint(); };
    el.querySelector("[data-list]").onclick=()=>{ const id=Player.pod.id; close(); if(!document.querySelector(".podpage")) openPod(id); };
    const sk=el.querySelector("#seek"); const seekTo=x=>{ const r=sk.getBoundingClientRect(); const f=Math.min(1,Math.max(0,(x-r.left)/r.width)); Player.a.currentTime=f*(Player.a.duration||0); };
    sk.onpointerdown=e=>{ dragging=true; sk.setPointerCapture(e.pointerId); seekTo(e.clientX); }; sk.onpointermove=e=>{ if(dragging) seekTo(e.clientX); }; sk.onpointerup=()=>dragging=false;
  };
  const up=()=>{ if(!el.isConnected) return; const a=Player.a, d=a.duration||Player.ep.dur, t=a.currentTime||0, pct=d?t/d*100:0;
    const bi=el.querySelector("#seek i"); if(!bi||el.dataset.ep!==Player.ep.id){ el.dataset.ep=Player.ep.id; paint(); return; }
    bi.style.width=pct+"%"; el.querySelector("#seek b").style.left=pct+"%"; const tm=el.querySelectorAll(".times span"); tm[0].textContent=mmss(t); tm[1].textContent=mmss(Math.max(0,d-t))+" left"; tm[2].textContent=mmss(d);
    el.querySelector("[data-pp]").innerHTML=ic(a.paused?"play":"pause"); };
  function close(){ Player.onup.delete(up); el.classList.add("closing"); setTimeout(()=>{ el.remove(); paintMini(); },220); }
  el.dataset.ep=Player.ep.id; paint(); Player.onup.add(up);
}


/* ---------- SPIRITUAL ASSISTANT (AI chat) ---------- */
const CHAT_HELLO="Hi there! I’m here to walk with you — to encourage you, pray with you and help you grow in God’s Word. Need a verse, a prayer, or just someone to listen? Just ask 🙏✨";
const CHAT_CHIPS=["How can I stay faithful when life is hard?","I’m struggling to find peace in my heart","Can you pray for me?"];
const chatMd=t=>t.split(/\n{2,}/).map(p=>`<p>${md(p).replace(/\n/g,"<br>")}</p>`).join("");
function openChat(){
  document.querySelector(".chatview")?.remove();
  S.chat=S.chat||[]; let busy=false;
  const el=document.createElement("div"); el.className="chatview";
  el.innerHTML=`<div class="ch-top"><button class="icon-btn" data-back>${ic("back")}</button><div class="p-title">Spiritual Assistant</div><button class="icon-btn" data-new aria-label="New chat">${ic("newchat")}</button></div>
    <div class="ch-body"><div class="ch-list"></div></div>
    <div class="ch-foot"><div class="ch-in"><textarea rows="1" placeholder="Write your message" maxlength="1500"></textarea><button class="ch-send" aria-label="Send">${ic("send")}</button></div></div>`;
  document.body.appendChild(el);
  const list=el.querySelector(".ch-list"), body=el.querySelector(".ch-body"), ta=el.querySelector("textarea"), send=el.querySelector(".ch-send");
  const day=ts=>{ const d=new Date(ts), t=new Date(); return d.toDateString()===t.toDateString()?"Today":d.toLocaleDateString(LOC,{month:"short",day:"numeric",year:"numeric"}); };
  const bottom=()=>{ body.scrollTop=body.scrollHeight; };
  function paint(){
    const first=S.chat[0]?.ts||Date.now();
    let h=`<div class="ch-date">${day(first)}</div><div class="bub a">${chatMd(window.T?T(CHAT_HELLO):CHAT_HELLO)}</div><div class="ch-note">${S.chatMode==="ai"?"AI assistant · it can make mistakes.":"Prepared answers based on Scripture."} Not a substitute for pastoral or professional care.</div>`;
    if(!S.chat.length) h+=`<div class="ch-chips">${CHAT_CHIPS.map(c=>`<button class="chip">${esc(c)}</button>`).join("")}</div>`;
    S.chat.forEach(m=>{ h+=m.r==="u"?`<div class="bub u">${esc(m.t).replace(/\n/g,"<br>")}</div>`:`<div class="bub a${m.err?" err":""}">${chatMd(m.t)}${m.err?`<button class="ch-retry">Try again</button>`:""}</div>`; });
    list.innerHTML=h;
    list.querySelectorAll(".chip").forEach(b=>b.onclick=()=>ask(b.textContent));
    const rt=list.querySelector(".ch-retry"); if(rt) rt.onclick=()=>{ S.chat=S.chat.filter(m=>!m.err); const last=S.chat.pop(); save(); if(last&&last.r==="u") ask(last.t); else paint(); };
    bottom();
  }
  async function token(){ if(!sbc) return null; const {data}=await sbc.auth.getSession(); return data?.session?.access_token||null; }
  async function ask(text){
    text=(text||"").trim(); if(!text||busy) return; busy=true; send.disabled=true;
    S.chat.push({r:"u",t:text,ts:Date.now()}); save(); ta.value=""; ta.style.height=""; paint();
    const b=document.createElement("div"); b.className="bub a typing"; b.innerHTML="<i></i><i></i><i></i>"; list.appendChild(b); bottom();
    let out="", failMsg="Sorry — I couldn’t answer right now. Please check your connection and try again.";
    try{
      const tk=await token(); if(!tk){ failMsg="Please sign out and sign in again to use the assistant."; throw new Error("auth"); }
      const r=await fetch(`${SB_URL}/functions/v1/spiritual-chat`,{method:"POST",headers:{"Content-Type":"application/json","apikey":SB_KEY,"Authorization":`Bearer ${tk}`},
        body:JSON.stringify({lang:ES?"es":"en",messages:S.chat.filter(m=>!m.err).slice(-20).map(m=>({role:m.r==="u"?"user":"assistant",content:m.t}))})});
      if(!r.ok){ const j=await r.json().catch(()=>({})); if(j.error) failMsg=j.error; throw new Error("http"); }
      { const md=r.headers.get("x-chat-mode"); if(md&&md!==S.chatMode){ S.chatMode=md; save(); } }
      const rd=r.body.getReader(), dec=new TextDecoder();
      while(true){ const {value,done}=await rd.read(); if(done) break; out+=dec.decode(value,{stream:true});
        if(out.includes("\u0000ERR")) throw new Error("llm");
        b.classList.remove("typing"); b.innerHTML=chatMd(out); bottom(); }
      if(!out.trim()) throw new Error("empty");
      S.chat.push({r:"a",t:out.trim(),ts:Date.now()});
    }catch(e){ S.chat.push({r:"a",t:(window.T?T(failMsg):failMsg),ts:Date.now(),err:true}); }
    save(); busy=false; send.disabled=false; paint();
  }
  ta.oninput=()=>{ ta.style.height="auto"; ta.style.height=Math.min(ta.scrollHeight,120)+"px"; };
  ta.onkeydown=e=>{ if(e.key==="Enter"&&!e.shiftKey&&!matchMedia("(pointer:coarse)").matches){ e.preventDefault(); ask(ta.value); } };
  send.onclick=()=>ask(ta.value);
  el.querySelector("[data-back]").onclick=()=>{ el.remove(); render(); };
  el.querySelector("[data-new]").onclick=()=>{ if(busy) return; sheet(`<h3>Start a new chat?</h3><p style="font-size:14.5px">Restarting will clear all previous messages in this conversation.</p><div style="display:flex;gap:10px;margin-top:16px"><button class="btn ghost" data-x style="flex:1">Not yet</button><button class="btn" data-ok style="flex:1;background:var(--red,#C0392B)">Restart chat</button></div>`,(sh,close)=>{ sh.querySelector("[data-x]").onclick=close; sh.querySelector("[data-ok]").onclick=()=>{ S.chat=[]; save(); close(); paint(); }; }); };
  if(window.visualViewport){ const fit=()=>{ el.style.height=visualViewport.height+"px"; bottom(); }; visualViewport.addEventListener("resize",fit); fit(); }
  paint();
}
/* ---------- EXPLORE ---------- */
function verseOfDay(offset=0){ const d=new Date(); d.setDate(d.getDate()-offset); const n=Math.floor(d/864e5); return {...C.verses[n%C.verses.length], d}; }
const STORY_BG=["linear-gradient(160deg,#0E5F95,#3C86BC 60%,#C9973F)","linear-gradient(160deg,#1E3A5F,#0E5F95 60%,#7FB6E0)","linear-gradient(160deg,#4A3F6B,#7A6BA8 60%,#E3B8A0)","linear-gradient(160deg,#21503F,#3F8A6B 60%,#D9C27F)","linear-gradient(160deg,#5B2E48,#9A4F6E 60%,#F0B37E)","linear-gradient(160deg,#16324F,#2C5D8F 55%,#9CC4E4)","linear-gradient(160deg,#3B3024,#8A6A44 60%,#E8D3A8)"];
function viewExplore(){
  const st=Array.from({length:7},(_,i)=>verseOfDay(i));
  return `<div class="screen"><div class="safe-top"></div><div class="pad"><h1 style="margin-bottom:14px">Explore</h1><div class="muted" style="font-size:14px;margin-bottom:8px">Verses of the day</div></div>
   <div class="stories">${st.map((v,i)=>`<button class="story" data-st="${i}"><div style="background:${STORY_BG[i%7]}">${esc(v.r)}</div></button>`).join("")}</div>
   <div class="pad" style="margin:22px 0 8px"><div class="muted" style="font-size:14px">Spiritual assistant</div></div>
   <div class="aicard"><div class="ai-art">${clouds(120,"white","opacity:.9")}<span class="ai-orb">${ic("hands")}</span></div><p>Get guidance, daily inspiration and go deeper into God’s Word — anytime you need it.</p><button class="btn white" data-chat>${(S.chat&&S.chat.length)?"Continue chat":"Start a chat"}</button></div>
   ${podsRow()}
   <div class="pad" style="margin:22px 0 10px"><div class="muted" style="font-size:14px">Coming soon</div></div>
   <div class="soon"><div class="i">${ic("doc")}</div><div><b>Articles <span class="badge">Soon</span></b><span class="muted" style="font-size:13.5px">Quick reads on faith, prayer and everyday life</span></div></div>
   <div class="soon"><div class="i">${ic("book")}</div><div><b>Bible stories <span class="badge">Soon</span></b><span class="muted" style="font-size:13.5px">The great stories of Scripture, told simply</span></div></div></div>`;
}
afterRender.explore=()=>{ const ch=document.querySelector("[data-chat]"); if(ch) ch.onclick=openChat; document.querySelectorAll("[data-st]").forEach(b=>b.onclick=()=>openStory(+b.dataset.st)); document.querySelectorAll("[data-pod]").forEach(b=>b.onclick=()=>openPod(b.dataset.pod)); const a=document.querySelector("[data-allpods]"); if(a) a.onclick=openAllPods; };
function openStory(i){
  document.querySelector(".storyview")?.remove();
  const v=verseOfDay(i); const el=document.createElement("div"); el.className="storyview"; el.style.background=STORY_BG[i%7];
  el.innerHTML=`${clouds(220,"white")}<div class="story-bars">${Array.from({length:7},(_,k)=>`<i class="${k<i?"done":k===i?"run":""}"><b></b></i>`).join("")}</div><div style="position:absolute;top:calc(env(safe-area-inset-top) + 22px);left:16px;right:16px;display:flex;justify-content:space-between;align-items:center;z-index:2"><span style="font-size:13px;opacity:.85">${v.d.toLocaleDateString(LOC,{month:"short",day:"numeric"})}</span><button data-x style="color:#fff">${ic("x").replace("<svg ",'<svg style="width:26px;height:26px" ')}</button></div>
    <div class="brand st1">VEREDA</div><q class="st2">${esc(v.t)}</q><div class="st3" style="opacity:.8">${esc(v.r)}</div>
    <div style="position:absolute;left:24px;right:24px;bottom:calc(30px + env(safe-area-inset-bottom));z-index:2" class="st4"><button class="btn white" data-sh>Share the wisdom</button><button data-cp style="color:#fff;font-weight:600;margin-top:16px;width:100%">Copy verse</button></div>`;
  document.body.appendChild(el);
  const go=n=>{ clearTimeout(tm); if(n>=0&&n<7) openStory(n); else el.remove(); };
  let tm=setTimeout(()=>go(i+1),7000);
  el.querySelector("[data-x]").onclick=()=>{ clearTimeout(tm); el.remove(); };
  el.querySelector("[data-sh]").onclick=()=>{ clearTimeout(tm); shareText(`“${v.t}” — ${v.r}\n\nshared from VEREDA`); };
  el.querySelector("[data-cp]").onclick=()=>{ clearTimeout(tm); copyText(`${v.t} — ${v.r}`); };
  el.addEventListener("click",e=>{ if(e.target.closest("button")) return; go(e.clientX<innerWidth/3?i-1:i+1); });
  let x0=null; el.addEventListener("touchstart",e=>x0=e.touches[0].clientX,{passive:true}); el.addEventListener("touchend",e=>{ if(x0===null) return; const dx=e.changedTouches[0].clientX-x0; if(Math.abs(dx)>50) go(i+(dx<0?1:-1)); x0=null; });
}

/* ---------- JOURNAL ---------- */
const EXTRA_PROMPTS=["Which verse is hard for you to live out — and why?","What does an ‘abundant life’ mean to you beyond your circumstances?","Where did you see God’s faithfulness this week?","What would change today if you truly believed you are fully known by God?","What is one thing you want to surrender to God tonight?","Who has God placed in your life to love better?","What promise of God do you need to hold on to this week?","When did you feel closest to God recently?","What habit is helping your faith grow — and which one is getting in the way?","What would you say to God right now if no one else could hear?"];
const ALL_PROMPTS=()=>[...C.prompts,...EXTRA_PROMPTS];
function todaysPrompt(){
  const ci=currentIndex(); const last = ci>0?LESSONS[ci-1]:null; const T=todayLesson();
  const L = T.done ? T.L : (last && S.completed[last.key]===todayStr() ? last : T.L);
  return C.lessons[L.key]?.journal || C.prompts[new Date().getDate()%C.prompts.length];
}
function viewJournal(){
  const groups={}; S.journal.slice().sort((a,b)=>b.ts-a.ts).forEach(j=>(groups[j.date]=groups[j.date]||[]).push(j));
  const body = Object.keys(groups).length ? Object.entries(groups).map(([d,arr])=>`<div class="muted" style="font-size:12.5px;margin:16px 0 8px">${fmtDate(d)}</div>${arr.map(j=>`<div class="jentry" data-jv="${j.id}"><div class="q">${esc(j.q)}</div><div class="a" style="display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden">${esc(j.a)}</div><button data-jm="${j.id}" style="position:absolute;right:8px;top:8px;width:34px;height:34px;color:var(--muted);display:grid;place-items:center">${ic("dots").replace("<svg ",'<svg style="width:20px" ')}</button></div>`).join("")}`).join("")
    : `<div class="empty"><svg class="floaty-ico" viewBox="0 0 140 110" width="150"><g fill="#fff"><circle cx="50" cy="62" r="22"/><circle cx="76" cy="50" r="28"/><circle cx="102" cy="64" r="20"/><rect x="30" y="62" width="92" height="22" rx="11"/></g><g opacity=".5" fill="#CFE3F4"><circle cx="50" cy="66" r="16"/><circle cx="96" cy="68" r="14"/></g><rect x="56" y="30" width="40" height="50" rx="6" fill="var(--card)" stroke="var(--blue)" stroke-width="3" transform="rotate(-8 76 55)"/><path d="M64 46h22M63 55h22M62 64h14" stroke="var(--blue)" stroke-width="3" stroke-linecap="round" transform="rotate(-8 76 55)"/></svg><b>Your reflections will appear here</b><p class="muted">Write a few lines each day and see how far God has brought you.</p></div>`;
  return `<div class="screen"><div class="safe-top"></div><div class="pad" style="padding-bottom:90px"><h1>Journal</h1>${body}</div>
    <div style="position:fixed;left:50%;transform:translateX(-50%);width:calc(100% - 32px);max-width:448px;bottom:calc(var(--tab-h) + 22px + env(safe-area-inset-bottom));z-index:30"><button class="btn" id="wr">${ic("edit").replace("<svg ",'<svg style="width:20px;height:20px" ')} Write a reflection</button></div></div>`;
}
function actionMenu(items){ // centered iOS-style menu
  const o=document.createElement("div"); o.className="overlay"; o.style.alignItems="center";
  o.innerHTML=`<div class="amenu">${items.map((it,i)=>`<button data-i="${i}" style="${it.danger?"color:var(--bad)":""}">${esc(it.label)}</button>`).join("")}<button data-i="x">Cancel</button></div>`;
  o.onclick=e=>{ const b=e.target.closest("[data-i]"); if(e.target===o || (b&&b.dataset.i==="x")){ o.remove(); return; } if(b){ o.remove(); items[+b.dataset.i].fn(); } };
  document.body.appendChild(o);
}
afterRender.journal=()=>{
  document.getElementById("wr").onclick=()=>openJournalEditor(todaysPrompt(), true);
  document.querySelectorAll("[data-jv]").forEach(c=>c.onclick=e=>{ if(e.target.closest("[data-jm]")) return; viewEntry(S.journal.find(x=>x.id===c.dataset.jv)); });
  document.querySelectorAll("[data-jm]").forEach(b=>b.onclick=()=>{ const j=S.journal.find(x=>x.id===b.dataset.jm);
    actionMenu([{label:"View",fn:()=>viewEntry(j)},{label:"Edit",fn:()=>openJournalEditor(j.q,false,j)},{label:"Delete",danger:true,fn:()=>{ S.journal=S.journal.filter(x=>x!==j); save(); render(); toast("Your journal entry was deleted"); }}]); });
  if(!S.seen.journal) journalOnboarding();
};
function viewEntry(j){
  const el=document.createElement("div"); el.className="player";
  el.innerHTML=`<div class="p-top"><button class="icon-btn" data-back>${ic("back")}</button><span></span><button class="link" data-ed>Edit</button></div><div class="p-body"><div class="stepin"><div class="muted" style="font-size:12.5px">${fmtDate(j.date)}</div><h2 style="font-size:22px;color:var(--ink);line-height:1.35;margin:10px 0 14px">${esc(j.q)}</h2><div style="font-size:17px;line-height:1.6;white-space:pre-wrap">${esc(j.a)}</div></div></div>`;
  document.body.appendChild(el);
  el.querySelector("[data-back]").onclick=()=>el.remove();
  el.querySelector("[data-ed]").onclick=()=>{ el.remove(); openJournalEditor(j.q,false,j); };
}
function journalOnboarding(){
  const slides=[["Record your walk with God","Where did I notice God’s presence today?","What does an abundant life in Christ look like for me?","linear-gradient(170deg,#0E5F95,#2B6F8F 50%,#7A6A4F)"],["Find peace through reflection","Each day, release your worries, notice your blessings and grow in trust.","What worry do you need to lay down today?","linear-gradient(170deg,#1E3A5F,#3C86BC 55%,#C9973F)"],["And see how far God has brought you","What small step can you take toward your calling?","How can you glorify God with your plans for tomorrow?","linear-gradient(170deg,#21503F,#0E5F95 60%,#E3B8A0)"]];
  let i=0; const el=document.createElement("div"); el.className="onb"; document.body.appendChild(el);
  const paint=()=>{ const s=slides[i]; el.style.background=s[3]; el.innerHTML=`${clouds(200,"white","opacity:.35")}<div class="bars" style="position:relative">${slides.map((_,k)=>`<i class="${k<=i?"on":""}"></i>`).join("")}</div><h2 class="st1" style="position:relative">${s[0]}</h2>${i===1?`<p class="st2" style="position:relative">${s[1]}</p>`:""}<div style="flex:1;position:relative">${i===1?"":`<div class="floaty st2" style="transform:rotate(-4deg);margin-left:auto">${s[1]}</div>`}<div class="floaty st3" style="transform:rotate(3deg)">${s[2]}</div></div><button class="btn white" style="position:relative">${i<2?"Continue":"Start journaling"}</button>`;
    el.querySelector("button").onclick=()=>{ if(i<2){ i++; paint(); } else { S.seen.journal=1; save(); el.remove(); } }; };
  paint();
}
function openJournalEditor(q, isNew, entry){
  let prompt=q; const el=document.createElement("div"); el.className="player";
  const paint=(keep="")=>{ const isToday=prompt===todaysPrompt();
    el.innerHTML=`<div class="p-top"><button class="icon-btn" data-back>${ic("back")}</button><span></span><button class="icon-btn" data-list title="More questions">${ic("spark")}</button></div>
    <div class="p-body"><div class="stepin"><span class="chip" style="background:${isToday?"var(--blue)":"var(--card2)"};color:${isToday?"#fff":"var(--ink)"};height:26px;font-size:12px">${ic("spark").replace("<svg ",'<svg style="width:13px" ')} ${isToday?"Your daily reflection":"A question to help you grow"}</span>
    <div style="display:flex;gap:10px;align-items:flex-start;margin:14px 0 12px"><h2 style="flex:1;font-size:21px;color:var(--ink);line-height:1.35">${esc(prompt)}</h2><button data-new style="color:var(--blue);padding-top:4px">${ic("refresh").replace("<svg ",'<svg style="width:20px;height:20px" ')}</button></div>
    <textarea class="field" id="ja" placeholder="Feel free to go into detail…" style="background:transparent;border:0;padding:0;min-height:40vh;font-size:17px">${esc(keep||entry?.a||"")}</textarea></div></div>
    <div class="p-foot"><button class="btn" data-ok ${(keep||entry?.a)?"":"disabled"}>Done</button></div>`;
    const ta=el.querySelector("#ja"), ok=el.querySelector("[data-ok]"); ta.oninput=()=>ok.disabled=!ta.value.trim(); setTimeout(()=>ta.focus(),250);
    el.querySelector("[data-back]").onclick=()=>{ el.remove(); render(); };
    el.querySelector("[data-new]").onclick=()=>{ const ps=ALL_PROMPTS().filter(p=>p!==prompt); prompt=ps[Math.floor(Math.random()*ps.length)]; paint(ta.value); };
    el.querySelector("[data-list]").onclick=()=>sheet(`<h3 style="text-align:left">More questions</h3><p style="text-align:left;font-size:14px" class="muted">Choose the one that speaks to you today.</p>${[todaysPrompt(),...ALL_PROMPTS()].filter((p,i,a)=>a.indexOf(p)===i).map(p=>`<button class="opt ${p===prompt?"ok":""}" data-p="${esc(p)}">${esc(p)}</button>`).join("")}`,(s,c)=>s.querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>{ prompt=b.dataset.p; c(); paint(ta.value); }));
    ok.onclick=()=>{ const a=ta.value.trim(); if(entry){ entry.a=a; entry.q=prompt; } else { S.journal.push({id:uid(), date:todayStr(), ts:Date.now(), q:prompt, a}); addLight(15,"journal",1); } save(); el.remove(); tab="journal"; render(); toast("Your journal was updated"); };
  };
  document.body.appendChild(el); paint();
  if(!S.seen.newQ){ S.seen.newQ=1; save(); setTimeout(()=>{ const b=el.querySelector("[data-list]"); if(!b) return; const r=b.getBoundingClientRect(); const tp=document.createElement("div"); tp.className="tip"; tp.style.top=(r.bottom+10)+"px"; tp.style.right="12px"; tp.innerHTML="<b>More questions</b>Tap here to explore a list of suggestions and pick the one that inspires you today."; tp.onclick=()=>tp.remove(); el.appendChild(tp); setTimeout(()=>tp.remove(),5000); },600); }
}

/* ---------- COMMUNITY ---------- */
let comTab="all";
const WEEK=7*864e5;
const activeReqs=()=>S.requests.filter(r=>Date.now()-r.ts<WEEK);
function avStack(r){ const ps=(r.prayedBy||[]).slice(-3); return ps.length?`<span class="avs">${ps.map(p=>`<i>${esc(p)}</i>`).join("")}</span>`:""; }
function reqCard(r,i){
  return `<button class="req ${r.mine?"mine":""}" data-rq="${r.id}" style="animation-delay:${Math.min(i,8)*0.05}s">${puff("68%","-8px",110,12,.55,i*2)}<div class="t">${esc(r.text)}</div><div class="m"><span class="av">${esc(initials(r.mine?S.user.name:r.name))}</span>${r.mine?"Your request":esc(r.name)}<span class="cnt">${avStack(r)}${r.prayers?`<b>${r.prayers}</b>`:""}</span></div></button>`;
}
function viewCommunity(){
  const all=activeReqs(); const list = comTab==="all" ? all : all.filter(r=>r.mine);
  const cards = list.slice().sort((a,b)=>b.ts-a.ts).map(reqCard).join("");
  const empty = comTab==="all"
    ? `<div class="empty"><svg class="floaty-ico" viewBox="0 0 140 110" width="160">${handsArt(false)}</svg><b>This space is waiting for prayer</b><p class="muted">When a prayer request is shared, it will appear here. Share what is on your heart and let others lift you up.</p></div>`
    : `<div class="empty"><svg class="floaty-ico" viewBox="0 0 140 110" width="160">${handsArt(false)}</svg><b>Your prayer requests will appear here</b><p class="muted">When something is on your heart, you can share it. The VEREDA community will be with you in prayer.</p></div>`;
  return `<div class="screen"><div class="safe-top"></div><div class="pad"><h1>Community</h1>
    <div style="display:flex;align-items:center;gap:8px;margin:14px 0 16px"><button class="chip ${comTab==="all"?"dark":""}" data-ct="all">All</button><button class="chip ${comTab==="mine"?"dark":""}" data-ct="mine">Your requests</button>${all.length?`<button class="link" id="pall" style="margin-left:auto;font-size:14px">Pray for all</button>`:""}</div>
    <div class="stagger">${cards||empty}</div></div><button class="fab" id="newrq">${ic("plus")}</button></div>`;
}
function handsArt(rays=true){
  return `${rays?`<g class="rays-g" opacity=".9">${Array.from({length:16},(_,i)=>`<rect x="68" y="-6" width="4" height="34" rx="2" fill="#F2C35B" transform="rotate(${i*22.5} 70 58)"/>`).join("")}</g>`:`<g fill="#fff"><circle cx="44" cy="80" r="18"/><circle cx="70" cy="70" r="24"/><circle cx="98" cy="82" r="17"/><rect x="26" y="80" width="90" height="20" rx="10"/></g>`}
    <path d="M70 18c-6 16-16 26-20 44-2 9 2 18 10 20l10 2Z" fill="#F4CDB6"/><path d="M70 18c6 16 16 26 20 44 2 9-2 18-10 20l-10 2Z" fill="#EBB79C"/><path d="M48 80l22 4 22-4 6 22H42Z" fill="#3C86BC"/><path d="M42 102h56" stroke="#0E5F95" stroke-width="4" stroke-linecap="round"/>`;
}
afterRender.community=()=>{
  document.querySelectorAll("[data-ct]").forEach(b=>b.onclick=()=>{ comTab=b.dataset.ct; render(); });
  const list=()=>{ const all=activeReqs(); return (comTab==="all"?all:all.filter(r=>r.mine)).slice().sort((a,b)=>b.ts-a.ts); };
  document.querySelectorAll("[data-rq]").forEach(b=>b.onclick=()=>{ const L=list(); const r=L.find(x=>x.id===b.dataset.rq); if(r.mine && comTab==="mine") openMyRequest(r); else openPray(L, L.indexOf(r)); });
  const pa=document.getElementById("pall"); if(pa) pa.onclick=()=>openPray(null);
  document.getElementById("newrq").onclick=newRequest;
  if(!S.seen.community){ S.seen.community=1; save(); sheet(`<svg viewBox="0 0 200 110" style="width:100%;border-radius:16px;background:linear-gradient(160deg,#CFE3F4,#E6D7F3)"><g transform="translate(30 0)">${handsArt(false)}</g></svg><h3 style="margin-top:14px">Introducing prayer requests!</h3><p>Share what’s on your heart and pray for others. Faith grows stronger when we carry each other.</p><button class="btn" data-x>Explore community</button>`,(s,c)=>s.querySelector("[data-x]").onclick=c); }
};
function newRequest(){
  const el=document.createElement("div"); el.className="player";
  el.innerHTML=`<div class="p-top"><button class="icon-btn" data-back>${ic("back")}</button><span></span><button class="icon-btn" data-info>${ic("help")}</button></div>
    <div class="p-body"><div class="stepin"><h2 style="font-size:22px;color:var(--ink)">How can we pray for you today?</h2><textarea class="field" id="rq" maxlength="400" placeholder="Feel free to go into detail…" style="background:transparent;border:0;padding:0;min-height:30vh;font-size:17px;margin-top:12px"></textarea><div class="muted" id="cc" style="font-size:12.5px">0/400 characters</div>
    <label style="display:flex;align-items:center;gap:10px;margin:16px 0;font-size:14px"><input type="checkbox" id="anon" style="width:18px;height:18px"> Post anonymously</label></div></div>
    <div class="p-foot"><div class="muted" style="text-align:center;font-size:12.5px;margin-bottom:10px">${ic("bell").replace("<svg ",'<svg style="width:14px;height:14px;vertical-align:-2px" ')} Your request will expire in 7 days</div><button class="btn" data-pub disabled>Publish</button></div>`;
  document.body.appendChild(el);
  const t=el.querySelector("#rq"), pub=el.querySelector("[data-pub]"); setTimeout(()=>t.focus(),250);
  t.oninput=()=>{ el.querySelector("#cc").textContent=`${t.value.length}/400 characters`; pub.disabled=t.value.trim().length<3; };
  el.querySelector("[data-back]").onclick=()=>el.remove();
  el.querySelector("[data-info]").onclick=()=>sheet(`<h3>About prayer requests</h3><p>Share only what you’re comfortable sharing. Requests stay visible for 7 days, and you can delete yours at any time.</p><button class="btn" data-x>Got it</button>`,(s,c)=>s.querySelector("[data-x]").onclick=c);
  pub.onclick=()=>{ pub.innerHTML='<span class="spin"></span>'; setTimeout(()=>{ const r={id:uid(), text:t.value.trim(), name:el.querySelector("#anon").checked?"Anonymous":S.user.name, ts:Date.now(), prayers:0, prayedBy:[], mine:true}; S.requests.push(r); save(); el.remove(); comTab="mine"; render(); openMyRequest(r,true); },600); };
}
function openMyRequest(r, fresh){
  const el=document.createElement("div"); el.className="player mine-screen";
  el.innerHTML=`${clouds(200,"white","opacity:.45")}<div class="p-top" style="position:relative;z-index:2"><button class="icon-btn" data-back>${ic("back")}</button><div class="p-title">Your request</div><button class="icon-btn" data-del>${ic("trash")}</button></div>
    <div class="p-body" style="position:relative;z-index:1;text-align:center;padding-top:30px"><div class="pray-text st1" style="text-align:center">${esc(r.text)}</div>
    <svg class="floaty-ico" viewBox="0 0 140 120" width="210" style="margin-top:26px">${handsArt(true)}</svg>
    <div class="muted st2" style="margin-top:10px">${r.prayers?`${r.prayers} ${r.prayers===1?"person has":"people have"} prayed for you`:"Your request is live for 7 days"}</div></div>
    <div class="p-foot" style="background:none"><button class="btn" data-ask>Ask loved ones to pray for you</button></div>`;
  document.body.appendChild(el);
  if(fresh) toast("Your prayer request is active");
  el.querySelector("[data-back]").onclick=()=>{ el.remove(); render(); };
  el.querySelector("[data-del]").onclick=()=>sheet(`<h3>Delete this request?</h3><p>It will be removed from the community.</p><button class="btn" style="background:var(--bad)" data-y>Delete</button><button class="btn ghost" data-x style="margin-top:10px">Cancel</button>`,(s,c)=>{ s.querySelector("[data-x]").onclick=c; s.querySelector("[data-y]").onclick=()=>{ S.requests=S.requests.filter(x=>x!==r); save(); c(); el.remove(); render(); toast("Your request was deleted"); }; });
  el.querySelector("[data-ask]").onclick=()=>shareRequest(r);
}
async function requestCard(r){
  const W=1080,H=1350,cv=document.createElement("canvas"); cv.width=W; cv.height=H; const x=cv.getContext("2d");
  const g=x.createLinearGradient(0,0,0,H); g.addColorStop(0,"#0E5F95"); g.addColorStop(.55,"#3C86BC"); g.addColorStop(1,"#CFE3F4"); x.fillStyle=g; x.fillRect(0,0,W,H);
  x.fillStyle="rgba(255,255,255,.9)"; [[160,1180,140],[380,1150,190],[640,1190,160],[880,1160,190],[1040,1210,120]].forEach(([cx,cy,rr])=>{ x.beginPath(); x.arc(cx,cy,rr,0,7); x.fill(); }); x.fillRect(0,1200,W,150);
  x.fillStyle="#fff"; x.textAlign="center"; x.font="800 54px 'Plus Jakarta Sans',sans-serif"; x.fillText("V E R E D A",W/2,170);
  x.font="600 40px 'Plus Jakarta Sans',sans-serif"; x.globalAlpha=.85; x.fillText("Please pray with me",W/2,260); x.globalAlpha=1;
  x.font="500 62px Lora, Georgia, serif"; const words=r.text.split(/\s+/); let line="",y=420; const lines=[];
  words.forEach(w=>{ const t=line?line+" "+w:w; if(x.measureText(t).width>860){ lines.push(line); line=w; } else line=t; }); lines.push(line);
  lines.slice(0,9).forEach((l,i)=>x.fillText(l+(i===8&&lines.length>9?"…":""),W/2,y+i*84));
  x.fillStyle="#0E5F95"; x.font="700 38px 'Plus Jakarta Sans',sans-serif"; x.fillText("You don’t have to carry the weight alone",W/2,1290);
  return new Promise(res=>cv.toBlob(res,"image/png"));
}
function shareRequest(r){
  sheet(`<h3>You don’t have to carry the weight alone</h3><div id="pv" style="border-radius:16px;overflow:hidden;margin:6px auto 16px;width:200px;aspect-ratio:4/5;background:var(--soft)"></div><button class="btn" data-sh>Share</button>`,async(s,c)=>{
    const blob=await requestCard(r); const url=URL.createObjectURL(blob); s.querySelector("#pv").innerHTML=`<img src="${url}" style="width:100%;height:100%;object-fit:cover">`;
    s.querySelector("[data-sh]").onclick=async()=>{ const file=new File([blob],"vereda-prayer.png",{type:"image/png"}); const text=`Please pray with me: “${r.text}” 🙏`;
      if(navigator.canShare && navigator.canShare({files:[file]})){ try{ await navigator.share({files:[file],text}); }catch(e){} }
      else if(navigator.share){ try{ await navigator.share({text}); }catch(e){} }
      else { const a=document.createElement("a"); a.href=url; a.download="vereda-prayer.png"; a.click(); toast("Image saved — share it with someone you love"); } c(); };
  });
}
function openPray(list, start=0){
  const all = !list; let i=start;
  const el=document.createElement("div"); el.className="player pray-screen"; document.body.appendChild(el);
  let mt=null, p0=0;
  const stopM=()=>{ Music.stop(); clearInterval(mt); };
  const paint=(dir=0)=>{
    const r = all? null : list[i]; const total = all? activeReqs().length : (r.prayers||0);
    const prayed = all ? !!S.prayedAllDay && S.prayedAllDay===todayStr() : !!S.prayed[r.id];
    const text = all ? "Lord, we place all of these prayer requests in your hands. Bring peace, healing and guidance to every heart. May each person feel your presence and care today. Amen." : r.text;
    const chip = all ? (prayed?`Prayed for ${total} ${total===1?"heart":"hearts"}`:`Praying for ${total} ${total===1?"heart":"hearts"}`) : `${avStack(r)}${total} ${total===1?"person":"people"} prayed`;
    el.innerHTML=`${clouds(230,"white","opacity:.8")}<div class="p-top" style="position:relative;z-index:2"><button class="icon-btn" data-back>${ic("back")}</button><div class="p-title">Prayer requests</div><span class="muted" style="width:36px;text-align:right;font-size:13px">${all?total:`${i+1}/${list.length}`}</span></div>
      <div class="p-body" style="padding-top:24px;position:relative;z-index:1"><div class="${dir?"stepin":""}"><div style="text-align:center"><span class="chip" id="pc">${chip}</span></div>
      <div class="pray-text" style="margin-top:24px">${esc(text)}</div>${r&&!r.mine?`<div class="muted" style="padding:0 8px;font-size:14px">— ${esc(r.name)}</div>`:""}</div></div>
      <div class="p-foot" style="background:none"><div class="card" style="display:flex;align-items:center;gap:12px;padding:12px 14px;margin-bottom:12px"><div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#E6D7F3,#CFE3F4);display:grid;place-items:center;color:var(--blue)">${ic("music").replace("<svg ",'<svg style="width:18px" ')}</div><div style="flex:1;font-weight:600;font-size:14px;color:var(--ink)">Soft music for prayer<div class="bar" style="height:3px;margin-top:8px"><i id="mb" style="width:${p0}%"></i></div></div><button data-mu style="color:var(--ink)">${ic(Music.on?"pause":"play").replace("<svg ",'<svg style="width:22px;height:22px" ')}</button></div>
      <button class="btn" data-amen ${prayed?"disabled":""}>${prayed?"You prayed ✓":"Amen"}</button></div>`;
    el.querySelector("[data-back]").onclick=()=>{ stopM(); el.remove(); render(); };
    const mu=el.querySelector("[data-mu]");
    mu.onclick=()=>{ if(Music.on){ stopM(); paint(); } else { Music.start(); mt=setInterval(()=>{ p0=(p0+0.4)%100; const b=el.querySelector("#mb"); if(b) b.style.width=p0+"%"; },300); paint(); } };
    el.querySelector("[data-amen]").onclick=()=>{
      navigator.vibrate&&navigator.vibrate([10,40,20]);
      const h=document.createElement("div"); h.className="hands"; h.innerHTML=`<svg viewBox="-10 -20 160 150" width="230">${handsArt(true)}</svg>`; el.appendChild(h);
      const me=initials(S.user.name);
      if(all){ activeReqs().forEach(x=>{ if(!S.prayed[x.id]){ x.prayers=(x.prayers||0)+1; (x.prayedBy=x.prayedBy||[]).push(me); S.prayed[x.id]=1; } }); S.prayedAllDay=todayStr(); }
      else { r.prayers=(r.prayers||0)+1; (r.prayedBy=r.prayedBy||[]).push(me); S.prayed[r.id]=1; }
      addLight(5,"amen",5);
      save(); el.querySelector("[data-amen]").disabled=true;
      setTimeout(()=>{ h.remove(); if(!all && i<list.length-1){ i++; paint(1); } else paint(); },1700);
    };
    let x0=null; const body=el.querySelector(".p-body");
    body.ontouchstart=e=>x0=e.touches[0].clientX; body.ontouchend=e=>{ if(all||x0===null) return; const dx=e.changedTouches[0].clientX-x0; if(dx<-50&&i<list.length-1){ i++; paint(1); } else if(dx>50&&i>0){ i--; paint(1); } x0=null; };
  };
  paint();
  if(!S.seen.prayTip){ S.seen.prayTip=1; save(); sheet(`<svg viewBox="0 0 200 120" style="width:100%;border-radius:16px;background:linear-gradient(160deg,#E6D7F3,#CFE3F4)"><g transform="translate(30 0)">${handsArt(false)}</g></svg><h3 style="margin-top:14px">How to pray for this request</h3><p>Take a quiet moment to read the request. Then ask God to meet their need. When you’ve prayed, tap “Amen” as a quiet sign of intercession.</p><button class="btn" data-x>Got it!</button>`,(s,c)=>s.querySelector("[data-x]").onclick=c); }
}

/* ---------- BIBLE ---------- */
const VERSIONS={rv:{code:"RV1909",name:"Reina-Valera 1909",desc:"La clásica traducción al español de Cipriano de Valera (revisión de 1909), de dominio público.",path:"bible/rv/"},web:{code:"WEB",name:"World English Bible",desc:"A modern, readable English translation, freely available in the public domain.",path:"bible/"},kjv:{code:"KJV",name:"King James Version",desc:"The classic English translation first published in 1611 (1769 edition), in the public domain.",path:"bible/kjv/"}};
let BIDX=null; const BIDXS={};
const BVER=()=>{ const v=S.bver||(ES?"rv":"web"); return VERSIONS[v]?v:"web"; }; const BCACHE={}; let bibleListening=false;
async function loadIdx(){ const p=BVER()==="rv"?"bible/rv/index.json":"bible/index.json"; if(!BIDXS[p]) BIDXS[p]=await fetch(p).then(r=>r.json()); BIDX=BIDXS[p]; return BIDX; }
async function loadBook(i){ const v=BVER(); const k=v+i; if(!BCACHE[k]) BCACHE[k]=await fetch(`${VERSIONS[v].path}${String(i).padStart(2,"0")}.json`).then(r=>r.json()); return BCACHE[k]; }
function viewBible(){
  return `<div class="screen bible-screen"><div class="b-head" id="bhead"><button class="icon-btn" id="bset">${ic("lines")}</button><div class="seg ${bibleListening?"listen":""}" id="bseg" style="transform:scale(.92)"><span class="knob"></span><button class="${bibleListening?"":"on"}" data-bm="read">${ic("lines")}Read</button><button class="${bibleListening?"on":""}" data-bm="listen">${ic("head")}Listen</button></div><div style="display:flex;gap:8px;align-items:center"><button class="icon-btn" id="bth" title="Light / dark">${ic(S.bibleDark?"sun":"moon")}</button><button class="chip" id="bver" style="font-size:12px">${VERSIONS[BVER()].code}</button></div></div>
    <div class="pad" id="bwrap"><div class="bible-txt" id="btxt" style="--bfs:${S.bfs}px"><p class="muted" style="font-family:inherit">Loading…</p></div>
    <button class="btn ghost sm" id="bnext" style="margin:26px 0 8px"></button>
    <p class="muted" style="font-size:11.5px;text-align:center;margin:14px 0 30px">Scripture: ${VERSIONS[BVER()].name} (${VERSIONS[BVER()].code}), public domain.</p></div>
    <div class="mini bible-mini ${bibleListening?"":"hidden"}" id="bmini"><div class="th" style="background:linear-gradient(135deg,#CFE3F4,#E6D7F3);display:grid;place-items:center;color:var(--blue)">${ic("bible").replace("<svg ",'<svg style="width:20px" ')}</div><div style="flex:1"><b id="bmt">…</b><div class="bar"><i id="bmb" style="width:0"></i></div></div><button data-bpp>${ic("pause").replace("<svg ",'<svg style="width:22px;height:22px" ')}</button></div></div>`;
}
function openVersions(){
  page("Versions", Object.entries(VERSIONS).map(([k,v])=>`<button class="vcard ${BVER()===k?"on":""}" data-ver="${k}"><span class="vbadge">${v.code}</span><span style="flex:1;text-align:left"><b>${v.name}</b><small>${v.desc}</small></span></button>`).join("")+`<div class="card" style="padding:14px;margin-top:20px;box-shadow:none;border:1px solid var(--line);font-size:13.5px" class="muted">${ic("spark").replace("<svg ",'<svg style="width:15px;vertical-align:-3px;color:var(--muted)" ')} More versions coming soon</div>`,
  el=>el.querySelectorAll("[data-ver]").forEach(b=>b.onclick=()=>{ S.bver=b.dataset.ver; save(); N.stop(); bibleListening=false; el.remove(); render(); toast(`Now reading the ${VERSIONS[S.bver].name}`); }));
}
afterRender.bible=async()=>{
  const idx=await loadIdx(); const b=await loadBook(S.bibleBook); const ch=b.chapters[S.bibleCh]||b.chapters[0];
  if(tab!=="bible") return;
  const ref=`${b.name} ${S.bibleCh+1}`;
  clearTimeout(window.__bchT); window.__bchT=setTimeout(()=>{ if(tab==="bible") addLight(10,"bible-"+BVER()+S.bibleBook+"-"+S.bibleCh,1); },20000);
  const hl=new Set(S.highlights.filter(h=>h.b===S.bibleBook&&h.c===S.bibleCh).map(h=>h.v));
  const txt=document.getElementById("btxt");
  txt.innerHTML=`<h2 style="font-family:var(--serif);font-size:26px;margin:6px 0 14px">${esc(ref)}</h2>`+ch.map((v,i)=>v?`<span class="v ${hl.has(i+1)?"hl":""}" data-v="${i+1}"><sup>${i+1}</sup>${esc(v)} </span>`:"").join("");
  if(bibleAnim){ txt.classList.add(bibleAnim); setTimeout(()=>txt.classList.remove(bibleAnim),400); bibleAnim=""; }
  const nextRef = S.bibleCh<b.chapters.length-1 ? `${b.name} ${S.bibleCh+2}` : (S.bibleBook<idx.length-1 ? `${idx[S.bibleBook+1][0]} 1` : "");
  const nb=document.getElementById("bnext"); if(nextRef){ nb.innerHTML=`Next: ${esc(nextRef)} ›`; } else nb.classList.add("hidden");
  const go=(bk,c,dir)=>{ S.bibleBook=bk; S.bibleCh=c; save(); bibleAnim=dir>0?"slideL":"slideR"; if(bibleListening){ N.stop(); } render(); window.scrollTo(0,0); if(bibleListening) setTimeout(()=>startBibleAudio(),300); };
  const prev=()=>{ if(S.bibleCh>0) go(S.bibleBook,S.bibleCh-1,-1); else if(S.bibleBook>0) go(S.bibleBook-1, idx[S.bibleBook-1][1]-1,-1); };
  const next=()=>{ if(S.bibleCh<b.chapters.length-1) go(S.bibleBook,S.bibleCh+1,1); else if(S.bibleBook<idx.length-1) go(S.bibleBook+1,0,1); };
  nb.onclick=next;
  let x0=null,y0=null; const wrap=document.getElementById("bwrap");
  wrap.ontouchstart=e=>{ x0=e.touches[0].clientX; y0=e.touches[0].clientY; };
  wrap.ontouchend=e=>{ if(x0===null) return; const dx=e.changedTouches[0].clientX-x0, dy=e.changedTouches[0].clientY-y0; if(Math.abs(dx)>70 && Math.abs(dx)>Math.abs(dy)*1.5){ dx<0?next():prev(); } x0=null; };
  // header hide on scroll
  const head=document.getElementById("bhead"); let ly=window.scrollY;
  window.onscroll=()=>{ const y=window.scrollY; head.classList.toggle("hide", y>80 && y>ly); ly=y; };
  // listen
  const mini=document.getElementById("bmini");
  const startBibleAudio=()=>{ bibleListening=true; N.load(`${ref}. `+ch.join(" "), ref); N.play(); const sg=document.getElementById("bseg"); if(sg){ sg.classList.add("listen"); sg.querySelector('[data-bm=read]').classList.remove("on"); sg.querySelector('[data-bm=listen]').classList.add("on"); } mini?.classList.remove("hidden"); };
  N.onupdate=()=>{ const m=document.getElementById("bmini"); if(!m) return; document.getElementById("bmt").textContent=ref; const pct=N.total()?Math.min(100,N.elapsed()/N.total()*100):0; document.getElementById("bmb").style.width=pct+"%"; m.querySelector("[data-bpp]").innerHTML=ic(N.playing?"pause":"play").replace("<svg ",'<svg style="width:22px;height:22px" '); if(!N.playing && N.i>=N.sents.length && bibleListening){ next(); } };
  document.querySelectorAll("[data-bm]").forEach(x=>x.onclick=()=>{ if(x.dataset.bm==="listen"){ if(!bibleListening) startBibleAudio(); } else { bibleListening=false; N.stop(); const sg=document.getElementById("bseg"); sg.classList.remove("listen"); sg.querySelector('[data-bm=read]').classList.add("on"); sg.querySelector('[data-bm=listen]').classList.remove("on"); mini.classList.add("hidden"); } });
  mini.querySelector("[data-bpp]").onclick=()=>{ N.playing?N.pause():N.play(); };
  document.getElementById("bmt").textContent=ref;
  const openBooks=()=>{ let openB=S.bibleBook;
    page("Books","",el=>{ const paint=()=>{ el.querySelector(".p-body").innerHTML=idx.map(([n,c],i)=>`<button class="bk" data-b="${i}">${esc(n)}<span class="muted">${ic(openB===i?"chev":"right").replace("<svg ",'<svg style="width:18px" ')}</span></button>${openB===i?`<div class="chgrid">${Array.from({length:c},(_,k)=>`<button class="${i===S.bibleBook&&k===S.bibleCh?"on":""}" data-c="${k}">${k+1}</button>`).join("")}</div>`:""}`).join("");
      el.querySelectorAll("[data-b]").forEach(x=>x.onclick=()=>{ openB=openB===+x.dataset.b?-1:+x.dataset.b; paint(); });
      el.querySelectorAll("[data-c]").forEach(x=>x.onclick=()=>{ el.remove(); go(openB,+x.dataset.c,1); }); };
      paint(); setTimeout(()=>el.querySelector(".chgrid")?.scrollIntoView({block:"center"}),50); }); };
  document.getElementById("bver").onclick=openVersions;
  document.getElementById("bth").onclick=()=>{ S.bibleDark=!S.bibleDark; save(); const y=window.scrollY; const wasListening=bibleListening; render(); window.scrollTo(0,y); };
  document.getElementById("bset").onclick=()=>sheet(`<h3 style="text-align:left">Bible settings</h3><div class="list" style="box-shadow:none;border:1px solid var(--line)"><button class="li" data-vr>${ic("bible")}<span>Version<small>${VERSIONS[BVER()].code}</small></span><span class="chev">${ic("right")}</span></button><button class="li" data-bk>${ic("book")}<span>Book<small>${esc(b.name)}</small></span><span class="chev">${ic("right")}</span></button><button class="li" data-fs>${ic("text")}<span>Text size<small>${S.bfs}px</small></span><span class="chev">${ic("right")}</span></button><button class="li" data-dm>${ic(S.bibleDark?"sun":"moon")}<span>Reading mode<small>${S.bibleDark?"Dark":"Light"}</small></span><span class="chev">${ic("right")}</span></button></div>`,(s,c)=>{ s.querySelector("[data-dm]").onclick=()=>{ S.bibleDark=!S.bibleDark; save(); c(); render(); }; s.querySelector("[data-vr]").onclick=()=>{ c(); openVersions(); }; s.querySelector("[data-bk]").onclick=()=>{ c(); openBooks(); }; s.querySelector("[data-fs]").onclick=()=>{ const o=[17,19,21,23]; S.bfs=o[(o.indexOf(S.bfs)+1)%o.length]; save(); c(); render(); }; });
  document.querySelectorAll(".bible-txt [data-v]").forEach(sp=>sp.onclick=()=>{
    const v=+sp.dataset.v; const t=ch[v-1]; const vref=`${b.name} ${S.bibleCh+1}:${v}`; sp.classList.add("sel");
    const isH=S.highlights.some(h=>h.b===S.bibleBook&&h.c===S.bibleCh&&h.v===v);
    const o=sheet(`<div style="font-family:var(--serif);font-size:17px;line-height:1.55;color:var(--ink);margin-bottom:6px">${esc(t)}</div><div class="muted" style="font-size:13px;margin-bottom:14px">${esc(vref)} · ${VERSIONS[BVER()].code}</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px"><button class="pill" data-h style="justify-content:center">${ic("bookmark").replace("<svg ",'<svg style="width:15px" ')}${isH?"Remove":"Highlight"}</button><button class="pill" data-c style="justify-content:center">${ic("copy").replace("<svg ",'<svg style="width:15px" ')}Copy</button><button class="pill" data-s style="justify-content:center">${ic("share").replace("<svg ",'<svg style="width:15px" ')}Share</button></div>`,(s,c)=>{
      s.querySelector("[data-h]").onclick=()=>{ if(isH) S.highlights=S.highlights.filter(h=>!(h.b===S.bibleBook&&h.c===S.bibleCh&&h.v===v)); else S.highlights.push({b:S.bibleBook,c:S.bibleCh,v,t,r:vref,ts:Date.now()}); save(); c(); sp.classList.remove("sel"); sp.classList.toggle("hl",!isH); toast(isH?"Highlight removed":"Saved to Highlights & notes"); };
      s.querySelector("[data-c]").onclick=()=>{ copyText(`${t} — ${vref}`); c(); sp.classList.remove("sel"); };
      s.querySelector("[data-s]").onclick=()=>{ shareText(`“${t}” — ${vref}\n\nshared from VEREDA`); c(); sp.classList.remove("sel"); }; });
    o.addEventListener("click",e=>{ if(e.target===o) sp.classList.remove("sel"); });
  });
};
let bibleAnim="";

/* ---------- boot ---------- */
splash();
render();
if(S.user && S.user.uid) { checkAccess(); pullState(S.user.uid); }
if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
window.__vereda = {S, render, LESSONS, openLesson, Player}; // for testing
})();
