/* VEREDA app — single-file PWA (local-first). */
(function(){
"use strict";
const C = window.VEREDA_CONTENT;
const CONFIG = {
  supportEmail: "support@vereda.app",
  manageSubscriptionUrl: "https://consumer.hotmart.com/",
  privacyUrl: "#", termsUrl: "#",
  communityApi: "" // set to a backend URL to share prayer requests between users
};
const $app = document.getElementById("app");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\*(.+?)\*/g,"<em>$1</em>");
const todayStr = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const fmtDate = s => new Date(s+"T12:00:00").toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
const initials = n => (n||"").trim().split(/\s+/).slice(0,2).map(w=>w[0]||"").join("").toUpperCase() || "V";
const uid = () => Math.random().toString(36).slice(2,10);

/* ---------- state ---------- */
const KEY = "vereda_app_v1";
const DEF = { user:null, theme:"light", completed:{}, steps:{}, journal:[], requests:[], prayed:{}, highlights:[], ratings:{}, seen:{}, voice:"", rate:1, bibleBook:0, bibleCh:0, bfs:19, dev:false };
let S;
try { S = Object.assign({}, DEF, JSON.parse(localStorage.getItem(KEY)||"{}")); } catch(e){ S = {...DEF}; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){} };
if (/[?&]dev=1/.test(location.search)) { S.dev = true; save(); }
if (/[?&]dev=0/.test(location.search)) { S.dev = false; save(); }
document.documentElement.dataset.theme = S.theme;
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
function isAvailable(i){
  if (i < currentIndex()) return true;
  if (i > currentIndex()) return false;
  if (i === 0 || S.dev) return true;
  return S.completed[LESSONS[i-1].key] < todayStr();
}
function todayLesson(){
  const ci = currentIndex();
  // if today's lesson was just completed today, keep showing it as "done"
  const last = ci>0 ? LESSONS[ci-1] : null;
  if (last && S.completed[last.key] === todayStr() && !S.dev) return {L:last, done:true};
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
 text:'<path d="M4 7V4h16v3M9 20h6M12 4v16"/>', bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>', flame:'<path d="M12 22c4 0 7-3 7-7 0-5-5-7-5-12-3 2-5 5-5 8-1-1-2-2-2-4-2 2-2 5-2 8 0 4 3 7 7 7Z"/>', gift:'<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M2 9h20M12 9v12M12 9c-2-4-7-5-7-2s4 2 7 2c3 0 7 1 7-2s-5-2-7 2"/>', sprout:'<path d="M12 21v-9"/><path d="M12 13C12 8 8 6 4 6c0 4 3 7 8 7ZM12 11c0-4 3-7 8-7 0 4-3 7-8 7Z"/>', hands:'<path d="M12 3c-1 4-4 7-5 11-.6 2.4.8 4 3 4h2Z"/><path d="M12 3c1 4 4 7 5 11 .6 2.4-.8 4-3 4h-2Z"/><path d="M5 21h14"/>', mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5"/>', trash:'<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15"/>', edit:'<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'
};
const ic = (n, cls="") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${P[n]||""}</svg>`;
const LOGO = `<img src="../images/logo.svg" alt="VEREDA" style="height:30px">`;

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
  if(tone==="bg"){ const c=dark?["#182532","#162029","#141922"]:["#E6EEF3","#F2F3F0","#FDF7EF"]; return `<div class="clouds" style="--ch:${h}px;${extra}"><div class="cl" style="animation-duration:80s;bottom:34%">${cloudBand(11,c[0])}</div><div class="cl" style="animation-duration:55s;bottom:16%">${cloudBand(41,c[1])}</div><div class="cl" style="animation-duration:38s">${cloudBand(97,c[2])}</div></div>`; }
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
  s.innerHTML=`${layer("44vh","#3C7FB4",60,7,0)}${layer("30vh","#7DAAD2",44,31,.12)}${layer("16vh","#E8F1F9",32,77,.24)}<div class="lgw"><img src="../images/logo-stacked.svg" alt="VEREDA"></div><div class="tag">Your daily path closer to God</div>`;
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
  voices(){ const v=(window.speechSynthesis?.getVoices()||[]).filter(v=>/^en/i.test(v.lang)); const pref=v.filter(x=>/natural|premium|enhanced|google|samantha|daniel|karen|moira|aria|jenny|guy/i.test(x.name)); return (pref.length?pref:v).slice(0,4); },
  load(text,title){ this.stop(); this.title=title; this.sents=text.replace(/\s+/g," ").match(/[^.!?…]+[.!?…]+[”"’]?|[^.!?…]+$/g)||[text]; this.sents=this.sents.map(s=>s.trim()).filter(Boolean); this.i=0; this.emit(); },
  total(){ return this.sents.reduce((a,s)=>a+s.length,0)/14/(S.rate||1); },
  elapsed(){ return this.sents.slice(0,this.i).reduce((a,s)=>a+s.length,0)/14/(S.rate||1); },
  speak(){ if(!window.speechSynthesis){ toast("Audio isn’t supported on this browser"); return; }
    speechSynthesis.cancel(); if(this.i>=this.sents.length){ this.playing=false; this.i=this.sents.length; this.emit(); return; }
    const u=new SpeechSynthesisUtterance(this.sents[this.i]); u.lang="en-US"; u.rate=S.rate||1;
    const vs=this.voices(); const v=vs.find(x=>x.name===S.voice)||vs[0]; if(v) u.voice=v;
    u.onend=()=>{ if(!this.playing) return; this.i++; this.emit(); this.speak(); };
    speechSynthesis.speak(u); },
  play(){ this.playing=true; if(this.i>=this.sents.length) this.i=0; this.speak(); this.emit(); },
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
function render(){
  N.onupdate=null;
  if(!S.user){ renderWelcome(); return; }
  const view = {journey:viewJourney, explore:viewExplore, journal:viewJournal, community:viewCommunity, bible:viewBible}[tab]();
  $app.innerHTML = view + tabbar();
  bindTabbar(); afterRender[tab] && afterRender[tab]();
}
const afterRender = {};
function tabbar(){
  const t=[["journey","path","Journey"],["explore","explore","Explore"],["journal","journal","Journal"],["community","community","Community"],["bible","bible","Bible"]];
  const jdot = !S.journal.some(j=>j.date===todayStr());
  return `<nav class="tabbar">${t.map(([k,i,l])=>`<button data-tab="${k}" class="${tab===k?"on":""}">${ic(i)}${l}${k==="journal"&&jdot?'<span class="dot"></span>':""}</button>`).join("")}</nav>`;
}
function bindTabbar(){ document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{ tab=b.dataset.tab; Music.stop(); render(); window.scrollTo(0,0); }); }

/* ---------- welcome / auth ---------- */
function renderWelcome(step){
  if(step==="form"||step==="login"){
    const login = step==="login";
    $app.innerHTML = `<div class="welcome" style="justify-content:flex-start;padding-top:calc(env(safe-area-inset-top) + 20px)">
      <button class="icon-btn" id="bk" style="align-self:flex-start">${ic("back")}</button>
      <h1 style="margin:40px 0 8px">${login?"Welcome back":"Let’s set up your journey"}</h1>
      <p class="muted" style="margin-bottom:26px">${login?"Sign in with the email you used to purchase.":"Use the same email you used at checkout."}</p>
      ${login?"":`<input class="field" id="nm" placeholder="Your first name" autocomplete="given-name" style="margin-bottom:12px">`}
      <input class="field" id="em" type="email" placeholder="Email" autocomplete="email" inputmode="email">
      <button class="btn" id="go" style="margin-top:20px">${login?"Sign in":"Start my journey"}</button>
      <p class="muted" style="font-size:12.5px;margin-top:16px">By continuing you agree to our <a class="link" href="${CONFIG.termsUrl}">Terms</a> and <a class="link" href="${CONFIG.privacyUrl}">Privacy Policy</a>.</p></div>`;
    document.getElementById("bk").onclick=()=>renderWelcome();
    document.getElementById("go").onclick=()=>{
      const em=document.getElementById("em").value.trim(); const nm=login? (em.split("@")[0]) : document.getElementById("nm").value.trim();
      if(!/^\S+@\S+\.\S+$/.test(em)){ toast("Please enter a valid email"); return; }
      if(!login && !nm){ toast("Please enter your name"); return; }
      S.user={name:nm.charAt(0).toUpperCase()+nm.slice(1), email:em}; save(); tab="journey"; render(); };
    return;
  }
  $app.innerHTML = `<div class="welcome">
    <img src="../images/logo-stacked.svg" alt="VEREDA" style="width:150px">
    <h1 style="margin-top:26px;font-size:24px;line-height:1.3">Find daily peace and grow closer to God</h1>
    <div class="laurel" style="margin-top:22px"><span class="stars">★★★★★</span> 4.8 rating</div>
    <div class="laurel" style="margin-top:6px">Join 950K believers</div>
    <div style="flex:1"></div>
    <svg viewBox="0 0 320 120" style="width:100%;max-width:360px;margin-bottom:24px"><path d="M160 118C150 90 120 80 140 55s40-20 30-50" stroke="#0E5F95" stroke-width="18" fill="none" stroke-linecap="round" opacity=".18"/><path d="M160 118C150 90 120 80 140 55s40-20 30-50" stroke="#0E5F95" stroke-width="3" stroke-dasharray="2 9" fill="none" stroke-linecap="round"/><circle cx="170" cy="5" r="5" fill="#C9973F"/></svg>
    <button class="btn" id="start">Start my journey</button>
    <button class="link" id="have" style="margin-top:18px">I already have an account</button></div>`;
  document.getElementById("start").onclick=()=>renderWelcome("form");
  document.getElementById("have").onclick=()=>renderWelcome("login");
}

/* ---------- JOURNEY ---------- */
const GLY={lamp:"flame",name:"heart",gift:"gift",prayer:"hands",wait:"sprout",shield:"shield",tree:"sprout"};
let todayCollapsed=false, cdTimer=null;
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
    if(ci>0) html += `<div style="position:relative;height:0">${puff("-30px","-80px",140,11,.8,ci*2)}${puff("72%","-40px",120,13,.7,ci*3)}</div>`;
    const items = LESSONS.filter(l=>l.ci===ci);
    for(let k=0;k<items.length;k+=3){
      const pair=items.slice(k,k+2), mid=items[k+2];
      html += `<div class="row">${pair.map(nodeHTML).join("")}${pair.length===2?'<div class="dots-h"></div>':""}</div>`;
      if(mid) html += `<div class="row center">${nodeHTML(mid)}</div>`;
    }
  });
  function nodeHTML(l){
    const done=!!S.completed[l.key], current=l.idx===cur && isAvailable(l.idx), open=done||current;
    const hx = current ? HEX("#9CCBEE","#2F7DB8","#1D5F92",.45) : done ? HEX("#C9E0F2","#6FA8D4","#4C86B4",.5) : HEX("#F3F5F7","#C9CFD7","#A9B1BC",.55);
    const kind=C.lessons[l.key]?.image; const icon = open ? (GLY[kind]||"path") : "lock";
    return `<button class="node ${open?"open":"locked"} ${current?"current":""}" data-node="${l.idx}"><div class="hex">${hx}${ic(icon,"ico")}</div><span>${esc(l.title)}</span></button>`;
  }
  const next = C.modules[1];
  html += `<div class="next-mod"><span class="tag">UP NEXT</span><b>Module 2: ${esc(next.title)} ${ic("lock").replace('<svg ','<svg style="width:16px;height:16px;vertical-align:-2px" ')}</b><span class="muted" style="font-size:14px">The next modules unlock after you finish the current one</span></div>`;
  return `<div class="screen journey"><div class="safe-top"></div>
    <div class="j-top"><button class="chip" id="mod">Module 1</button><div style="display:flex;gap:8px"><button class="icon-btn" id="hl">${ic("bookmark")}</button><button class="icon-btn" id="me">${initials(S.user.name)}</button></div></div>
    ${card}<div style="position:relative;height:84px">${clouds(96,"bg","bottom:-2px")}</div><div class="path">${html}</div></div><button class="fab-top hidden" id="top">${ic("up")}</button>
    <div class="j-mini" id="jmini"><button>${esc(L.title)}${ic("chev")}</button></div>`;
}
afterRender.journey = () => {
  document.getElementById("tgl").onclick=()=>{ todayCollapsed=!todayCollapsed; document.getElementById("today").classList.toggle("collapsed",todayCollapsed); };
  document.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>{ const L=todayLesson().L; openLesson(L.key, b.dataset.open); });
  document.querySelectorAll("[data-node]").forEach(b=>b.onclick=()=>{
    const l=LESSONS[+b.dataset.node];
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
  const top=document.getElementById("top"); top.onclick=()=>window.scrollTo({top:0,behavior:"smooth"});
  const jm=document.getElementById("jmini"); jm.querySelector("button").onclick=()=>window.scrollTo({top:0,behavior:"smooth"});
  window.onscroll=()=>{ top.classList.toggle("hidden",window.scrollY<500); jm.classList.toggle("show",window.scrollY>330); };
  if(sessionStorage.getItem("vjust")){ sessionStorage.removeItem("vjust"); document.querySelectorAll(".today .st .ck").forEach((c,i)=>c.style.animationDelay=(0.25+i*0.18)+"s"); } else document.querySelectorAll(".today .st .ck").forEach(c=>c.style.animation="none");
  clearInterval(cdTimer); cdTimer=setInterval(()=>{ const e=document.getElementById("cd"); if(!e){ clearInterval(cdTimer); return; } const ms=msToMidnight(); e.textContent=hms(ms); if(ms<1500) setTimeout(render,1600); },1000);
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
    el.style.background = bg && document.documentElement.dataset.theme!=="dark" ? bg : "";
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
    if(quiz.answers[quiz.i]!==undefined) return; quiz.answers[quiz.i]=j; const q=D.quiz[quiz.i]; const ok=j===q.a;
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
    if(firstTime){ S.completed[key]=todayStr(); save(); sessionStorage.setItem("vjust","1"); }
    navigator.vibrate && navigator.vibrate([15,60,25]);
    el.style.background = document.documentElement.dataset.theme==="dark" ? "" : "#E3EEDF";
    el.innerHTML = `<div class="p-body" style="padding:0;display:flex"><div class="done-scene scene green" style="margin:0;width:100%">${clouds(200,"white")}<div class="rays"></div>${puff("8%","18%",110,11,.8,2)}${puff("64%","10%",90,13,.7,6)}
      ${laurel()}<h2 class="st2" style="font-size:28px;color:var(--ink);text-align:center;margin-top:10px;line-height:1.2">You did great today!</h2><p class="muted st3" style="margin-top:8px;text-align:center">Before you finish, pause and reflect</p>
      <div class="refl"><small>${ic("journal").replace("<svg ",'<svg style="width:14px;height:14px" ')} Your daily reflection</small><div>${esc(D.journal)}</div></div></div></div>
      <div class="p-foot st4" style="background:none"><button class="btn" data-ref>Write my reflection</button><button class="btn ghost" data-fin style="margin-top:10px;background:rgba(255,255,255,.75)">Finish for today</button></div>`;
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

/* ---------- PROFILE / HIGHLIGHTS ---------- */
function page(title, inner, onMount){
  const el=document.createElement("div"); el.className="player"; el.innerHTML=`<div class="p-top"><button class="icon-btn" data-back>${ic("back")}</button><div class="p-title">${esc(title)}</div><span style="width:36px"></span></div><div class="p-body" style="padding-top:10px">${inner}</div>`;
  document.body.appendChild(el); el.querySelector("[data-back]").onclick=()=>{ el.remove(); render(); }; onMount && onMount(el); return el;
}
function openProfile(){
  page("", `<div style="display:flex;align-items:center;gap:14px;margin:4px 0 22px"><div class="icon-btn" style="width:56px;height:56px;font-size:18px;background:var(--soft);color:var(--blue)">${initials(S.user.name)}</div><div><div style="font-size:22px;font-weight:700;color:var(--ink)">${esc(S.user.name)}</div><button class="muted" data-edit style="font-size:14px">Edit profile ✎</button></div></div>
   <div class="list" style="margin-bottom:16px"><button class="li" data-hl>${ic("bookmark")}Highlights &amp; notes<span class="chev">${ic("right")}</span></button><button class="li" data-jr>${ic("journal")}My journal<span class="chev">${ic("right")}</span></button></div>
   <div class="list"><button class="li" data-set>${ic("settings")}Settings<span class="chev">${ic("right")}</span></button><a class="li" href="${CONFIG.manageSubscriptionUrl}" target="_blank">${ic("heart")}Manage subscription<span class="chev">${ic("right")}</span></a><a class="li" href="${CONFIG.privacyUrl}">${ic("shield")}Privacy Policy<span class="chev">${ic("right")}</span></a><a class="li" href="${CONFIG.termsUrl}">${ic("doc")}Terms &amp; Conditions<span class="chev">${ic("right")}</span></a><button class="li" data-faq>${ic("help")}FAQ<span class="chev">${ic("right")}</span></button><a class="li" href="mailto:${CONFIG.supportEmail}">${ic("mail")}<span>Support<small>${CONFIG.supportEmail}</small></span><span class="chev">${ic("right")}</span></a></div>`,
  el=>{
    el.querySelector("[data-hl]").onclick=openHighlights;
    el.querySelector("[data-jr]").onclick=()=>{ el.remove(); tab="journal"; render(); };
    el.querySelector("[data-edit]").onclick=()=>sheet(`<h3>Edit profile</h3><input class="field" id="pn" value="${esc(S.user.name)}"><button class="btn" data-ok style="margin-top:14px">Save</button>`,(s,c)=>s.querySelector("[data-ok]").onclick=()=>{ const v=s.querySelector("#pn").value.trim(); if(v){ S.user.name=v; save(); } c(); el.remove(); openProfile(); });
    el.querySelector("[data-faq]").onclick=()=>page("FAQ",[["How does the Journey work?","A new devotional unlocks every day. Complete today’s prayer, word, quiz and action to unlock tomorrow’s day."],["Can I skip ahead?","No — the Journey is designed to build a daily habit, one step at a time."],["Which Bible version is used?","The World English Bible (WEB), a modern English translation in the public domain."],["How do I listen instead of reading?","Tap “Listen” on any prayer or devotional. You can change the narrator and speed."],["How do I cancel?","Tap Manage subscription in your profile, or contact support."]].map(([q,a])=>`<div class="jentry"><div class="q">${q}</div><div class="a">${a}</div></div>`).join(""));
    el.querySelector("[data-set]").onclick=()=>page("Settings",`<div class="list" style="margin-bottom:16px"><div class="li">${ic("mail")}<span>Email<small>${esc(S.user.email)}</small></span></div><button class="li" data-th>${ic(S.theme==="dark"?"sun":"moon")}Theme<span class="chev muted" style="font-size:14px">${S.theme==="dark"?"Dark":"Light"}</span></button><button class="li" data-fs>${ic("text")}Bible text size<span class="chev muted" style="font-size:14px">${S.bfs}px</span></button><button class="li" data-nr>${ic("mic")}Narrator speed<span class="chev muted" style="font-size:14px">${S.rate||1}×</span></button></div>
      <div class="list"><button class="li" data-lo>${ic("out")}Sign out</button><button class="li" data-del style="color:var(--bad)">${ic("trash")}Delete my data</button></div><p class="muted" style="text-align:center;font-size:12px;margin-top:18px">VEREDA v1.0</p>`,p=>{
        p.querySelector("[data-th]").onclick=()=>{ S.theme=S.theme==="dark"?"light":"dark"; document.documentElement.dataset.theme=S.theme; save(); p.remove(); el.querySelector("[data-set]").click(); };
        p.querySelector("[data-fs]").onclick=()=>{ const o=[17,19,21,23]; S.bfs=o[(o.indexOf(S.bfs)+1)%o.length]; save(); p.remove(); el.querySelector("[data-set]").click(); };
        p.querySelector("[data-nr]").onclick=()=>{ const r=[0.75,1,1.25,1.5]; S.rate=r[(r.indexOf(S.rate||1)+1)%r.length]; save(); p.remove(); el.querySelector("[data-set]").click(); };
        p.querySelector("[data-lo]").onclick=()=>{ S.user=null; save(); p.remove(); el.remove(); render(); };
        p.querySelector("[data-del]").onclick=()=>sheet(`<h3>Delete all data?</h3><p>This removes your progress, journal and highlights from this device.</p><button class="btn" style="background:var(--bad)" data-y>Delete</button><button class="btn ghost" data-x style="margin-top:10px">Cancel</button>`,(s,c)=>{ s.querySelector("[data-x]").onclick=c; s.querySelector("[data-y]").onclick=()=>{ localStorage.removeItem(KEY); location.reload(); }; });
      });
  });
}
function openHighlights(){
  const items=S.highlights.slice().reverse();
  page("Highlights & notes", items.length? items.map((h,i)=>`<div class="jentry"><div class="q">${esc(h.r)}</div><div class="a" style="font-family:var(--serif);font-size:16px">${esc(h.t)}</div><div style="display:flex;gap:8px;margin-top:10px"><button class="pill" data-c="${i}">${ic("copy").replace("<svg ",'<svg style="width:15px" ')}Copy</button><button class="pill" data-d="${i}">${ic("trash").replace("<svg ",'<svg style="width:15px" ')}Remove</button></div></div>`).join("") :
    `<div class="empty">${ic("bookmark").replace("<svg ",'<svg style="width:56px;height:56px;color:var(--blue)" ')}<b>No highlights yet</b><p class="muted">Tap any verse in the Bible to highlight it. It will appear here.</p></div>`,
  el=>{ el.querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>{ const h=items[+b.dataset.c]; copyText(`${h.t} — ${h.r}`); }); el.querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>{ const h=items[+b.dataset.d]; S.highlights=S.highlights.filter(x=>x!==h); save(); el.remove(); openHighlights(); }); });
}

/* ---------- EXPLORE ---------- */
function verseOfDay(offset=0){ const d=new Date(); d.setDate(d.getDate()-offset); const n=Math.floor(d/864e5); return {...C.verses[n%C.verses.length], d}; }
const STORY_BG=["linear-gradient(160deg,#0E5F95,#3C86BC 60%,#C9973F)","linear-gradient(160deg,#1E3A5F,#0E5F95 60%,#7FB6E0)","linear-gradient(160deg,#4A3F6B,#7A6BA8 60%,#E3B8A0)","linear-gradient(160deg,#21503F,#3F8A6B 60%,#D9C27F)","linear-gradient(160deg,#5B2E48,#9A4F6E 60%,#F0B37E)","linear-gradient(160deg,#16324F,#2C5D8F 55%,#9CC4E4)","linear-gradient(160deg,#3B3024,#8A6A44 60%,#E8D3A8)"];
function viewExplore(){
  const st=Array.from({length:7},(_,i)=>verseOfDay(i));
  return `<div class="screen"><div class="safe-top"></div><div class="pad"><h1 style="margin-bottom:14px">Explore</h1><div class="muted" style="font-size:14px;margin-bottom:8px">Verses of the day</div></div>
   <div class="stories">${st.map((v,i)=>`<button class="story" data-st="${i}"><div style="background:${STORY_BG[i%7]}">${esc(v.r)}</div></button>`).join("")}</div>
   <div class="pad" style="margin:18px 0 10px"><div class="muted" style="font-size:14px">Coming soon</div></div>
   <div class="soon"><div class="i">${ic("head")}</div><div><b>Audio podcasts <span class="badge">Soon</span></b><span class="muted" style="font-size:13.5px">Short episodes to grow in faith on the go</span></div></div>
   <div class="soon"><div class="i">${ic("doc")}</div><div><b>Articles <span class="badge">Soon</span></b><span class="muted" style="font-size:13.5px">Quick reads on faith, prayer and everyday life</span></div></div>
   <div class="soon"><div class="i">${ic("book")}</div><div><b>Bible stories <span class="badge">Soon</span></b><span class="muted" style="font-size:13.5px">The great stories of Scripture, told simply</span></div></div></div>`;
}
afterRender.explore=()=>document.querySelectorAll("[data-st]").forEach(b=>b.onclick=()=>openStory(+b.dataset.st));
function openStory(i){
  document.querySelector(".storyview")?.remove();
  const v=verseOfDay(i); const el=document.createElement("div"); el.className="storyview"; el.style.background=STORY_BG[i%7];
  el.innerHTML=`${clouds(220,"white")}<div class="story-bars">${Array.from({length:7},(_,k)=>`<i class="${k<i?"done":k===i?"run":""}"><b></b></i>`).join("")}</div><div style="position:absolute;top:calc(env(safe-area-inset-top) + 22px);left:16px;right:16px;display:flex;justify-content:space-between;align-items:center;z-index:2"><span style="font-size:13px;opacity:.85">${v.d.toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span><button data-x style="color:#fff">${ic("x").replace("<svg ",'<svg style="width:26px;height:26px" ')}</button></div>
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
function todaysPrompt(){
  const ci=currentIndex(); const last = ci>0?LESSONS[ci-1]:null; const T=todayLesson();
  const L = T.done ? T.L : (last && S.completed[last.key]===todayStr() ? last : T.L);
  return C.lessons[L.key]?.journal || C.prompts[new Date().getDate()%C.prompts.length];
}
function viewJournal(){
  const groups={}; S.journal.slice().sort((a,b)=>b.ts-a.ts).forEach(j=>(groups[j.date]=groups[j.date]||[]).push(j));
  const body = Object.keys(groups).length ? Object.entries(groups).map(([d,arr])=>`<div class="muted" style="font-size:13px;margin:16px 0 8px">${fmtDate(d)}</div>${arr.map(j=>`<div class="jentry"><div class="q">${esc(j.q)}</div><div class="a">${esc(j.a)}</div><button data-jm="${j.id}" style="position:absolute;right:12px;top:12px;color:var(--muted)">${ic("dots").replace("<svg ",'<svg style="width:20px" ')}</button></div>`).join("")}`).join("")
    : `<div class="empty"><svg viewBox="0 0 120 100" width="140"><ellipse cx="60" cy="70" rx="52" ry="20" fill="var(--soft)"/><rect x="34" y="22" width="52" height="60" rx="8" fill="var(--card)" stroke="var(--blue)" stroke-width="3"/><path d="M44 40h32M44 50h32M44 60h20" stroke="var(--blue)" stroke-width="3" stroke-linecap="round"/></svg><b>Your reflections will appear here</b><p class="muted">Write a few lines each day and see how far God has brought you.</p></div>`;
  return `<div class="screen"><div class="safe-top"></div><div class="pad"><h1>Journal</h1><div class="muted" style="font-size:13px;margin-top:4px">${fmtDate(todayStr())}</div>${body}</div>
    <div style="position:fixed;left:50%;transform:translateX(-50%);width:calc(100% - 32px);max-width:448px;bottom:calc(var(--tab-h) + 22px + env(safe-area-inset-bottom));z-index:30"><button class="btn" id="wr">${ic("edit").replace("<svg ",'<svg style="width:20px;height:20px" ')} Write a reflection</button></div></div>`;
}
afterRender.journal=()=>{
  document.getElementById("wr").onclick=()=>openJournalEditor(todaysPrompt(), true);
  document.querySelectorAll("[data-jm]").forEach(b=>b.onclick=()=>{ const j=S.journal.find(x=>x.id===b.dataset.jm);
    sheet(`<button class="li" data-e>${ic("edit")}Edit</button><button class="li" data-d style="color:var(--bad)">${ic("trash")}Delete</button>`,(s,c)=>{ s.querySelector("[data-e]").onclick=()=>{ c(); openJournalEditor(j.q,false,j); }; s.querySelector("[data-d]").onclick=()=>{ S.journal=S.journal.filter(x=>x!==j); save(); c(); render(); }; }); });
  if(!S.seen.journal) journalOnboarding();
};
function journalOnboarding(){
  const slides=[["Record your walk with God","Where did I notice God’s presence today?","What does an abundant life in Christ look like for me?","linear-gradient(170deg,#0E5F95,#2B6F8F 50%,#7A6A4F)"],["Find peace through reflection","Each day, release your worries, notice your blessings and grow in trust.","What worry do you need to lay down today?","linear-gradient(170deg,#1E3A5F,#3C86BC 55%,#C9973F)"],["And see how far God has brought you","What small step can you take toward your calling?","How can you glorify God with your plans for tomorrow?","linear-gradient(170deg,#21503F,#0E5F95 60%,#E3B8A0)"]];
  let i=0; const el=document.createElement("div"); el.className="onb"; document.body.appendChild(el);
  const paint=()=>{ const s=slides[i]; el.style.background=s[3]; el.innerHTML=`<div class="bars">${slides.map((_,k)=>`<i class="${k<=i?"on":""}"></i>`).join("")}</div><h2>${s[0]}</h2>${i===1?`<p>${s[1]}</p>`:""}<div style="flex:1;position:relative">${i===1?"":`<div class="floaty" style="transform:rotate(-4deg);margin-left:auto">${s[1]}</div>`}<div class="floaty" style="transform:rotate(3deg)">${s[2]}</div></div><button class="btn white">${i<2?"Continue":"Start journaling"}</button>`;
    el.querySelector("button").onclick=()=>{ if(i<2){ i++; paint(); } else { S.seen.journal=1; save(); el.remove(); } }; };
  paint();
}
function openJournalEditor(q, isNew, entry){
  let prompt=q; const el=document.createElement("div"); el.className="player";
  const paint=()=>{ el.innerHTML=`<div class="p-top"><button class="icon-btn" data-back>${ic("back")}</button><span></span><button class="icon-btn" data-new title="New question">${ic("refresh")}</button></div>
    <div class="p-body"><span class="chip st1" style="background:var(--soft);color:var(--blue);height:26px;font-size:12px">${ic("spark").replace("<svg ",'<svg style="width:13px" ')} ${prompt===todaysPrompt()?"Today’s reflection":"A question to help you grow"}</span>
    <h2 style="font-size:21px;color:var(--ink);line-height:1.35;margin:14px 0 12px">${esc(prompt)}</h2>
    <textarea class="field" id="ja" placeholder="Feel free to go into detail…" style="background:transparent;border:0;padding:0;min-height:40vh;font-size:17px">${esc(entry?.a||"")}</textarea></div>
    <div class="p-foot"><button class="btn" data-ok ${entry?.a?"":"disabled"}>Done</button></div>`;
    const ta=el.querySelector("#ja"), ok=el.querySelector("[data-ok]"); ta.oninput=()=>ok.disabled=!ta.value.trim(); setTimeout(()=>ta.focus(),200);
    el.querySelector("[data-back]").onclick=()=>{ el.remove(); render(); };
    el.querySelector("[data-new]").onclick=()=>{ const ps=C.prompts.filter(p=>p!==prompt); prompt=ps[Math.floor(Math.random()*ps.length)]; const v=ta.value; paint(); el.querySelector("#ja").value=v; el.querySelector("[data-ok]").disabled=!v.trim(); };
    ok.onclick=()=>{ const a=ta.value.trim(); if(entry){ entry.a=a; entry.q=prompt; } else S.journal.push({id:uid(), date:todayStr(), ts:Date.now(), q:prompt, a}); save(); el.remove(); tab="journal"; render(); toast("Your journal was updated"); };
  };
  document.body.appendChild(el); paint();
  if(!S.seen.newQ){ S.seen.newQ=1; save(); setTimeout(()=>{ const b=el.querySelector("[data-new]"); if(!b) return; const r=b.getBoundingClientRect(); const tp=document.createElement("div"); tp.className="tip"; tp.style.top=(r.bottom+10)+"px"; tp.style.right="12px"; tp.innerHTML="<b>Need a new question?</b>Tap here for another journaling suggestion."; tp.onclick=()=>tp.remove(); el.appendChild(tp); setTimeout(()=>tp.remove(),4500); },600); }
}

/* ---------- COMMUNITY ---------- */
let comTab="all";
function viewCommunity(){
  const list = comTab==="all" ? S.requests : S.requests.filter(r=>r.mine);
  const cards = list.slice().sort((a,b)=>b.ts-a.ts).map(r=>`<button class="req" data-rq="${r.id}"><div class="t">${esc(r.text)}</div><div class="m"><span class="av">${esc(initials(r.name))}</span>${esc(r.name)}<span class="cnt">${ic("heart").replace("<svg ",'<svg style="width:15px;height:15px" ')}${r.prayers||0}</span></div></button>`).join("");
  const empty = comTab==="all"
    ? `<div class="empty"><svg viewBox="0 0 120 100" width="150"><ellipse cx="60" cy="72" rx="52" ry="18" fill="var(--soft)"/><path d="M60 78c-14-10-30-20-30-36a14 14 0 0 1 30-6 14 14 0 0 1 30 6c0 16-16 26-30 36Z" fill="#E58A9A"/></svg><b>This space is waiting for prayer</b><p class="muted">When a prayer request is shared, it will appear here. Share what is on your heart and let others lift you up.</p></div>`
    : `<div class="empty"><svg viewBox="0 0 120 100" width="150"><ellipse cx="60" cy="72" rx="52" ry="18" fill="var(--soft)"/><path d="M38 70c6-22 14-38 22-46 8 8 16 24 22 46Z" fill="var(--blue)" opacity=".85"/></svg><b>Your prayer requests will appear here</b><p class="muted">When something is on your heart, you can share it. The VEREDA community will be with you in prayer.</p></div>`;
  return `<div class="screen"><div class="safe-top"></div><div class="pad"><h1>Community</h1>
    <div style="display:flex;align-items:center;gap:8px;margin:14px 0 16px"><button class="chip ${comTab==="all"?"dark":""}" data-ct="all">All</button><button class="chip ${comTab==="mine"?"dark":""}" data-ct="mine">Your requests</button>${S.requests.length?`<button class="link" id="pall" style="margin-left:auto;font-size:14px">Pray for all</button>`:""}</div>
    ${cards||empty}</div><button class="fab" id="newrq">${ic("plus")}</button></div>`;
}
afterRender.community=()=>{
  document.querySelectorAll("[data-ct]").forEach(b=>b.onclick=()=>{ comTab=b.dataset.ct; render(); });
  document.querySelectorAll("[data-rq]").forEach(b=>b.onclick=()=>openPray(S.requests.find(r=>r.id===b.dataset.rq)));
  const pa=document.getElementById("pall"); if(pa) pa.onclick=()=>openPray(null);
  document.getElementById("newrq").onclick=newRequest;
  if(!S.seen.community){ S.seen.community=1; save(); sheet(`<svg viewBox="0 0 200 110" style="width:100%;border-radius:16px;background:var(--soft)"><path d="M70 70c10-20 30-30 50-24 6-10 18-12 24-8-6 2-8 6-8 10 0 18-22 30-46 22-8-2-14 2-20 0Z" fill="#fff"/><path d="M146 40l10-3-6 8" fill="#6DBA78"/></svg><h3 style="margin-top:14px">Introducing prayer requests!</h3><p>Share what’s on your heart and pray for others. Faith grows stronger when we carry each other.</p><button class="btn" data-x>Explore community</button>`,(s,c)=>s.querySelector("[data-x]").onclick=c); }
};
function newRequest(){
  sheet(`<h3>Share a prayer request</h3><textarea class="field" id="rq" placeholder="What can we pray for?" maxlength="600"></textarea>
    <label style="display:flex;align-items:center;gap:10px;margin:12px 2px;font-size:14px"><input type="checkbox" id="anon" style="width:18px;height:18px"> Post anonymously</label>
    <button class="btn" data-ok disabled>Share request</button>${CONFIG.communityApi?"":`<p class="muted" style="font-size:12px;margin:10px 0 0">Your request is saved on this device.</p>`}`,(s,c)=>{
    const t=s.querySelector("#rq"), ok=s.querySelector("[data-ok]"); t.oninput=()=>ok.disabled=t.value.trim().length<5;
    ok.onclick=()=>{ S.requests.push({id:uid(), text:t.value.trim(), name:s.querySelector("#anon").checked?"Anonymous":S.user.name, ts:Date.now(), prayers:0, mine:true}); save(); c(); comTab="mine"; render(); toast("Your request was shared"); };
  });
}
function openPray(r){
  const count = r ? (r.prayers||0) : S.requests.length;
  const text = r ? r.text : "Lord, we place all of these prayer requests in your hands. Bring peace, healing and guidance to every heart. May each person feel your presence and care today. Amen.";
  const prayed = r ? !!S.prayed[r.id] : false;
  const el=document.createElement("div"); el.className="player pray-screen";
  el.innerHTML=`<div class="p-top"><button class="icon-btn" data-back>${ic("back")}</button><div class="p-title">Prayer request</div><span class="muted" style="width:36px;text-align:right;font-size:13px">${count}</span></div>
    ${clouds(240,"white")}${puff("6%","22%",120,11,.8,2)}${puff("62%","34%",90,13,.7,5)}<div class="p-body" style="padding-top:20px;position:relative;z-index:1"><div style="text-align:center"><span class="chip" id="pc">${r? (prayed?`You and ${Math.max(0,count-1)} others prayed`:`${count} ${count===1?"person has":"people have"} prayed`) : `Praying for ${count} ${count===1?"heart":"hearts"}`}</span></div>
    <div class="pray-text" style="margin-top:24px">${esc(text)}</div>${r?`<div class="muted" style="padding:0 8px;font-size:14px">— ${esc(r.name)}</div>`:""}</div>
    <div class="p-foot"><div class="card" style="display:flex;align-items:center;gap:12px;padding:12px 14px;margin-bottom:12px"><div class="i" style="width:36px;height:36px;border-radius:10px;background:var(--soft);display:grid;place-items:center;color:var(--blue)">${ic("music").replace("<svg ",'<svg style="width:18px" ')}</div><div style="flex:1;font-weight:600;font-size:14px;color:var(--ink)">Soft music for prayer<div class="bar" style="height:3px;margin-top:8px"><i id="mb" style="width:0"></i></div></div><button data-mu style="color:var(--ink)">${ic("play").replace("<svg ",'<svg style="width:22px;height:22px" ')}</button></div>
    <button class="btn" data-amen ${prayed?"disabled":""}>Amen</button></div>`;
  document.body.appendChild(el);
  let mt=null, p0=0;
  const stopM=()=>{ Music.stop(); clearInterval(mt); };
  el.querySelector("[data-back]").onclick=()=>{ stopM(); el.remove(); render(); };
  const mu=el.querySelector("[data-mu]");
  mu.onclick=()=>{ if(Music.on){ stopM(); mu.innerHTML=ic("play").replace("<svg ",'<svg style="width:22px;height:22px" '); } else { Music.start(); mu.innerHTML=ic("pause").replace("<svg ",'<svg style="width:22px;height:22px" '); mt=setInterval(()=>{ p0=(p0+0.5)%100; const b=el.querySelector("#mb"); if(b) b.style.width=p0+"%"; },300); } };
  el.querySelector("[data-amen]").onclick=()=>{
    const h=document.createElement("div"); h.className="hands"; h.innerHTML="<div>🙏</div>"; document.body.appendChild(h); setTimeout(()=>h.remove(),1700);
    if(r){ r.prayers=(r.prayers||0)+1; S.prayed[r.id]=1; } else S.requests.forEach(x=>{ if(!S.prayed[x.id]){ x.prayers=(x.prayers||0)+1; S.prayed[x.id]=1; } });
    save(); el.querySelector("[data-amen]").disabled=true; el.querySelector("#pc").textContent = r?`You and ${r.prayers-1} others prayed`:`You prayed for ${count} ${count===1?"heart":"hearts"}`;
  };
  if(!S.seen.prayTip){ S.seen.prayTip=1; save(); sheet(`<svg viewBox="0 0 200 110" style="width:100%;border-radius:16px;background:linear-gradient(160deg,#E6D7F3,#CFE3F4)"><path d="M100 30c-6 18-16 30-20 48-2 9 4 16 12 16h8Z" fill="#fff"/><path d="M100 30c6 18 16 30 20 48 2 9-4 16-12 16h-8Z" fill="#F4F0FF"/></svg><h3 style="margin-top:14px">How to pray for this request</h3><p>Take a quiet moment to read the request. Then ask God to meet their need. When you’ve prayed, tap “Amen” as a quiet sign of intercession.</p><button class="btn" data-x>Got it!</button>`,(s,c)=>s.querySelector("[data-x]").onclick=c); }
}

/* ---------- BIBLE ---------- */
let BIDX=null; const BCACHE={}; let bibleSel=null;
async function loadIdx(){ if(!BIDX) BIDX=await fetch("bible/index.json").then(r=>r.json()); return BIDX; }
async function loadBook(i){ if(!BCACHE[i]) BCACHE[i]=await fetch(`bible/${String(i).padStart(2,"0")}.json`).then(r=>r.json()); return BCACHE[i]; }
function viewBible(){
  return `<div class="screen"><div class="safe-top"></div><div class="pad" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px"><button class="icon-btn" id="bset">${ic("lines")}</button><button class="chip" id="bref">…</button><span class="chip" style="font-size:12px">WEB</span></div>
    <div class="pad"><div class="bible-txt" id="btxt" style="--bfs:${S.bfs}px"><p class="muted" style="font-family:inherit">Loading…</p></div>
    <div style="display:flex;gap:10px;margin:22px 0 10px"><button class="btn ghost sm" id="bprev">‹ Previous</button><button class="btn ghost sm" id="bnext">Next ›</button></div>
    <p class="muted" style="font-size:11.5px;text-align:center;margin:14px 0">Scripture: World English Bible (WEB), public domain.</p></div></div>`;
}
afterRender.bible=async()=>{
  const idx=await loadIdx(); const b=await loadBook(S.bibleBook); const ch=b.chapters[S.bibleCh]||b.chapters[0];
  if(tab!=="bible") return;
  document.getElementById("bref").textContent=`${b.name} ${S.bibleCh+1}`;
  const hl=new Set(S.highlights.filter(h=>h.b===S.bibleBook&&h.c===S.bibleCh).map(h=>h.v));
  document.getElementById("btxt").innerHTML=`<h2 style="font-family:var(--serif);font-size:26px;margin:6px 0 14px">${esc(b.name)} ${S.bibleCh+1}</h2>`+ch.map((v,i)=>v?`<span class="v ${hl.has(i+1)?"hl":""}" data-v="${i+1}"><sup>${i+1}</sup>${esc(v)} </span>`:"").join("");
  const go=(bk,c)=>{ S.bibleBook=bk; S.bibleCh=c; save(); render(); window.scrollTo(0,0); };
  document.getElementById("bprev").onclick=()=>{ if(S.bibleCh>0) go(S.bibleBook,S.bibleCh-1); else if(S.bibleBook>0) go(S.bibleBook-1, idx[S.bibleBook-1][1]-1); };
  document.getElementById("bnext").onclick=()=>{ if(S.bibleCh<b.chapters.length-1) go(S.bibleBook,S.bibleCh+1); else if(S.bibleBook<idx.length-1) go(S.bibleBook+1,0); };
  const openBooks=()=>{ let openB=S.bibleBook;
    const p=page("Books","",el=>{ const paint=()=>{ el.querySelector(".p-body").innerHTML=idx.map(([n,c],i)=>`<button class="bk" data-b="${i}">${esc(n)}<span class="muted">${ic(openB===i?"chev":"right").replace("<svg ",'<svg style="width:18px" ')}</span></button>${openB===i?`<div class="chgrid">${Array.from({length:c},(_,k)=>`<button class="${i===S.bibleBook&&k===S.bibleCh?"on":""}" data-c="${k}">${k+1}</button>`).join("")}</div>`:""}`).join("");
      el.querySelectorAll("[data-b]").forEach(x=>x.onclick=()=>{ openB=openB===+x.dataset.b?-1:+x.dataset.b; paint(); });
      el.querySelectorAll("[data-c]").forEach(x=>x.onclick=()=>{ el.remove(); go(openB,+x.dataset.c); }); };
      paint(); setTimeout(()=>el.querySelector(".chgrid")?.scrollIntoView({block:"center"}),50); }); };
  document.getElementById("bref").onclick=openBooks;
  document.getElementById("bset").onclick=()=>sheet(`<h3 style="text-align:left">Bible settings</h3><div class="list" style="box-shadow:none;border:1px solid var(--line)"><div class="li">${ic("bible")}<span>Version<small>World English Bible (WEB)</small></span></div><button class="li" data-bk>${ic("book")}<span>Book<small>${esc(b.name)}</small></span><span class="chev">${ic("right")}</span></button><button class="li" data-fs>${ic("text")}<span>Text size<small>${S.bfs}px</small></span><span class="chev">${ic("right")}</span></button></div><p class="muted" style="font-size:12.5px;margin-top:12px">More versions coming soon.</p>`,(s,c)=>{ s.querySelector("[data-bk]").onclick=()=>{ c(); openBooks(); }; s.querySelector("[data-fs]").onclick=()=>{ const o=[17,19,21,23]; S.bfs=o[(o.indexOf(S.bfs)+1)%o.length]; save(); c(); render(); }; });
  document.querySelectorAll(".bible-txt [data-v]").forEach(sp=>sp.onclick=()=>{
    const v=+sp.dataset.v; const t=ch[v-1]; const ref=`${b.name} ${S.bibleCh+1}:${v}`; sp.classList.add("sel");
    const isH=S.highlights.some(h=>h.b===S.bibleBook&&h.c===S.bibleCh&&h.v===v);
    const o=sheet(`<div style="font-family:var(--serif);font-size:17px;line-height:1.55;color:var(--ink);margin-bottom:6px">${esc(t)}</div><div class="muted" style="font-size:13px;margin-bottom:14px">${esc(ref)}</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px"><button class="pill" data-h style="justify-content:center">${ic("bookmark").replace("<svg ",'<svg style="width:15px" ')}${isH?"Remove":"Highlight"}</button><button class="pill" data-c style="justify-content:center">${ic("copy").replace("<svg ",'<svg style="width:15px" ')}Copy</button><button class="pill" data-s style="justify-content:center">${ic("share").replace("<svg ",'<svg style="width:15px" ')}Share</button></div>`,(s,c)=>{
      s.querySelector("[data-h]").onclick=()=>{ if(isH) S.highlights=S.highlights.filter(h=>!(h.b===S.bibleBook&&h.c===S.bibleCh&&h.v===v)); else S.highlights.push({b:S.bibleBook,c:S.bibleCh,v,t,r:ref,ts:Date.now()}); save(); c(); sp.classList.remove("sel"); sp.classList.toggle("hl",!isH); toast(isH?"Highlight removed":"Saved to Highlights & notes"); };
      s.querySelector("[data-c]").onclick=()=>{ copyText(`${t} — ${ref}`); c(); sp.classList.remove("sel"); };
      s.querySelector("[data-s]").onclick=()=>{ shareText(`“${t}” — ${ref}\n\nshared from VEREDA`); c(); sp.classList.remove("sel"); }; });
    o.addEventListener("click",e=>{ if(e.target===o) sp.classList.remove("sel"); });
  });
};

/* ---------- boot ---------- */
splash();
render();
if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
window.__vereda = {S, render, LESSONS, openLesson}; // for testing
})();
