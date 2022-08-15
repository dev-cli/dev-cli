const semver = require('semver')
const colors = require('colors')
const log = require('@dev-cli/log')
const { isArray } = require('@dev-cli/utils')
const LOWEST_NODE_VERSION = '14.15.0'

class Command {
    constructor(argv) {
        if (!argv) {
            throw new Error('参数不能为空')
        }
        if (!isArray(argv)) {
            throw new Error('参数必须是一个数组')
        }
       
        if (!argv.length) throw new Error('参数数组不能为空')
        this._argv = argv
        // console.log(argv)
        let runner = new Promise((resolve) => {
            let chain = Promise.resolve()
            chain
                .then(() => this.checkNodeVersion())
                .then(() => this.initArgs())
                .then(() => this.init())
                .then(() => this.exec())
                .catch(err => {
                    // console.log(err)
                    log.error(err.message)
                })
        })

    }
    init() {
        throw new Error('init 必须实现')
    }
    exec() {
        throw new Error('exec 必须实现')
    }
    checkNodeVersion() {
        const currentVersion = process.version
        if (!semver.gte(currentVersion, LOWEST_NODE_VERSION)) {
            throw new Error(colors.red(`dev-cli 需要安装 v${LOWEST_NODE_VERSION} 以上版本的 Node.js`))
        }
    }
    initArgs(){
        this._cmd = this._argv[this._argv.length - 1]
        this._argv = this._argv.slice(0, this._argv.length -1)
    }
}
module.exports = Command;
