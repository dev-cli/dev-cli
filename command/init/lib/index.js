const Command = require('@dev-cli/command')

class InitCommand extends Command {
    init() {
        this.projectName = this._argv[0] || ''
        this.force = !!this._argv[1].force
        console.log(this.projectName)
        console.log(this.force)
    }
    exec() {

    }
}

function init(argv) {
    console.log('init')
    return new InitCommand(argv)
}
module.exports = init
module.exports.InitCommand = InitCommand
