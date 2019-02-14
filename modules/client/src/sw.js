self.addEventListener('push', function(event) {
  console.log(event);
  console.log(JSON.stringify(event));

  const data = event.data.json();

  event.waitUntil(self.registration.showNotification(data.title, data.options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  console.log('clicked ', event.notification.data.url);

  const promiseChain = self.clients
    .matchAll({
      type: 'window',
    })
    .then(clients => console.log(clients));

  event.waitUntil(promiseChain);
});
