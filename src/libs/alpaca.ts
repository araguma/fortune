import {
    ActivesResponse,
    HistoricalBarsResponse as HistoryResponse,
    MoversResponse,
    NewsResponse,
    SnapshotsResponse,
} from '@/types'

const baseUrl = 'https://data.alpaca.markets'

export class Alpaca {
    headers: Headers

    constructor(key: string, secret: string) {
        this.headers = new Headers({
            'APCA-API-KEY-ID': key,
            'APCA-API-SECRET-KEY': secret,
            'accept': 'application/json',
        })
    }

    async getSnapshots<A extends string[]>(symbols: A) {
        const url = new URL(`${baseUrl}/v2/stocks/snapshots`)
        url.searchParams.append('symbols', symbols.join(','))
        url.searchParams.append('feed', 'iex')
        const response = (await (
            await fetch(url, {
                headers: this.headers,
            })
        ).json()) as SnapshotsResponse<A[number]>
        return response
    }

    async getHistory<A extends string[]>(
        symbols: A,
        timeframe: string,
        start: Date,
        end: Date,
        limit: number,
    ) {
        const url = new URL(`${baseUrl}/v2/stocks/bars`)
        url.searchParams.append('symbols', symbols.join(','))
        url.searchParams.append('timeframe', timeframe)
        url.searchParams.append('start', start.toISOString())
        url.searchParams.append('end', end.toISOString())
        url.searchParams.append('feed', 'iex')
        url.searchParams.append('limit', limit.toString())
        const response = (await (
            await fetch(url, {
                headers: this.headers,
            })
        ).json()) as HistoryResponse<A[number]>
        return response.bars
    }

    async getActives(top: number, sortBy: string) {
        const url = new URL(`${baseUrl}/v1beta1/screener/stocks/most-actives`)
        url.searchParams.append('top', top.toString())
        url.searchParams.append('by', sortBy.toLowerCase())
        const response = (await (
            await fetch(url, {
                headers: this.headers,
            })
        ).json()) as ActivesResponse
        return response.most_actives
    }

    async getMovers(top: number) {
        const url = new URL(`${baseUrl}/v1beta1/screener/stocks/movers`)
        url.searchParams.append('top', top.toString())
        const response = (await (
            await fetch(url, {
                headers: this.headers,
            })
        ).json()) as MoversResponse
        return response
    }

    async getNews(symbols: string[], start: Date, end: Date, limit: number) {
        const url = new URL(`${baseUrl}/v1beta1/news`)
        url.searchParams.append('symbols', symbols.join(','))
        url.searchParams.append('start', start.toISOString())
        url.searchParams.append('end', end.toISOString())
        url.searchParams.append('sort', 'desc')
        url.searchParams.append('limit', limit.toString())
        const response = (await (
            await fetch(url, {
                headers: this.headers,
            })
        ).json()) as NewsResponse
        return response.news
    }
}

if (!process.env['ALPACA_KEY']) throw new Error('ALPACA_KEY not set')
if (!process.env['ALPACA_SECRET']) throw new Error('ALPACA_SECRET not set')

const alpaca = new Alpaca(
    process.env['ALPACA_KEY'],
    process.env['ALPACA_SECRET'],
)

export default alpaca
