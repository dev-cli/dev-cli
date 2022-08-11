'use strict';
const log = require('@dev-cli/log')
const path = require('path')
const { isObject } = require('@dev-cli/utils')
const pkgDir = require('pkg-dir').sync
const npminstall = require('npminstall')
const { getDetaultRegistry, getSemverVersion } = require('@dev-cli/get-npm-info');
const pathExistsSync = require('path-exists').sync
const fse = require('fs-extra')
class Package {
    constructor(options) {
        console.log(options)
        if (!options) throw new Error('Package 类的 options 参数不能为空')
        else if (!isObject(options)) throw new Error('Package 类的 options 参数必须是一个对象')
        this.targetPath = options.targetPath
        log.verbose('targetPath', options.targetPath)
        this.packageName = options.packageName
        this.packageVersion = options.packageVersion
        this.storeDir = options.storeDir
        this.catcheFilePathPrefix = this.packageName.replace('/', '_')
    }


    async prepare() {
        // 创建目录
        if (this.storeDir && !pathExistsSync(this.storeDir)) {
            fse.mkdirp(this.storeDir)
        }
        if (this.packageVersion === 'latest') {
            const version = await getSemverVersion(this.packageName)
            this.packageVersion = this.latestVersion = version
        }
    }
    get cacheFilePath() {
        return path.resolve(this.storeDir, `_${this.catcheFilePathPrefix}@${this.packageVersion}@${this.packageName}`)
    }
    getSpecificCacheFilePath(version) {
        return path.resolve(this.storeDir, `_${this.catcheFilePathPrefix}@${version}@${this.packageName}`)
    }
    async install() {
        await this.prepare()
        return npminstall({
            root: this.targetPath,
            storeDir: this.storeDir,
            registry: getDetaultRegistry(),
            pkgs: [{
                name: this.packageName,
                version: this.packageVersion
            }]
        })
    }

    async update() {
        await this.prepare()
        if (!this.latestVersion) {
            this.latestVersion = await getSemverVersion(this.packageName)
        }
        const latestFilePath = this.getSpecificCacheFilePath(this.latestVersion)
        if (!pathExistsSync(latestFilePath)) {
            await npminstall({
                root: this.targetPath,
                storeDir: this.storeDir,
                registry: getDetaultRegistry(),
                pkgs: [{
                    name: this.packageName,
                    version: this.latestVersion
                }]
            })
            this.packageVersion = this.latestVersion
        } else {
            console.log('最新')
        }
    }

    async exits() {
        if (this.storeDir) {
            // targetPath 不存在
            await this.prepare()
            return pathExistsSync(this.cacheFilePath)
        } else {
            // targetPath 存在
            return pathExistsSync(this.targetPath)
        }
    }

    // 获取入口文件路径
    getRootFilePath() {
        // 获取package.json文件的路径
        function _getRootFilePath(targetPath) {
            const dir = pkgDir(targetPath)
            if (dir) {
                console.log('dir ', dir)
                // 读取package.json require()
                const pkg = require(path.join(dir, 'package.json'))
                if (pkg && pkg.main) {
                    return path.resolve(dir, pkg.main || pkg.lib)
                }
            }
        }
        if (this.storeDir) {
            return _getRootFilePath(this.cacheFilePath)
        } else {
            return _getRootFilePath(this.targetPath)
        }

    }
}
module.exports = Package