#! /usr/bin/env node
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const dedent = require('dedent')
// const argv = hideBin(process.argv)
const cli = yargs()
const pkg = require('../package.json')

cli
    .usage("Usage: <command> [options]")
    .demandCommand(1, "A command is required. Pass --help to see all available commands and options.")
    .alias('h', 'help')
    .alias('v', 'version')
    .wrap(cli.terminalWidth())
    .epilogue(dedent`aaa
  aaa
`)
    // .options({
    //     debug:{
    //         type: 'boolean',
    //         describe: 'Boostrap debug mode',
    //         alias: 'd'
    //     }
    // })
    .option('debug', {
        type: 'boolean',
        describe: 'Boostrap debug mode',
        alias: 'd'
    })
    .group(['d'], 'dev')
    .command('init [name]', 'Do init a project', yargs => {
        yargs.option('name', {
            type: 'string',
            describe: 'Name of project',
            alias: 'n'
        })
    }, argv => {
        console.log(argv)
    })
    .command({
        command: 'list',
        aliases: ['ls', 'la', 'll'],
        describe: 'List local package',
        builder: yargs=>{

        },
        handler:argv =>{
            console.log(argv)
        }
    })
    .recommendCommands()
    .fail(err=>{
        console.log(err)
    })
    .parse(process.argv.slice(2), {
        devVersion: '1.0.0'
    })
    // .argv
