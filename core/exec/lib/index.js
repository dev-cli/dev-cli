'use strict';

module.exports = exec;
const Package = require('@dev-cli/package')

const SETTINGS = {
    init: '@dev-cli/init'
}

function exec(a, b) {
    // const opts = this.opts()
    const cmdObj = arguments[arguments.length - 1]
    let targetPath = process.env.CLI_TARGET_PATH
    const packageName = SETTINGS[cmdObj.name()]
    console.log(packageName)
    if (!targetPath) {
        targetPath = ''
    }
    const packageVersion = 'latest'
    const pkg = new Package({
        targetPath,
        packageName,
        packageVersion
    })
    console.log(pkg.getRootFilePath())
    console.log(pkg)
}
