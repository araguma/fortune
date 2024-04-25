import yahooFinance from 'yahoo-finance2'
import { Quote } from 'yahoo-finance2/dist/esm/src/modules/quote'

async function getQuotes(symbols: string[]) {
    const quotes: Record<string, Quote> = {}
    await Promise.all(
        symbols.map(async (symbol) => {
            symbol = symbol.toUpperCase()
            const quote = await yahooFinance.quoteCombine(symbol)
            quotes[symbol] = quote
        }),
    )
    return quotes
}

function getPrice(quote: Quote) {
    let price: number | undefined = undefined
    switch (quote.marketState) {
        case 'REGULAR': {
            price = quote.regularMarketPrice
            break
        }
        case 'PRE': {
            price = quote.preMarketPrice
            break
        }
        case 'POST': {
            price = quote.postMarketPrice
            break
        }
    }
    return price ?? NaN
}

const yahoo = {
    getQuotes,
    getPrice,
}

export default yahoo
