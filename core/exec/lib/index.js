
const Package = require('@dev-cli/package')
const log = require('@dev-cli/log')
const path = require('path')
const cp = require('child_process');

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
            await pkg.update()
        } else {
            await pkg.install()
        }

    } else {
        pkg = new Package({
            targetPath,
            packageName,
            packageVersion
        })
        await pkg.exits()
    }
    const rootFile = pkg.getRootFilePath()
    log.verbose('rootFile ', rootFile)
    try {
        // require(rootFile).call(null, Array.from(arguments))
        const argv = Array.from(arguments)
        const o = Object.create(null)
        const cmd = argv[argv.length - 1]
        Object.keys(cmd).forEach(key => {
            if (cmd.hasOwnProperty(key) && !key.startsWith('_') && key !== 'parent') {
                o[key] = cmd[key]
            }
        })
        // console.log(o);

        argv[argv.length - 1] = o
        const code = `require('${rootFile}').call(null, ${JSON.stringify(argv)})`
        const child = cp.spawn('node', ['-e', code], {
            cwd: process.cwd(),
            stdio: 'inherit'
        })
        child.on('error', err => {
            log.error(err.message)
            process.exit(1)
        })
        child.on('exit', msg => {
            log.verbose('命令执行成功 ' + msg)
        })
        // child.stdout.on('data', chunk => {

        // })
        // child.stderr.on('data', chunk => {

        // })
    } catch (e) {
        log.error('rootFile ' + e.message)
    }
    // log.verbose('pkg', pkg)

}
module.exports = exec;