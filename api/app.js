'use strict'

const Jimp = require('jimp')
const Fastify = require('fastify')
const oauthPlugin = require('fastify-oauth2')
const fastifyCookie = require('fastify-cookie')
const fastifyFormBody = require('fastify-formbody')
const fastifyMultipart = require('fastify-multipart')

const pages = require('./pages')
const photoApi = require('./google-photo')

function build (opts) {
  const fastify = Fastify({ logger: true })

  fastify.register(pages, opts)

  fastify.register(fastifyFormBody)
  fastify.register(fastifyMultipart, { addToBody: true })

  fastify.register(fastifyCookie, {
    secret: opts.cookieSecret,
    parseOptions: {} // options for parsing cookies
  })

  fastify.decorateRequest('getAccessToken', function (reply) {
    if (this.cookies.acg) {
      const { acg } = this.cookies
      return reply.unsignCookie(acg) // reply is missing
    }
    return null
  })

  fastify.register(oauthPlugin, {
    name: 'googleOAuth2',
    scope: ['profile',
      'https://www.googleapis.com/auth/photoslibrary.readonly.appcreateddata',
      'https://www.googleapis.com/auth/photoslibrary.appendonly'].join(' '),
    credentials: {
      client: opts.google,
      auth: oauthPlugin.GOOGLE_CONFIGURATION
    },
    startRedirectPath: '/login/google',
    callbackUri: opts.callbackUrl
  })

  fastify.get('/login/google/callback', async function (request, reply) {
    const accessToken = await this.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request)

    reply.setCookie('acg', accessToken.access_token, {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 24,
      sameSite: true,
      signed: true
    })

    return reply.redirect('/')
  })

  fastify.post('/album/create', async function (request, reply) {
    const accessToken = request.getAccessToken(reply)
    if (!accessToken) {
      return 'NOT AUTHORIZED'
    }

    const album = await photoApi.createAlbum(accessToken, request.body.title)
    request.log.debug('Created album', album)

    return reply.redirect('/')
  })

  fastify.post('/album/upload', async function (request, reply) {
    const accessToken = request.getAccessToken(reply)
    if (!accessToken) {
      return 'NOT AUTHORIZED'
    }

    const photo = request.body.importFile[0]

    const font = await Jimp.loadFont('./fonts/FrancoisOne-white-80.fnt')
    const image = await Jimp.read(photo.data)

    const buff = await image.resize(1024, 600)
      // .print(font, 10, 10, 'Hello world!')
      .print(font, 0, 0, {
        text: request.body.text || '',
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
      },
      1024, 580)
      .getBufferAsync(photo.mimetype)

    const imageToken = await photoApi.uploadImage(accessToken, photo.mimetype, buff)
    request.log.debug('Uploaded image')

    await photoApi.storeImageInAlbum(accessToken, photo.filename, imageToken, request.body.album)

    reply.type('text/html')
    return `
    <html>
    <body>
      DONE!!
      <a href="/">Back</a>
    </body>
    </html>
    `
  })

  return fastify
}

module.exports = build
