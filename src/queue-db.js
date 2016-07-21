const logger = require('./logger')(module)
const rethinkdbdash = require('rethinkdbdash')
const Promise = require('bluebird')
const enums = require('./enums')
const dbAssert = require('./db-assert')
const dbReview = require('./db-review')
const queueChange = require('./queue-change')

module.exports.attach = function dbAttach (q) {
  logger('attach')
  q._r = rethinkdbdash({
    host: q.host,
    port: q.port,
    db: q.db,
    silent: true
  })
  q.ready = dbAssert(q).then(() => {
    if (q.changeFeed) {
      return q.r.db(q.db).table(q.name).changes().run().then((changeFeed) => {
        q._changeFeedCursor = changeFeed
        q._changeFeedCursor.each((err, change) => {
          return queueChange(q, err, change)
        })
      })
    }
    q._changeFeedCursor = false
    return null
  }).then(() => {
    if (q.master) {
      logger('Queue is a master')
      return dbReview.enable(q)
    }
    return null
  }).then(() => {
    logger(`Event: ready [${q.id}]`)
    q.emit(enums.status.ready, q.id)
    return true
  })
  return q.ready
}

module.exports.detach = function dbDetach (q, drainPool) {
  logger('detach')
  return Promise.resolve().then(() => {
    if (q._changeFeedCursor) {
      let feed = q._changeFeedCursor
      q._changeFeedCursor = false
      logger('closing changeFeed')
      return feed.close()
    }
    return null
  }).then(() => {
    if (q.master) {
      logger('disabling dbReview')
      return dbReview.disable(q)
    }
    return null
  }).then(() => {
    if (drainPool) {
      q.ready = false
      logger('draining connection pool')
      return q.r.getPoolMaster().drain()
    }
    return null
  }).then(() => {
    if (drainPool) {
      logger(`Event: detached [${q.id}]`)
      q.emit(enums.status.detached, q.id)
    }
    return null
  })
}
