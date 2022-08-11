'use strict';

module.exports = exec;
const Package = require('@dev-cli/package')
const log = require('@dev-cli/log')
const path = require('path')

const SETTINGS = {
    init: '@dev-cli/init'
}
const CACHE_DIR = 'dependencies'
async function exec() {
    const cmdObj = arguments[arguments.length - 1]
    let targetPath = process.env.CLI_TARGET_PATH
    const packageName = SETTINGS[cmdObj.name()]
    const homePath = process.env.CLI_HOME_PATH
    let pkg
    let storeDir = ''
    const packageVersion = 'latest'
    if (!targetPath) {

        targetPath = path.resolve(homePath, CACHE_DIR)
        storeDir = path.resolve(targetPath, 'node_modules')
        pkg = new Package({
            targetPath,
            packageName,
            packageVersion,
            storeDir
        })
        if (await pkg.exits()) {
            // 更新package
            console.log('update')
            pkg.update()
        } else {
            await pkg.install()
        }

    } else {
        pkg = new Package({
            targetPath,
            packageName,
            packageVersion
        })
        console.log(pkg.exits())

    }
    const rootFile = pkg.getRootFilePath()
    log.verbose('rootFile ', rootFile)
    // require(rootFile).apply(this, arguments)
    // log.verbose('pkg', pkg)

}
