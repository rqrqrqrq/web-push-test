require('dotenv').config();

const { json } = require('micro');
const webpush = require('web-push');

const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const keys = webpush.generateVAPIDKeys();

webpush.setVapidDetails(
  'mailto:rqtdfh@gmail.com',
  keys.publicKey,
  keys.privateKey,
);

let subscription = null;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  switch (req.url) {
    case '/sub': {
      const data = await json(req);

      subscription = data;

      return { done: true };
    }

    case '/send': {
      if (!subscription) {
        return { done: false };
      }

      const data = {
        url: '/yoba',
        action: {
          type: 'OPEN_DIALOG',
          payload: {
            dialogId: 1,
          },
        },
      };

      const notification = {
        title: 'rqrqrqrq' + Math.random(),
        options: {
          body: 'hey man' + Math.random(),
          tag: '1',
          renotify: true,
          data,
        },
      };

      await webpush.sendNotification(
        subscription,
        JSON.stringify(notification),
      );

      return { done: true };
    }

    case '/key': {
      return keys.publicKey;
    }
  }
};
