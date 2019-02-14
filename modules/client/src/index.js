const KEY_URL = 'http://localhost:8080/key';
const SUB_URL = 'http://localhost:8080/sub';

initServiceWorker();

function initServiceWorker() {
  self.addEventListener('load', () => {
    if (checkServiceWorkerSupport() && checkPushManagerSupport()) {
      navigator.serviceWorker.register('./sw.js').catch(e => {
        console.error('Unable to register serviceworker', e);
        throw e;
      });

      navigator.serviceWorker.ready
        .then(async reg => {
          await requestNotificationPermission();

          const key = await fetch(KEY_URL)
            .then(r => r.text())
            .catch(e => {
              console.error('Unable to get public key for notifications', e);
              throw e;
            });

          const sub = await subscribe(key).catch(() =>
            reg.pushManager
              .getSubscription()
              .then(sub => sub.unsubscribe())
              .then(() => subscribe(key))
              .catch(e => {
                console.error('Unable to subscribe', e);
                throw e;
              }),
          );

          await fetch(SUB_URL, {
            method: 'POST',
            body: JSON.stringify(sub),
          }).catch(e => {
            console.error('Unable to save subscription', e);
            throw e;
          });

          function subscribe(key) {
            return reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(key),
            });
          }
        })
        .catch(e => console.error(e));
    }
  });
}

function requestNotificationPermission() {
  return new Promise(function(resolve, reject) {
    const permissionResult = Notification.requestPermission(function(result) {
      resolve(result);
    });

    if (permissionResult) {
      permissionResult.then(resolve, reject);
    }
  }).then(function(permissionResult) {
    if (permissionResult !== 'granted') {
      throw new Error('Notification permissions rejected');
    }
  });
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function checkServiceWorkerSupport() {
  if ('serviceWorker' in navigator) {
    return true;
  }

  return false;
}

function checkPushManagerSupport() {
  if ('PushManager' in self) {
    return true;
  }

  return false;
}
