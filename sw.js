const C='bebe-v1',OK=['www.gstatic.com','fonts.googleapis.com','fonts.gstatic.com'];
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(clients.claim()));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);
 if(e.request.method!=='GET'||!(u.origin===location.origin||OK.includes(u.hostname)))return;
 e.respondWith(caches.open(C).then(async c=>{try{const r=await fetch(e.request);if(r.ok)c.put(e.request,r.clone());return r}
  catch(err){const m=(await c.match(e.request))||(await c.match('./index.html'));if(m)return m;throw err}}))});
