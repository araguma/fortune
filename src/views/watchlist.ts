import { Color } from '@/enums'
import divider from '@/libs/canvas/divider'
import format from '@/libs/format'
import Reply from '@/libs/reply'
import { ClientType } from '@/models/client'
import { Quote } from '@/services/yahoo'

export class WatchlistReply extends Reply<WatchlistReplyData> {
    constructor(data: WatchlistReplyData) {
        super()
        this.update(data)
    }

    update({ quotes, clientId, client, userIcon }: WatchlistReplyData) {
        const description = client.watchlist.map((symbol) => {
            const quote = quotes[symbol]
            if (!quote) throw new Error(`No quote found for ${symbol}`)
            const price = quote.price || NaN
            const open = quote.regularMarketOpen || NaN
            return [
                price - open >= 0 ? '▴' : '▾',
                format.symbol(symbol),
                format.value(price),
                `(${format.percentage((price - open) / open)})`,
            ].join(' ')
        })

        this.setColor(Color.Blue)
        this.setAuthor({ name: '---' })
        this.setTitle('Watchlist')
        this.setDescription(description.join('\n'))
        this.setCanvas(divider())
        this.setFooter({
            text: clientId.toUpperCase(),
            iconURL: userIcon,
        })
    }
}

export type WatchlistReplyData = {
    quotes: Record<string, Quote>
    clientId: string
    client: ClientType
    userIcon: string
}
