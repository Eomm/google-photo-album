'use strict'

const Jimp = require('jimp')
const oauthPlugin = require('fastify-oauth2')
const fastifyCookie = require('fastify-cookie')
const fastifyFormBody = require('fastify-formbody')
const fastifyMultipart = require('fastify-multipart')
const photoApi = require('../google-photo')

module.exports = (fastify, opts, next) => {
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
      httpOnly: false,
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

    return album
  })

  fastify.get('/album/list', async function (request, reply) {
    const accessToken = request.getAccessToken(reply)
    if (!accessToken) {
      return 'NOT AUTHORIZED'
    }

    const albums = await photoApi.readAlbums(accessToken)
    request.log.debug('Read albums', albums)

    return albums.albums
  })

  fastify.post('/album/upload', async function (request, reply) {
    const accessToken = request.getAccessToken(reply)
    if (!accessToken) {
      return 'NOT AUTHORIZED'
    }

    // serial upload
    const out = []
    const { album } = request.body
    for (const f of request.body.importFile) {
      const res = await uploadImageToAlbum(accessToken, f, album)
      out.push(res)
    }

    return out
  })
  next()
}

async function uploadImageToAlbum (accessToken, photo, album) {
  // TODO cache font
  const font = await Jimp.loadFont('./fonts/FrancoisOne-white-80.fnt')
  const image = await Jimp.read(photo.data)

  const buff = await image.resize(1024, 600)
    .print(font, 0, 0, {
      text: photo.filename,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
    },
    1024, 580) // TODO input resize
    .getBufferAsync(photo.mimetype)

  const imageToken = await photoApi.uploadImage(accessToken, photo.mimetype, buff)
  return photoApi.storeImageInAlbum(accessToken, photo.filename, imageToken, album)
}
