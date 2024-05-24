import currencies from '@/data/currencies'
import UserError from '@/errors/user'
import { getEnvironmentVariable } from '@/libs/env'
import log from '@/libs/log'

const BASE_CURRENCY = getEnvironmentVariable('BASE_CURRENCY')
const EXCHANGE_UPDATE_INTERVAL = parseInt(
    getEnvironmentVariable('EXCHANGE_UPDATE_INTERVAL'),
)

const baseUrl = 'https://openexchangerates.org/api'

export class Exchange {
    public rates: Record<string, number> = {}

    public constructor(private appId: string) {
        const update = () => {
            void this.updateRates().then((response) => {
                log.success(
                    `Fetched ${Object.keys(response.rates).length} exchange rates`,
                )
            })
        }
        setInterval(update, EXCHANGE_UPDATE_INTERVAL)
        update()
    }

    public async updateRates() {
        const url = new URL(`${baseUrl}/latest.json`)
        url.searchParams.append('app_id', this.appId)
        url.searchParams.append('base', BASE_CURRENCY)
        url.searchParams.append('show_alternative', 'true')
        const response = (await fetch(url).then((response) =>
            response.json(),
        )) as OpenExchangeResponse
        this.rates = response.rates
        return response
    }

    public convert(from: string, to: string, amount: number) {
        const fromRate = this.rates[from]
        const toRate = this.rates[to]
        if (!fromRate) UserError.invalid('currency', from)
        if (!toRate) UserError.invalid('currency', to)
        return (amount / fromRate) * toRate
    }
}

const exchange = new Exchange(
    getEnvironmentVariable('OPEN_EXCHANGE_RATE_APP_ID'),
)

export default exchange

export type Currency = (typeof currencies)[number]

export type OpenExchangeResponse = {
    disclaimer: string
    license: string
    timestamp: number
    base: string
    rates: Record<Currency, number>
}
