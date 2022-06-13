'use strict';
const semver = require('semver')
const colors = require('colors')
const pkg = require('../package.json')
const log = require('@dev-cli/log')
const constant = require('./const')
function core() {
    // TODO
    try{
        checkPkgVersion()
        checkNodeVersion()
        checkRoot()
    }catch(e){
        log.error(e.message)
    }
    
}
function checkPkgVersion() {
    log.notice('dev-cli', pkg.version)
}
function checkNodeVersion() {
    const currentVersion = process.version
    if(!semver.gte(currentVersion, constant.LOWEST_NODE_VERSION)){
        throw new Error(colors.red(`dev-cli 需要安装 v${constant.LOWEST_NODE_VERSION} 以上版本的 Node.js`))
    }
}
function checkRoot() {
    const rootCheck = require('root-check')
    rootCheck()

    // console.log(process.geteuid())
}
module.exports = core;
