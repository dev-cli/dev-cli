const Command = require('@dev-cli/command')
const log = require('@dev-cli/log')
const fs = require('fs')

class InitCommand extends Command {
    init() {
        this.projectName = this._argv[0] || ''
        this.force = !!this._argv[1].force
        console.log('init')
        log.verbose('project name', this.projectName)
    }
    exec() {
        try {
            this.prepare()
        } catch (e) {
            log.error(e.message)
        }
    }
    prepare() {
        // 判断当前目录是否为空
        if (!this.isDirIsEmpty()) {

        } else {

        }
    }
    isDirIsEmpty() {
        const localPath = process.cwd()
        console.log(localPath)
        const fileList = fs.readdirSync(localPath).filter(file => !(file.startsWith('.') && ['node_modules'].indexOf(file)))
        return fileList.length === 0
    }
}

function init(argv) {
    console.log('init')
    return new InitCommand(argv)
}
module.exports = init
module.exports.InitCommand = InitCommand
