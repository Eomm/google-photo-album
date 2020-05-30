'use strict'

const Fastify = require('fastify')

const api = require('./plugin/api')
const pages = require('./plugin/pages')

function build (opts) {
  const fastify = Fastify({ logger: true })

  fastify.register(pages, opts)
  fastify.register(api, { ...opts, prefix: '/api' })

  return fastify
}

module.exports = build
