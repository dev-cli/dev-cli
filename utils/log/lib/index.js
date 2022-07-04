'use strict';
const log = require('npmlog')
// log.level 表示日志级别，低于该数字级别不显示
log.level = process.env.LOG_LEVEL ? process.LOG_LEVEL : 'info'
// 每行开头打印的标题
log.heading="dev-cli"
log.addLevel('success', 2000, { fg: 'green', bold: true })
module.exports = log
