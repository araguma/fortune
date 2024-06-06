import { getEnvironmentVariable } from '@/libs/env'

const baseURL = 'https://data.alpaca.markets'

export class Alpaca {
    private headers: Headers

    public constructor(key: string, secret: string) {
        this.headers = new Headers({
            'APCA-API-KEY-ID': key,
            'APCA-API-SECRET-KEY': secret,
            'accept': 'application/json',
        })
    }

    public async getActives(top: number, by: 'trades' | 'volume') {
        const url = new URL(`${baseURL}/v1beta1/screener/stocks/most-actives`)
        url.searchParams.append('top', top.toString())
        url.searchParams.append('by', by.toLowerCase())
        const response = (await fetch(url, {
            headers: this.headers,
        }).then((response) => response.json())) as AlpacaActivesResponse
        return response.most_actives
    }

    public async getMovers(top: number, type: 'stocks' | 'crypto') {
        const url = new URL(`${baseURL}/v1beta1/screener/${type}/movers`)
        url.searchParams.append('top', top.toString())
        const response = (await fetch(url, {
            headers: this.headers,
        }).then((response) => response.json())) as AlpacaMoversResponse
        return response
    }

    public async getNews(symbols: string[], start: Date, end: Date, sort: 'asc' | 'desc', limit: number) {
        const url = new URL(`${baseURL}/v1beta1/news`)
        url.searchParams.append('symbols', symbols.join(','))
        url.searchParams.append('start', start.toISOString())
        url.searchParams.append('end', end.toISOString())
        url.searchParams.append('sort', sort)
        url.searchParams.append('limit', limit.toString())
        const response = (await fetch(url, {
            headers: this.headers,
        }).then((response) => response.json())) as AlpacaNewsResponse
        return response.news
    }
}

const alpaca = new Alpaca(getEnvironmentVariable('ALPACA_KEY'), getEnvironmentVariable('ALPACA_SECRET'))

export default alpaca

export type AlpacaActivesResponse = {
    most_actives: AlpacaActive[]
    last_updated: string
}
export type AlpacaActive = {
    symbol: string
    trade_count: number
    volume: number
}

export type AlpacaMoversResponse = {
    gainers: AlpacaMover[]
    losers: AlpacaMover[]
    market_type: 'stocks' | 'crypto'
    last_updated: string
}
export type AlpacaMover = {
    symbol: string
    price: number
    change: number
    percent_change: number
}

export type AlpacaNewsResponse = {
    news: AlpacaNews[]
    next_page_token: string | null
}
export type AlpacaNews = {
    author: string
    content: string
    created_at: string
    headline: string
    id: number
    images: {
        size: string
        url: string
    }[]
    source: string
    summary: string
    symbols: string[]
    updated_at: string
    url: string | null
}
