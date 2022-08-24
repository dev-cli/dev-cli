const Command = require('@dev-cli/command')
const log = require('@dev-cli/log')
const Package = require('@dev-cli/package')
const fs = require('fs')
const path = require('path')
const { homedir } = require('os')
const inquirer = require('inquirer')
const fse = require('fs-extra')
const semver = require('semver')
const glob = require('glob')
const ejs = require('ejs')
const { spinnerStart, sleep, execAsync } = require('@dev-cli/utils')
const { getTemplate } = require('./getTemplate')
const { TYPE_PROJECT, TYPE_COMPONENT, TYPE_NORMAL, TYPE_CUSTOM } = require('./const')

const renameFiles = {
    _gitignore: '.gitignore'
}
class InitCommand extends Command {
    init() {
        this.projectName = this._argv[0] || ''
        this.force = !!this._argv[1].force
        log.verbose('project name', this.projectName)
        log.verbose('force', this.force)
    }
    async exec() {
        try {
            const projectInfo = await this.prepare()
            if (projectInfo) {
                this.projectInfo = projectInfo
                await this.downloadTemplate()
                log.verbose('projectInfo', projectInfo)
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
            const templatePath = this.templatePackage.cacheFilePath + '/template'
            const targetPath = process.cwd()
            fse.ensureDirSync(templatePath)
            fse.ensureDirSync(targetPath)
            fse.copySync(templatePath, targetPath)
            // 重命名 _gitignore等文件
            Object.keys(renameFiles).forEach(key => {
                const file = `${targetPath}/${key}`
                if (fse.existsSync(file)) {
                    fse.renameSync(file, `${targetPath}/${renameFiles[key]}`)
                }
            })
            // ejs渲染模板
            console.log('模板渲染')
            const templateIgnore = this.templateInfo.ignore?this.templateInfo.ignore:[]
            const ignore = ['node_modules/**', '**/*.png',...templateIgnore]
            log.verbose('ignore', ignore)
            await this.ejsRender({ ignore })
            log.success('模板安装成功')
        } catch (err) {
            // console.log(err)
            spinner.stop(true)
            throw err
        }
        spinner.stop(true)
        const { installCommand, startCommand } = this.templateInfo
        if (installCommand) {
            const cmds = installCommand.split(' ')
            const cmd = cmds[0]
            const args = cmds.slice(1)
            const ret = await execAsync(cmd, args)
            if (ret !== 0) {
                log.error('依赖安装失败')
            }
        }
        if (startCommand) {
            const cmds = startCommand.split(' ')
            const cmd = cmds[0]
            const args = cmds.slice(1)
            const ret = await execAsync(cmd, args)
            if (ret !== 0) {
                log.error('启动失败')
            }
        }

    }
    async installCustomTemplate() {
        console.log('安装自定义模板')

    }
    ejsRender({ ignore }) {
        return new Promise((resolve, reject) => {
            const dir = process.cwd()
            glob('**', {
                cwd: dir,
                ignore,
                nodir: true
            }, (err, files) => {
                if (err) reject(err)
                Promise.all(files.map(file => {
                    const filePath = path.resolve(dir, file)
                    return new Promise((resolve, reject) => {
                        ejs.renderFile(filePath, {
                            ...this.projectInfo
                        }, {}, (err, res) => {
                            if (err) reject(err)
                            else {
                                fse.writeFile(filePath, res, (err) => {
                                    if (err) reject(err)
                                    else resolve()
                                })
                            }
                        })
                    })
                })).then(resolve)
                    .catch(reject)
            })
        })
    }
    async downloadTemplate() {
        const templateInfo = this.templates.find(item => item.packageName === this.projectInfo.template)
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
        const title = type === TYPE_COMPONENT ? '组件': '项目'

        this.templates = this.templates.filter(template => {
            return template.tag.includes(type)
        })
        function isValidateNameFn(name) {
            if (!name) return false
            // 以字母开头
            const reg = /^[a-zA-Z]+[\w-]*[a-zA-Z0-9]$/
            return reg.test(name)
        }
        const isValidateName = isValidateNameFn(this.projectName)
        const projectPrompts = [
            {
                type: 'input',
                name: 'version',
                message: `请输入${title}版本号`,
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
                message: `请选择${title}模板`,
                choices: this.templateChoices()
            }
        ]
        const projectNamePrompt = {
            type: 'input',
            name: 'projectName',
            message:`请输入${title}名称`,
            default: '',
            validate: function (v) {
                const done = this.async()
                if (!isValidateNameFn(v)) {
                    done(`请输入合法的${title}名称`)
                    return
                }
                done(null, true)
            },
            filter: function (v) {
                return v
            }
        }
        if (!isValidateName) {
            projectPrompts.unshift(projectNamePrompt)
        }
        if (type === TYPE_PROJECT) {
         
        } else if (type === TYPE_COMPONENT) {
            const descriptionPrompt = {
                type: 'input',
                name: 'description',
                message: `请输入${title}描述信息`, 
                default: '',
                validate: function (v) {
                    const done = this.async()
                    if (!v) {
                        done('请输入组件描述信息')
                        return
                    }
                    done(null, true)
                },
            } 
            projectPrompts.push(descriptionPrompt)
        }
        const o = await inquirer.prompt(projectPrompts)

        const projectInfo = {
            type,
            projectName: isValidateName? this.projectName: null,
            ...o
        }
        if (projectInfo.projectName) {
            projectInfo.name = require('kebab-case')(projectInfo.projectName).replace(/^-/, '')
        }
        return projectInfo
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
