const V="vereda-v15";const SHELL=["./","index.html","app.js","content.js","manifest.json","bible/index.json","images/logo.svg","images/logo-stacked.svg"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{if(e.request.method!=="GET"||e.request.url.endsWith(".mp3"))return;e.respondWith(fetch(e.request).then(r=>{const c=r.clone();if(r.ok&&new URL(e.request.url).origin===location.origin)caches.open(V).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request)))});
