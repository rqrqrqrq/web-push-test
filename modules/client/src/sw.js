self.addEventListener('push', function(event) {
  const data = event.data.json();

  console.log(data);

  event.waitUntil(self.registration.showNotification(data.title, data.options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

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
        sendMessage(matchedClient);

        return matchedClient.focus();
      }

      return self.clients.openWindow(url).then(c => sendMessage(c));

      function sendMessage(client) {
        client.postMessage({
          type: 'NOTIFICATION_CLICK',
          payload: event.notification.data.pageEvent,
        });
        console.log('message posted');
      }
    });

  event.waitUntil(promise);
});
