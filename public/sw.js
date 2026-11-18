const CACHE="turbo-rush-shell-v2";
const CORE=["./","./index.html","./game.js","./manifest.webmanifest","./icon.svg"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  const url=new URL(e.request.url);
  if(url.origin===location.origin){e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(res=>{if(res.ok)caches.open(CACHE).then(c=>c.put(e.request,res.clone()));return res;}).catch(()=>caches.match("./index.html"))));}
});