require('dotenv').config();

const { json } = require('micro');
const webpush = require('web-push');

const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

webpush.setVapidDetails('mailto:rqtdfh@gmail.com', PUBLIC_KEY, PRIVATE_KEY);

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

      await webpush.sendNotification(
        subscription,
        JSON.stringify({
          title: 'rqrqrqrq',
          options: {
            body: 'hey man',
            data: {
              url: '/yoba',
            },
          },
        }),
      );

      return { done: true };
    }

    case '/key': {
      return PUBLIC_KEY;
    }
  }
};
