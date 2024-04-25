import { filterCrypto, filterStocks } from '@/libs/filter'
import {
    ActivesResponse,
    CryptoSnapshotsResponse,
    HistoricalBarsResponse,
    MoversResponse,
    NewsResponse,
    StockClockResponse,
    StockSnapshotsResponse,
} from '@/types'

const paperBaseUrl = 'https://paper-api.alpaca.markets'
const marketBaseUrl = 'https://data.alpaca.markets'

export class Alpaca {
    headers: Headers

    constructor(key: string, secret: string) {
        this.headers = new Headers({
            'APCA-API-KEY-ID': key,
            'APCA-API-SECRET-KEY': secret,
            'accept': 'application/json',
        })
    }

    async getClock() {
        const url = new URL(`${paperBaseUrl}/v2/clock`)
        const response = (await (
            await fetch(url, {
                headers: this.headers,
            })
        ).json()) as StockClockResponse
        return response
    }

    async getSnapshots<A extends string[]>(symbols: A) {
        const stockUrl = new URL(`${marketBaseUrl}/v2/stocks/snapshots`)
        stockUrl.searchParams.append('symbols', filterStocks(symbols).join(','))
        stockUrl.searchParams.append('feed', 'iex')
        const stockResponse = (await (
            await fetch(stockUrl, {
                headers: this.headers,
            })
        ).json()) as StockSnapshotsResponse<A[number]>

        const cryptoUrl = new URL(
            `${marketBaseUrl}/v1beta3/crypto/us/snapshots`,
        )
        cryptoUrl.searchParams.append(
            'symbols',
            filterCrypto(symbols).join(','),
        )
        const cryptoResponse = (await (
            await fetch(cryptoUrl, {
                headers: this.headers,
            })
        ).json()) as CryptoSnapshotsResponse<A[number]>

        return {
            ...stockResponse,
            ...cryptoResponse.snapshots,
        }
    }

    async getHistory<A extends string[]>(
        symbols: A,
        timeframe: string,
        start: Date,
        end: Date,
    ) {
        const stockUrl = new URL(`${marketBaseUrl}/v2/stocks/bars`)
        stockUrl.searchParams.append('symbols', filterStocks(symbols).join(','))
        stockUrl.searchParams.append('timeframe', timeframe)
        stockUrl.searchParams.append('start', start.toISOString())
        stockUrl.searchParams.append('end', end.toISOString())
        stockUrl.searchParams.append('feed', 'iex')
        stockUrl.searchParams.append('limit', '1000')
        const stockResponse = (await (
            await fetch(stockUrl, {
                headers: this.headers,
            })
        ).json()) as HistoricalBarsResponse<A[number]>

        const cryptoUrl = new URL(`${marketBaseUrl}/v1beta3/crypto/us/bars`)
        cryptoUrl.searchParams.append(
            'symbols',
            filterCrypto(symbols).join(','),
        )
        cryptoUrl.searchParams.append('timeframe', timeframe)
        cryptoUrl.searchParams.append('start', start.toISOString())
        cryptoUrl.searchParams.append('end', end.toISOString())
        cryptoUrl.searchParams.append('limit', '1000')
        const cryptoResponse = (await (
            await fetch(cryptoUrl, {
                headers: this.headers,
            })
        ).json()) as HistoricalBarsResponse<A[number]>

        return {
            ...stockResponse.bars,
            ...cryptoResponse.bars,
        }
    }

    async getActives(top: number, sortBy: string) {
        const url = new URL(
            `${marketBaseUrl}/v1beta1/screener/stocks/most-actives`,
        )
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
        const url = new URL(`${marketBaseUrl}/v1beta1/screener/stocks/movers`)
        url.searchParams.append('top', top.toString())
        const response = (await (
            await fetch(url, {
                headers: this.headers,
            })
        ).json()) as MoversResponse
        return response
    }

    async getNews(symbols: string[], start: Date, end: Date) {
        const url = new URL(`${marketBaseUrl}/v1beta1/news`)
        url.searchParams.append('symbols', symbols.join(','))
        url.searchParams.append('start', start.toISOString())
        url.searchParams.append('end', end.toISOString())
        url.searchParams.append('sort', 'desc')
        url.searchParams.append('limit', '5')
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
