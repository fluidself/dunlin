import { Queue } from 'workbox-background-sync';

declare const self: ServiceWorkerGlobalScope;

const queue = new Queue('deck-sync-requests', {
  onSync: async options => {
    const handledNotes: string[] = [];
    let entry;

    while ((entry = await options.queue.shiftRequest())) {
      try {
        const regexMatchArray = entry.request.url.match(/id=eq\.(.+)/);
        if (!regexMatchArray) continue;
        const noteId = regexMatchArray[1];
        if (handledNotes.includes(noteId)) continue;

        await fetch(entry.request);
        handledNotes.push(noteId);
      } catch (error) {
        // Put the entry back in the queue and re-throw the error
        await options.queue.unshiftRequest(entry);
        throw error;
      }
    }
  },
});

self.addEventListener('fetch', event => {
  const { method, url } = event.request;

  if (method !== 'PATCH' || !url.match(/\.supabase\.co\/rest\/v1\/notes/)) {
    return;
  }

  const bgSyncLogic = async (): Promise<Response> => {
    try {
      const response = await fetch(event.request.clone());
      return response;
    } catch (error) {
      await queue.unshiftRequest({ request: event.request });
      return new Response();
    }
  };

  event.respondWith(bgSyncLogic());
});
