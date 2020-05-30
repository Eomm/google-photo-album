'use strict'

const fastifyStatic = require('fastify-static')
const photoApi = require('../google-photo')

module.exports = function (fastify, opts, next) {
  const path = require('path')

  fastify.register(fastifyStatic, {
    root: path.join(__dirname, '../../../frontend/build')
  })

  fastify.get('/asd', async (request, reply) => {
    const accessToken = request.getAccessToken(reply)
    if (accessToken) {
      const albums = await photoApi.readAlbums(accessToken)
      reply.type('text/html')
      return `
<html>
<body>
  <a href="/login/google">login</a>
  <br>
  <br>
  <form action='/album/upload' method='post' enctype='multipart/form-data'>
    <select name="album">${albums.albums.map(_ => `<option value="${_.id}">${_.title}</option>`).join('')}</select>
    <input type='text' name='text' />
    <input type='file' name='importFile' />
    <button type='submit'>RESIZE</button>
    </form>
    
  <form action='/album/create' method='post'>
    <input type='text' name='title'></input>
    <button type='submit'>CREATE NEW ALBUM</button>
  </form>
</body>
</html>`
    }

    reply.type('text/html')
    return notLoggedPage
  })

  next()
}

const notLoggedPage = `
<html>
<body>
  <a href="/login/google">login</a>
</body>
</html>
`
