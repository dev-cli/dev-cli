const Command = require('@dev-cli/command')
const log = require('@dev-cli/log')
const Package = require('@dev-cli/package')
const fs = require('fs')
const path = require('path')
const { homedir } = require('os')
const inquirer = require('inquirer')
const fse = require('fs-extra')
const semver = require('semver')
const { spinnerStart, sleep } = require('@dev-cli/utils')
const { getTemplate } = require('./getTemplate')
const { TYPE_PROJECT, TYPE_COMPONENT } = require('./const')
const TYPE_NORMAL = 'normal'
const TYPE_CUSTOM = 'custom'
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
                log.verbose('projeftInfo', projeftInfo)
                await this.installTemplate()
            }
        } catch (e) {
            log.error(e.message)
        }
    }
    async installTemplate() {
        if (this.templateInfo) {
            if (!this.templateInfo.type) {
                this.templateInfo.type = TYPE_NORMAL
            }
            if (this.templateInfo.type === TYPE_NORMAL) {
                await this.installNormalTemplate()
            } else if (this.templateInfo.type === TYPE_CUSTOM) {
                await this.installCustomTemplate()
            } else {
                throw new Error('项目模板类型无法识别')
            }
        } else {
            throw new Error('项目模板不存在')
        }
    }
    async installNormalTemplate() {
        const spinner = spinnerStart('正在安装模板')
        try {
            const templatePath = this.templatePackage.cacheFilePath
            const targetPath = process.cwd()
            fse.ensureDirSync(templatePath)
            fse.ensureDirSync(targetPath)
            fse.copySync(templatePath, targetPath)
            spinner.stop(true)
            log.success('模板安装成功')
        } catch (e) {
            throw e
        }
        spinner.stop(true)
    }
    async installCustomTemplate() {
        console.log('安装自定义模板')

    }
    async downloadTemplate() {
        const templateInfo = this.templates.find(item => item.packageName === this.projeftInfo.template)
        if (!templateInfo) return
        this.templateInfo = templateInfo
        const homePath = homedir()
        const targetPath = path.resolve(homePath, '.dev-cli', 'template')
        const storeDir = path.resolve(homePath, '.dev-cli', 'template', 'node_modules')

        const templatePackage = new Package({
            targetPath,
            storeDir,
            packageName: templateInfo.packageName,
            packageVersion: templateInfo.version
        })
        this.templatePackage = templatePackage

        if (!await templatePackage.exits()) {
            const spinner = spinnerStart('正在下载模板')
            await sleep()
            await templatePackage.install()
            spinner.stop(true)
            if (await templatePackage.exits()) {
                // log.success('模板下载完成')
                log.success('模板下载完成')
            }
        } else {
            const spinner = spinnerStart('正在更新模板')
            await sleep()
            await templatePackage.update()
            spinner.stop(true)
            if (await templatePackage.exits()) {
                // log.success('模板下载完成')
                log.success('模板更新完成')
            }
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
