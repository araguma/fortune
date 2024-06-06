import chalk, { ChalkInstance } from 'chalk'
import { basename } from 'node:path'

import { getCaller } from '@/libs/caller'
import { getEnvironmentVariable } from '@/libs/env'
import format from '@/libs/format'

const DEBUG = getEnvironmentVariable('DEBUG') === 'true'

function success(...messages: unknown[]) {
    base(chalk.bgGreenBright, chalk.greenBright, ...messages)
}

function info(...messages: unknown[]) {
    base(chalk.bgWhiteBright, chalk.whiteBright, ...messages)
}

function warn(...messages: unknown[]) {
    base(chalk.bgYellowBright, chalk.yellowBright, ...messages)
}

function error(...messages: unknown[]) {
    base(chalk.bgRedBright, chalk.redBright, ...messages)
}

function debug(...messages: unknown[]) {
    if (DEBUG) base(chalk.bgMagentaBright, chalk.magentaBright, ...messages)
}

let lastFilename = ''
function base(background: ChalkInstance, foreground: ChalkInstance, ...messages: unknown[]) {
    const filename = basename(getCaller(3) ?? 'unknown', '.ts')
    const abbreviation = format.abbreviation(filename)
    const date = new Date().toISOString()
    if (filename !== lastFilename) console.log()
    lastFilename = filename
    process.stdout.write(`${background.black.bold(` ${abbreviation} `)}${foreground(` > [${date}]`)} `)
    console.log(...messages)
}

const log = {
    success,
    info,
    warn,
    error,
    debug,
}

export default log
