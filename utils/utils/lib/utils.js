'use strict';

function isObject(o) {
  return Object.prototype.toString.call(o) === '[object Object]'
}
function isArray(o) {
  return Array.isArray(o)
}
function spinnerStart(msg = 'processing', spinnerString = '|/-\\') {
  const Spinner = require('cli-spinner').Spinner
  const spinner = new Spinner(msg + '.. %s')
  spinner.setSpinnerString(spinnerString)
  spinner.start()
  return spinner
}
async function sleep(timeout = 1000) {
  return new Promise(resolve => setTimeout(resolve, timeout))
}
module.exports = {
  isObject,
  isArray,
  spinnerStart,
  sleep
};