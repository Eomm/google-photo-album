'use strict'

const build = require('./app')
const auth = require('../nest-api-credentials.json')

const app = build({
  google: {
    id: auth.web.client_id,
    secret: auth.web.client_secret
  },
  callbackUrl: 'http://localhost:3003/api/login/google/callback',
  cookieSecret: auth.web.project_id
})

app.listen(3003)
