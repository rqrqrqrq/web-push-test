const KEY_URL = 'http://localhost:8080/key';
const SUB_URL = 'http://localhost:8080/sub';

initServiceWorker();

function initServiceWorker() {
  self.addEventListener('load', () => {
    if (checkServiceWorkerSupport() && checkPushManagerSupport()) {
      navigator.serviceWorker.register('./sw.js');

      navigator.serviceWorker.ready
        .then(async reg => {
          console.log('reg', reg);

          await requestNotificationPermission();

          const key = await fetch(KEY_URL).then(r => r.text());

          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(key),
          });

          console.log('sub', JSON.stringify(sub));

          await fetch(SUB_URL, {
            method: 'POST',
            body: JSON.stringify(sub),
          });

          console.log('subscription registred');
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
      throw new Error("We weren't granted permission.");
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
