import { getEnvironmentVariable } from '@/libs/env'

const BASE_CURRENCY = getEnvironmentVariable('BASE_CURRENCY')

function number(number: number | undefined) {
    if (number === undefined || isNaN(number)) return 'N/A'
    return number.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 5,
    })
}

function string(text: string | undefined) {
    return text ? text : 'N/A'
}

function capitalize(text: string | undefined) {
    if (!text) return 'N/A'
    return text.charAt(0).toUpperCase() + text.slice(1)
}

function symbol(symbol: string | undefined) {
    return symbol ? `**${symbol}**` : 'N/A'
}

function shares(shares: number | undefined) {
    if (shares === undefined || isNaN(shares)) return 'N/A'
    return parseFloat(shares.toFixed(5)).toString()
}

function value(amount: number | undefined) {
    if (amount === undefined || isNaN(amount)) return 'N/A'
    if (Math.abs(amount) === Infinity) amount = 0
    return amount.toLocaleString('en-US', {
        style: 'currency',
        currency: BASE_CURRENCY,
        minimumFractionDigits: 0,
        maximumFractionDigits: 5,
    })
}

function percentage(decimal: number | undefined) {
    if (decimal === undefined || isNaN(decimal)) return 'N/A'
    if (Math.abs(decimal) === Infinity) decimal = 0
    return decimal.toLocaleString('en-US', {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })
}

function abbreviation(text: string | undefined) {
    if (!text) return 'N/A'
    return text.slice(0, 3).toUpperCase()
}

function stockName(shortName: string | undefined, symbol: string | undefined) {
    if (!symbol && !shortName) return 'N/A'
    if (!shortName && symbol) return symbol
    if (!symbol && shortName) return shortName
    return `${shortName} (${symbol})`
}

function valueSymbol(delta: number | undefined, symbol: string | undefined) {
    return `${value(delta)} (${format.symbol(symbol)})`
}

const format = {
    number,
    string,
    capitalize,
    symbol,
    shares,
    value,
    percentage,
    abbreviation,
    stockName,
    valueSymbol,
}

export default format
