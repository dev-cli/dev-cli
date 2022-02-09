# 脚手架
## 脚手架开发入门
### 开始
创建项目,在package.json文件中指定bin(指定脚手架的入口文件)
```json
{
  "bin": {
    "dev-test": "bin/index.js"
  }
}
```
边写脚手架入口文件
```js
#! /usr/bin/env node
// cli文件开头必须这样写
// 如果是Linux或macOS系统还需要修改此文件的读写权限为755，具体就是通过 chmod 755 index.js 实现修改

console.log('dev test')
```     
然后执行
```bash
npm link
# or
yarn link
```
在控制台输入
```bash
dev-test
```
在控制台就会看都
```
dev test
```
### 导入其他本地库
创建一个新项目
```bash
mkdir dev-test-lib
npm init -y
npm link
```
在dev-test安装库
```bash
npm link dev-test-lib
# 删除
npm unlink dev-test-lib
```
## 脚手架框架搭建
### 原生脚手架开发的痛点
* 多package，重复操作
  * 依赖安装
  * 单元测试
  * 本地link
  * 代码提交
  * 代码发布
* 版本一致性
  * 发布时代码一致性
  * 发布后相互版本依赖升级

package越多，管理复杂度越高
### lerna
[Lerna](https://github.com/lerna/lerna)是一款基于git + npm 的多 package 项目的管理工具
* 大幅度减少重复操作
* 提升操作的标准化

lerna的常用操作
```bash
# 创建package
lerna create core
# 安装依赖到所有package
lerna add @dev-cli/utils
# 删除所有package依赖
lerna clean
# 安装依赖到指定package
lerna add @dev-cli/utils packages/core
# 重装所有依赖
lerna bootstrap
# 链接依赖
lerna link
# 执行所有package的shell命令 
lerna exec -- <command> [..args]
# 执行所有package的命令
lerna run <command>
```
[lerna](https://github.com/lerna/lerna)的文档地址 https://github.com/lerna/lerna
## vscode 调试
### 单文件调试
打开当前js文件，F5即可调试
### 项目调试
`Ctrl + Shift + P`,选择`DEBUG:Toggle Auto Attach`，一般选择智能即可
