'use strict'

const Transport = require('./lib/Transport')
const Connection = require('./lib/Connection')
const ConnectionPool = require('./lib/ConnectionPool')
const Serializer = require('./lib/Serializer')
const selectors = require('./lib/Selectors')
const symbols = require('./lib/symbols')
const { BadConfigurationError } = require('./lib/errors')

// const buildApi = require('../monorepo/packages/es-api-6')

const {
  kTransport,
  kConnectionPool,
  kSerializer,
  kSelector
} = symbols

class Client {
  constructor (opts = {}) {
    if (!opts.host) {
      throw new BadConfigurationError('Missing host option')
    }

    // if (opts.log) {
    //   this.on('response', console.log)
    //   this.on('error', console.log)
    // }

    const Selector = selectors.RoundRobinSelector
    const options = Object.assign({}, {
      Connection,
      ConnectionPool,
      Transport,
      Serializer,
      Selector,
      maxRetries: 3,
      requestTimeout: 30000,
      sniffInterval: false,
      sniffOnStart: false
    }, opts)

    this[kSelector] = new options.Selector()
    this[kSerializer] = new options.Serializer()
    this[kConnectionPool] = new options.ConnectionPool({
      selector: this[kSelector]
    })
    this[kTransport] = new options.Transport({
      connectionPool: this[kConnectionPool],
      serializer: this[kSerializer],
      maxRetries: options.maxRetries,
      requestTimeout: options.requestTimeout,
      sniffInterval: options.sniffInterval,
      sniffOnStart: options.sniffOnStart
    })

    this.request = this[kTransport].request.bind(this[kTransport])

    // const apis = buildApi({
    //   makeRequest: this[kTransport].request.bind(this[kTransport])
    // })

    // Object.keys(apis).forEach(api => {
    //   this[api] = apis[api]
    // })

    this[kConnectionPool].addConnection(options.host)
  }
}

module.exports = {
  Client,
  Transport,
  ConnectionPool,
  Serializer,
  selectors,
  symbols
}