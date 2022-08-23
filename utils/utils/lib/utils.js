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
function exec(cmd, args = [], options = {}) {
  console.log(cmd,args)
  return require('child_process').spawn(cmd, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    ...options
  })
}
function execAsync(cmd, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = exec(cmd, args, options)
    child.on('exit', (res) => {
      resolve(res)
    })
    child.on('error', err => {
      reject(err)
      // process.exit(1)
    })
  })
}
module.exports = {
  isObject,
  isArray,
  spinnerStart,
  sleep,
  exec,
  execAsync
};