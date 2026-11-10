// Builds app/content-es.js: Spanish devotionals + Reina-Valera 1909 verses (public domain) looked up by reference.
const fs=require('fs'), path=require('path');
const APP='/home/claude/bibloslifeapp/app', ES='/home/claude/tools/es';
global.window={}; require(APP+'/content.js'); const C=window.VEREDA_CONTENT;
const enIdx=JSON.parse(fs.readFileSync(APP+'/bible/index.json')), esIdx=JSON.parse(fs.readFileSync(APP+'/bible/rv/index.json'));
const books={}; const bcache={};
const book=i=>bcache[i]||(bcache[i]=JSON.parse(fs.readFileSync(`${APP}/bible/rv/${String(i).padStart(2,'0')}.json`)));
function look(ref){
  const m=ref.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/); if(!m) throw new Error('bad ref '+ref);
  const name=m[1].replace(/^Psalm$/,'Psalms'); let bi=enIdx.findIndex(b=>b[0]===name);
  if(bi<0) throw new Error('book '+name);
  const ch=+m[2], v1=+m[3], v2=+(m[4]||m[3]);
  const vs=book(bi).chapters[ch-1].slice(v1-1,v2); if(vs.length!==v2-v1+1||vs.some(x=>!x)) throw new Error('verses '+ref);
  let t=vs.join(' ').replace(/\s+/g,' ').trim();
  const esName=esIdx[bi][0]==='Salmos'?'Salmo':esIdx[bi][0];
  return {t, r:`${esName} ${ch}:${v1}${m[4]?'-'+v2:''}`};
}
const out={modules:null, lessons:{}, prompts:null, verses:null};
const rest=JSON.parse(fs.readFileSync(ES+'/rest.es.json'));
out.modules=C.modules.map((m,mi)=>({...m, title:rest.modules[mi].title, subtitle:rest.modules[mi].subtitle, chapters:(m.chapters||[]).map((c,ci)=>({...c, title:rest.modules[mi].chapters[ci].title, lessons:rest.modules[mi].chapters[ci].lessons}))}));
out.prompts=rest.prompts;
out.verses=C.verses.map(v=>look(v.r));
for(const k of Object.keys(C.lessons)){
  const en=C.lessons[k], es=JSON.parse(fs.readFileSync(`${ES}/${k}.es.json`));
  const dv=es.devotional.map(b=>b.v?(()=>{const x=look(b.v.slice(1));return {v:x.t,r:x.r};})():b);
  if(dv.length!==en.devotional.length) throw new Error('devotional length '+k);
  if(es.quiz.length!==en.quiz.length||es.quiz.some((q,i)=>q.a!==en.quiz[i].a||q.o.length!==en.quiz[i].o.length)) throw new Error('quiz mismatch '+k);
  const cl=look(en.closing.r);
  out.lessons[k]={...en, prayer:es.prayer, devotional:dv, quiz:es.quiz, action:es.action, journal:es.journal, closing:{t:cl.t,r:cl.r}};
}
fs.writeFileSync(APP+'/content-es.js','window.VEREDA_CONTENT_ES='+JSON.stringify(out)+';\n');
console.log('ok', fs.statSync(APP+'/content-es.js').size, out.verses.slice(0,2), out.lessons['1-1-4'].devotional[8]);
