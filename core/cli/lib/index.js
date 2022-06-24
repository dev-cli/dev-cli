const semver = require('semver')
const colors = require('colors')
const { homedir } = require('os')
const pathExists = require('path-exists')
const log = require('@dev-cli/log')
const path = require('path')
const pkg = require('../package.json')
const constant = require('./const')

let args
let userHome
let config
async function core() {
    try {
        checkPkgVersion()
        checkNodeVersion()
        checkRoot()
        checkUserHome()
        checkInputArgs()
        checkEvn()
        await checkGlobalUpdate()
        registerCommand()
    } catch (e) {
        log.error(e.message)
    }
}
function checkPkgVersion() {
    log.notice('dev-cli', pkg.version)
}
function checkNodeVersion() {
    const currentVersion = process.version
    if (!semver.gte(currentVersion, constant.LOWEST_NODE_VERSION)) {
        throw new Error(colors.red(`dev-cli 需要安装 v${constant.LOWEST_NODE_VERSION} 以上版本的 Node.js`))
    }
}
function checkRoot() {
    const rootCheck = require('root-check')
    rootCheck()
}
async function checkUserHome() {
    // 拿到用户主目录
    userHome = homedir()
    // 判断用户主目录是否存在
    if (!userHome || !await pathExists(userHome)) {
        throw new Error(colors.red('当前用户主目录不存在'))
    }
}

function checkInputArgs() {
    const minimist = require('minimist')
    args = minimist(process.argv.slice(2))
    checkArgs()
}
function checkArgs() {
    if (args.debug) {
        process.env.LOG_LEVER = 'verbose'
    } else {
        process.env.LOG_LEVER = 'info'
    }
    log.level = process.env.LOG_LEVER
}

async function checkEvn() {
    const dotenv = require('dotenv')
    const dotenvPath = path.resolve(userHome, '.env')
    if (await pathExists(dotenvPath)) {
        dotenv.config({
            path: dotenvPath
        })
    }
    config = createDefaultConfig()

    log.verbose('环境变量', config)
}

function createDefaultConfig() {
    const cliConfig = {
        home: userHome
    }
    if (process.env.CLI_HOME) {
        cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME)
    } else {
        cliConfig['cliHome'] = path.join(userHome, constant.DEFAULT_CLI_HOME)
    }
    process.env.CLI_HOME_PATH = cliConfig.cliHome
    return cliConfig
}

async function checkGlobalUpdate() {
    const currentVersion = pkg.version
    const pkgName = pkg.name
    const { getSemverVersion } = require('@dev-cli/get-npm-info')
    const lastVersion = await getSemverVersion(pkgName, currentVersion)
    if (lastVersion && semver.gt(lastVersion, currentVersion)) {
        log.warn(colors.yellow(`请手动更新 ${pkgName}, 当前版本是: ${currentVersion}, 最新版本是: ${lastVersion}, 更新命令：npm install -g ${pkgName}`))
    }
}

function registerCommand() {
    const { Command } = require('commander')
    const program = new Command()
    program
        .name('dev')
        .usage('<command> [options]')
        .option('-d, --debug', '是否开启调试模式', false)
        .option('-e, --env <envName>', '获取环境变量名称')
        .version(pkg.version, '-V, --version', '获取当前版本号')
        .helpOption('-h, --help', '获取帮助信息')

    program.command('clone <source> [destination]')
        .description('克隆一个仓库')
        .option('-f, --force', '是否强制克隆')
        .action((source, destination, cloneOpt) => {
            console.log('do clone')
            console.log(source, destination, c, cloneOpt)
        })


    const service = new Command('service')
    service.command('start [port]')
        .description('根据 port 启动服务')
        .action(port => {
            console.log(`service start at http://localhost:${port || 8080}`)
        })
    service.command('stop', '停止服务')
        // .description('停止服务')
        .action(() => {
            console.log('停止服务 ')
        })
    program.addCommand(service)

    program.command('install [name]', 'install package', {
        // executableFile: 'dev1-install',
        // isDefault: true,
        // hidden: true
    })
        .alias('i')

    program
        .argument('<command>', 'command to run')
        .argument('[option]', 'options for command')
        .action((cmd, env) => {
            console.log(cmd, env)
        })
    program.parse()
    // console.log(program.opts())
}
module.exports = core;
