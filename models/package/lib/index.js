'use strict';
const log = require('@dev-cli/log')
const path = require('path')
const { isObject } = require('@dev-cli/utils')
const pkgDir = require('pkg-dir').sync
const npminstall = require('npminstall')
const { getDetaultRegistry } = require('@dev-cli/get-npm-info')

class Package {
    constructor(options) {
        if (!options) throw new Error('Package 类的 options 参数不能为空')
        else if (!isObject(options)) throw new Error('Package 类的 options 参数必须是一个对象')
        this.targetPath = options.targetPath
        log.verbose('targetPath', options.targetPath)
        this.packageName = options.packageName
        this.packageVersion = options.packageVersion
        this.storeDir = options.storeDir
    }

    exits() {

    }

    install() {
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

    update() {

    }

    // 获取入口文件路径
    getRootFilePath() {
        // 获取package.json文件的路径
        const dir = pkgDir(this.targetPath)
        if(dir){
            console.log('dir ', dir)
            // 读取package.json require()
            const pkg = require(path.join(dir, 'package.json'))
            if (pkg && pkg.main) {
                return path.resolve(dir, pkg.main || pkg.lib)
            }
        }
    }
}
module.exports = Package