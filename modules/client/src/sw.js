const buffer = new Map();

self.addEventListener('push', function(event) {
  const data = event.data.json();

  console.log(data);

  event.waitUntil(self.registration.showNotification(data.title, data.options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const action = {
    type: 'NOTIFICATION_CLICK',
    payload: event.notification.data.action,
  };

  const url = new URL(event.notification.data.url, self.location.origin);

  const promise = self.clients
    .matchAll({
      type: 'window',
      includeUncontrolled: true,
    })
    .then(clients => {
      const matchedClient = clients.find(c => c.url === url.href);

      console.log(matchedClient);

      if (matchedClient) {
        matchedClient.postMessage(action);
        console.log('message posted');

        return matchedClient.focus();
      }

      return self.clients.openWindow(url).then(c => buffer.set(c.id, action));
    });

  event.waitUntil(promise);
});

self.addEventListener('message', e => {
  if (e.data.type === 'GET_MESSAGES') {
    const client = e.source;

    if (buffer.has(client.id)) {
      client.postMessage(buffer.get(client.id));
      buffer.delete(client.id);
    }
  }
});
