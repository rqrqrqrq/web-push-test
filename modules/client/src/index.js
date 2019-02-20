const KEY_URL = 'http://localhost:8080/key';
const SUB_URL = 'http://localhost:8080/sub';

console.log('script load');

initServiceWorker();

function initServiceWorker() {
  if (checkServiceWorkerSupport() && checkPushManagerSupport()) {
    setTimeout(() => {
      navigator.serviceWorker.addEventListener('message', e => {
        console.log(e.data);
      });

      console.log('handler reg');

      getSwMessages();
    }, 5000);

    navigator.serviceWorker.ready
      .then(async reg => {
        console.log('sw registred');

        await requestNotificationPermission();

        const key = await fetch(KEY_URL)
          .then(r => r.text())
          .catch(e => {
            e.message =
              'Unable to get public key for notifications' + e.message;

            throw e;
          });

        const applicationServerKey = urlBase64ToUint8Array(key);

        const sub = await subscribe().catch(() =>
          reg.pushManager
            .getSubscription()
            .then(sub => sub.unsubscribe())
            .then(() => subscribe())
            .catch(e => {
              e.message = 'Unable to subscribe' + e.message;

              throw e;
            }),
        );

        await fetch(SUB_URL, {
          method: 'POST',
          body: JSON.stringify(sub),
        }).catch(e => {
          e.message = 'Unable to save subscription' + e.message;

          throw e;
        });

        function subscribe() {
          return reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          });
        }
      })
      .catch(e => console.error(e));

    self.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(e => {
        console.error('Unable to register serviceworker', e);
      });
    });
  }
}

function getSwMessages() {
  if (
    checkServiceWorkerSupport() &&
    checkPushManagerSupport() &&
    navigator.serviceWorker.controller
  ) {
    navigator.serviceWorker.controller.postMessage({
      type: 'GET_MESSAGES',
    });
  }
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
  try {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  } catch (e) {
    e.message = `Unable to convert server public key to Uint8Array. ${
      e.message
    }`;

    throw e;
  }
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
