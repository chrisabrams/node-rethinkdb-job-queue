const logger = require('./logger')(module)
const enums = require('./enums')
const dbResult = require('./db-result')

module.exports = function queueReset (q) {
  logger('reset')
  return q.r.db(q.db)
  .table(q.name)
  .delete()
  .run()
  .then((resetResult) => {
    return dbResult.status(q, resetResult, enums.dbResult.deleted)
  }).then((totalRemoved) => {
    q.emit(enums.status.reset, totalRemoved)
    return totalRemoved
  })
}
