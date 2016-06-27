const test = require('tape')
const Promise = require('bluebird')
const testError = require('./test-error')
const moment = require('moment')
const testQueue = require('./test-queue')
const enums = require('../src/enums')
const jobFailed = require('../src/job-failed')
const testData = require('./test-options').testData

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('job-failed test', (t) => {
      t.plan(61)

      const q = testQueue()
      const job = q.createJob(testData)
      let failedEventCount = 0
      q.on(enums.queueStatus.failed, function failed (jobId) {
        failedEventCount++
        t.equal(jobId, job.id, `Event: Job failed [${failedEventCount}]`)
        if (failedEventCount >= 3) {
          q.removeListener(enums.queueStatus.failed, failed)
        }
      })

      q.addJob(job).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')
        t.pass('Job failure - original')
        return jobFailed(null, savedJob[0], testData)
      }).then((retry1) => {
        t.equal(retry1[0].status, enums.jobStatus.retry, 'Job status is retry')
        t.equal(retry1[0].retryCount, 1, 'Job retryCount is 1')
        t.equal(retry1[0].progress, 0, 'Job progress is 0')
        t.equal(retry1[0].queueId, q.id, 'Job queueId is valid')
        t.ok(moment.isDate(retry1[0].dateFailed), 'Job dateFailed is a date')
        t.equal(retry1[0].log.length, 1, 'Job has 1 log entry')
        t.ok(moment.isDate(retry1[0].log[0].date), 'Log date is a date')
        t.equal(retry1[0].log[0].queueId, q.id, 'Log queueId is valid')
        t.equal(retry1[0].log[0].type, enums.log.error, 'Log type is error')
        t.equal(retry1[0].log[0].status, enums.jobStatus.retry, 'Log status is retry')
        t.ok(retry1[0].log[0].message.startsWith(enums.message.failed), 'Log message is correct')
        t.ok(retry1[0].log[0].duration >= 0, 'Log duration is >= 0')
        t.equal(retry1[0].log[0].data, job.data, 'Log data is valid')
        t.pass('Job failure - first retry')
        return jobFailed(null, retry1[0], testData)
      }).then((retry2) => {
        t.equal(retry2[0].status, enums.jobStatus.retry, 'Job status is retry')
        t.equal(retry2[0].retryCount, 2, 'Job retryCount is 2')
        t.equal(retry2[0].progress, 0, 'Job progress is 0')
        t.equal(retry2[0].queueId, q.id, 'Job queueId is valid')
        t.ok(moment.isDate(retry2[0].dateFailed), 'Job dateFailed is a date')
        t.equal(retry2[0].log.length, 2, 'Job has 2 log entries')
        t.ok(moment.isDate(retry2[0].log[1].date), 'Log date is a date')
        t.equal(retry2[0].log[1].queueId, q.id, 'Log queueId is valid')
        t.equal(retry2[0].log[1].type, enums.log.error, 'Log type is error')
        t.equal(retry2[0].log[1].status, enums.jobStatus.retry, 'Log status is retry')
        t.ok(retry2[0].log[1].message.startsWith(enums.message.failed), 'Log message is correct')
        t.ok(retry2[0].log[1].duration >= 0, 'Log duration is >= 0')
        t.equal(retry2[0].log[1].data, job.data, 'Log data is valid')
        t.pass('Job failure - second retry')
        return jobFailed(null, retry2[0], testData)
      }).then((retry3) => {
        t.equal(retry3[0].status, enums.jobStatus.retry, 'Job status is retry')
        t.equal(retry3[0].retryCount, 3, 'Job retryCount is 3')
        t.equal(retry3[0].progress, 0, 'Job progress is 0')
        t.equal(retry3[0].queueId, q.id, 'Job queueId is valid')
        t.ok(moment.isDate(retry3[0].dateFailed), 'Job dateFailed is a date')
        t.equal(retry3[0].log.length, 3, 'Job has 3 log entries')
        t.ok(moment.isDate(retry3[0].log[2].date), 'Log date is a date')
        t.equal(retry3[0].log[2].queueId, q.id, 'Log queueId is valid')
        t.equal(retry3[0].log[2].type, enums.log.error, 'Log type is error')
        t.equal(retry3[0].log[2].status, enums.jobStatus.retry, 'Log status is retry')
        t.ok(retry3[0].log[2].message.startsWith(enums.message.failed), 'Log message is correct')
        t.ok(retry3[0].log[2].duration >= 0, 'Log duration is >= 0')
        t.equal(retry3[0].log[2].data, job.data, 'Log data is valid')
        t.pass('Job failure - third retry')
        return jobFailed(null, retry3[0], testData)
      }).then((failed) => {
        t.equal(failed[0].status, enums.jobStatus.failed, 'Job status is failed')
        t.equal(failed[0].retryCount, 3, 'Job retryCount is 3')
        t.equal(failed[0].progress, 0, 'Job progress is 0')
        t.equal(failed[0].queueId, q.id, 'Job queueId is valid')
        t.ok(moment.isDate(failed[0].dateFailed), 'Job dateFailed is a date')
        t.equal(failed[0].log.length, 4, 'Job has 4 log entries')
        t.ok(moment.isDate(failed[0].log[3].date), 'Log date is a date')
        t.equal(failed[0].log[3].queueId, q.id, 'Log queueId is valid')
        t.equal(failed[0].log[3].type, enums.log.error, 'Log type is error')
        t.equal(failed[0].log[3].status, enums.jobStatus.failed, 'Log status is failed')
        t.ok(failed[0].log[3].message.startsWith(enums.message.failed), 'Log message is correct')
        t.ok(failed[0].log[3].duration >= 0, 'Log duration is >= 0')
        t.equal(failed[0].log[3].data, job.data, 'Log data is valid')
        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
