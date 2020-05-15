'use strict'

const build = require('./app')
const app = build({
  google: {
    id: process.env.G_CLIENT_ID,
    secret: process.env.G_SECRET
  },
  callbackUrl: process.env.CALLBACK_URL,
  cookieSecret: process.env.COOKIE_SECRET
})

module.exports = async function (req, res) {
  await app.ready()
  app.server.emit('request', req, res)
}
