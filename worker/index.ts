import { Queue } from 'workbox-background-sync';

declare const self: ServiceWorkerGlobalScope;

const queue = new Queue('deck-sync-requests', {
  maxRetentionTime: 24 * 60,
  onSync: async ({ queue }) => {
    const nonPostRequests = [];
    const idsHandled: string[] = [];
    let entry;

    // empty queue and handle POST requests first
    while ((entry = await queue.shiftRequest())) {
      try {
        if (entry.request.method === 'POST') {
          await fetch(entry.request);
        } else {
          nonPostRequests.push(entry);
        }
      } catch (error) {
        await queue.unshiftRequest(entry);
        throw error;
      }
    }

    // handle remaining requests
    for (const entry of nonPostRequests.reverse()) {
      try {
        const regexMatchArray = entry.request.url.match(/id=eq\.(.+)/);
        if (!regexMatchArray) continue;
        const id = regexMatchArray[1];
        if (idsHandled.includes(id)) continue;

        await fetch(entry.request);
        idsHandled.push(id);
      } catch (error) {
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  },
});

self.addEventListener('fetch', event => {
  const { method, url } = event.request;

  const shouldBgSync =
    ((method === 'POST' || method === 'PATCH' || method === 'DELETE') && url.match(/\.supabase\.co\/rest\/v1\/notes/)) ||
    (method === 'PATCH' && url.match(/\.supabase\.co\/rest\/v1\/decks/));

  if (!shouldBgSync) {
    return;
  }

  const bgSyncLogic = async (): Promise<Response> => {
    try {
      const response = await fetch(event.request.clone());
      return response;
    } catch (error) {
      await queue.pushRequest({ request: event.request });
      return new Response();
    }
  };

  event.respondWith(bgSyncLogic());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
