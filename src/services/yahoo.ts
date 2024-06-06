import yahooFinance from 'yahoo-finance2'
import { ChartOptions, ChartResultArray } from 'yahoo-finance2/dist/esm/src/modules/chart'
import { Quote as YahooQuote } from 'yahoo-finance2/dist/esm/src/modules/quote'

import UserError from '@/errors/user'
import { getEnvironmentVariable } from '@/libs/env'
import log from '@/libs/log'
import exchange from '@/services/exchange'

const BASE_CURRENCY = getEnvironmentVariable('BASE_CURRENCY')

const monetaryFields = [
    'regularMarketPrice',
    'preMarketPrice',
    'postMarketPrice',
    'regularMarketOpen',
    'regularMarketDayHigh',
    'regularMarketDayLow',
    'regularMarketVolume',
    'marketCap',
] as const

yahooFinance.setGlobalConfig({
    logger: {
        info: (...args: unknown[]) => {
            log.info(...args)
        },
        warn: (...args: unknown[]) => {
            log.error(...args)
        },
        error: (...args: unknown[]) => {
            log.error(...args)
        },
        debug: (...args: unknown[]) => {
            log.debug(...args)
        },
    },
})

async function getQuote(symbol: string) {
    symbol = symbol.toUpperCase()
    const quote = (await yahooFinance.quoteCombine(symbol)) as YahooQuote | undefined
    if (!quote) UserError.invalid('symbol', symbol)
    return parseQuote(quote)
}

async function getQuotes(symbols: string[]) {
    const quotes: Record<string, Quote> = {}
    await Promise.all(
        symbols.map(async (symbol) => {
            quotes[symbol] = await getQuote(symbol)
        }),
    )
    return quotes
}

async function getPrice(symbol: string) {
    const price = (await getQuote(symbol)).price
    if (!price) UserError.noPrice(symbol)
    return price
}

async function getChart(symbol: string, start: Date, end: Date, interval: NonNullable<ChartOptions['interval']>) {
    symbol = symbol.toUpperCase()
    const chart = (await yahooFinance.chart(symbol, {
        period1: start,
        period2: end,
        interval,
    })) as ChartResultArray | undefined
    if (!chart) UserError.invalid('symbol', symbol)
    return chart
}

function parseQuote(quote: YahooQuote): Quote {
    const currency = quote.currency ?? quote.financialCurrency
    if (!currency) UserError.noCurrency(quote.symbol)
    if (currency !== BASE_CURRENCY) {
        for (const field of monetaryFields) {
            const value = quote[field]
            if (!value) continue
            quote[field] = exchange.convert(currency, BASE_CURRENCY, value)
        }
    }

    const price =
        (() => {
            switch (quote.marketState) {
                case 'REGULAR': {
                    return quote.regularMarketPrice
                }
                case 'PRE': {
                    return quote.preMarketPrice
                }
                case 'PREPRE':
                case 'POSTPOST':
                case 'POST':
                case 'CLOSED': {
                    return quote.postMarketPrice
                }
            }
        })() ?? quote.regularMarketPrice

    return {
        ...quote,
        ...{
            currency,
            price,
        },
    }
}

const yahoo = {
    getQuote,
    getQuotes,
    getPrice,
    getChart: getChart,
}

export default yahoo

export type Quote = {
    symbol: string
    shortName?: string
    currency?: string | undefined
    price?: number | undefined
    regularMarketOpen?: number
    regularMarketDayHigh?: number
    regularMarketDayLow?: number
    priceToBook?: number
    regularMarketVolume?: number
    marketCap?: number
}
