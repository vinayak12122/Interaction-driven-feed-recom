const CACHE_NAME = "image-cache-v1";

self.addEventListener("install",(event)=>{
    self.skipWaiting();
})

self.addEventListener("activate",(event)=>{
    event.waitUntil(clients.claim());
})

self.addEventListener("fetch",(event) => {
    const request = event.request;

    if(request.url.includes("/images/")){
        event.respondWith(
            caches.match(request).then((cachedResponse)=>{
                if(cachedResponse){
                    return cachedResponse;
                }
                return fetch(request).then((networkResponse) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        )
    }
})