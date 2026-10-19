{\rtf1\ansi\ansicpg1252\cocoartf2907
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx566\tx1133\tx1700\tx2267\tx2834\tx3401\tx3968\tx4535\tx5102\tx5669\tx6236\tx6803\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // Dublin Sign Field \'96 offline cache\
const SHELL='dsf-shell-v1', DATA='dsf-data-v1', TILES='dsf-tiles-v1', TILE_MAX=3000;\
const SHELL_FILES=['./','index.html','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png',\
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',\
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'];\
\
self.addEventListener('install',e=>\{e.waitUntil(caches.open(SHELL).then(c=>c.addAll(SHELL_FILES)).then(()=>self.skipWaiting()));\});\
self.addEventListener('activate',e=>\{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>![SHELL,DATA,TILES].includes(k)).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));\});\
\
async function trim(cache,max)\{const keys=await cache.keys(); for(let i=0;i<keys.length-max;i++) await cache.delete(keys[i]);\}\
\
self.addEventListener('fetch',e=>\{\
  const url=new URL(e.request.url);\
  if(e.request.method!=='GET') return;\
  // City sign data: network first, fall back to last copy\
  if(url.hostname.endsWith('arcgis.com') && url.pathname.includes('/FeatureServer/'))\{\
    e.respondWith(fetch(e.request).then(r=>\{const c=r.clone(); caches.open(DATA).then(ca=>ca.put(e.request,c)); return r;\})\
      .catch(()=>caches.match(e.request)));\
    return;\
  \}\
  // Basemap tiles: cache first\
  if(url.hostname==='server.arcgisonline.com')\{\
    e.respondWith(caches.open(TILES).then(async ca=>\{const hit=await ca.match(e.request); if(hit) return hit;\
      const r=await fetch(e.request); if(r.ok||r.type==='opaque')\{ca.put(e.request,r.clone()); trim(ca,TILE_MAX);\} return r;\}));\
    return;\
  \}\
  // App shell: cache first\
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request)));\
\});}