const Command = require('@dev-cli/command')
const log = require('@dev-cli/log')
const Package = require('@dev-cli/package')
const fs = require('fs')
const path = require('path')
const { homedir } = require('os')
const inquirer = require('inquirer')
const fse = require('fs-extra')
const semver = require('semver')
const { getTemplate } = require('./getTemplate')
const { TYPE_PROJECT, TYPE_COMPONENT } = require('./const')

class InitCommand extends Command {
    init() {
        this.projectName = this._argv[0] || ''
        this.force = !!this._argv[1].force
        log.verbose('project name', this.projectName)
        log.verbose('force', this.force)
    }
    async exec() {
        try {
            const projeftInfo = await this.prepare()
            if (projeftInfo) {
                this.projeftInfo = projeftInfo
                await this.downloadTemplate()
                console.log('projeftInfo', projeftInfo)
                log.verbose('projeftInfo', projeftInfo)
            }
        } catch (e) {
            log.error(e.message)
        }
    }
    async downloadTemplate() {
        const templateInfo = this.templates.find(item => item.packageName === this.projeftInfo.template)
        if (!templateInfo) return
        const homePath = homedir()
        console.log(homePath)
        const targetPath = path.resolve(homePath, '.dev-cli', 'template')
        const storeDir = path.resolve(homePath, '.dev-cli', 'template', 'node_modules')

        const templatePackage = new Package({
            targetPath,
            storeDir,
            packageName: templateInfo.packageName,
            packageVersion: templateInfo.version
        })
        console.log(templatePackage)
        if (!await templatePackage.exits()) {
            await templatePackage.install()
        } else {
            await templatePackage.update()
        }
    }
    async prepare() {
        console.log('获取模版')
        const templates = await getTemplate()
        if (!templates.length) {
            return log.error('模版不存在')
        }
        this.templates = templates
        // 判断当前目录是否为空
        if (!this.isDirIsEmpty()) {
            // 没有传递 
            if (!this.force) {
                const { ifContinue } = (await inquirer.prompt({
                    type: 'confirm',
                    name: 'ifContinue',
                    default: false,
                    message: '当前文件夹不为空，是否继续创建项目?'
                }))
                if (!ifContinue) return false
            }

            // 清空当前文件目录
            //  当传入  --force 时，即使不清空目录，也要继续往下执行
            const { confirmDelete } = await inquirer.prompt({
                type: 'confirm',
                name: 'confirmDelete',
                default: false,
                message: '继续会删除该文件夹下的内容'
            })
            if (!this.force && !confirmDelete) return false

            // 清空目录
            if (confirmDelete) fse.emptyDirSync(process.cwd())
        }
        return this.getProjectInfo()
    }
    templateChoices() {
        return this.templates.map(item => ({
            value: item.packageName,
            name: item.name
        }))
    }
    async getProjectInfo() {
        // 选择创建项目或组件
        const { type } = await inquirer.prompt({
            type: 'list',
            message: '请选择初始化类型',
            default: TYPE_PROJECT,
            name: 'type',
            choices: [{
                name: '项目',
                value: TYPE_PROJECT
            }, {
                name: '组件',
                value: TYPE_COMPONENT
            }]
        })
        if (type === TYPE_PROJECT) {
            const o = await inquirer.prompt(
                [{
                    type: 'input',
                    name: 'projectName',
                    message: '请输入项目名称',
                    default: '',
                    validate: function (v) {
                        const done = this.async()
                        // 以字母开头
                        const reg = /^[a-zA-Z]+[\w-]*[a-zA-Z0-9]$/
                        if (!reg.test(v)) {
                            done('请输入合法的项目名称')
                            return
                        }
                        done(null, true)
                    },
                    filter: function (v) {
                        return v
                    }
                }, {
                    type: 'input',
                    name: 'projectVersion',
                    message: '请输入项目版本号',
                    default: '1.0.0',
                    validate: function (v) {
                        const done = this.async()
                        if (!semver.valid(v)) {
                            done('请输入合法的项目版本号')
                            return
                        }
                        done(null, true)
                    },
                    filter: function (v) {
                        if (semver.valid(v)) {
                            return semver.valid(v)
                        } else {
                            return v
                        }
                    }
                }, {
                    type: 'list',
                    name: 'template',
                    message: '请选择项目模板',
                    choices: this.templateChoices()
                }
                ])
            return o
        } else if (type === TYPE_COMPONENT) {

        }
    }
    isDirIsEmpty() {
        const localPath = process.cwd()
        const fileList = fs.readdirSync(localPath).filter(file => !(file.startsWith('.') && ['node_modules'].indexOf(file)))
        return fileList.length === 0
    }
}

function init(argv) {
    return new InitCommand(argv)
}
module.exports = init
module.exports.InitCommand = InitCommand
