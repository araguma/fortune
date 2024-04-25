import { InteractionReplyOptions } from 'discord.js'
import { Quote } from 'yahoo-finance2/dist/esm/src/modules/quote'

import divider from '@/images/divider'
import { UserError } from '@/libs/error'
import format from '@/libs/format'
import yahoo from '@/libs/yahoo'
import { Stock } from '@/types'

const typeEmbedMap = {
    claim: {
        hint: '>>>',
        title: 'Claim Receipt',
    },
    buy: {
        hint: '>>>',
        title: 'Buy Receipt',
    },
    sell: {
        hint: '<<<',
        title: 'Sell Receipt',
    },
}

export class TransactionReply {
    constructor(
        public type: 'claim' | 'buy' | 'sell',
        public quotes: Record<string, Quote>,
        public stocks: Stock[],
        public transactionId: string,
    ) {}

    toJSON(): InteractionReplyOptions {
        const description = this.stocks
            .map((stock) => {
                const quote = this.quotes[stock.symbol]
                if (!quote) UserError.throw('Failed to get snapshot')
                const price = yahoo.getPrice(quote)
                const total = stock.shares * price
                return [
                    format.symbol(stock.symbol),
                    format.shares(stock.shares),
                    '⋅',
                    format.currency(price),
                    '▸',
                    format.currency(total),
                ].join(' ')
            })
            .join('\n')
        const embed = {
            color: this.type === 'claim' ? 0x2ecc71 : 0x3498db,
            author: {
                name: typeEmbedMap[this.type].hint,
            },
            title: typeEmbedMap[this.type].title,
            description:
                description.substring(0, 4096) || '> *No stocks found*',
            fields: [
                {
                    name: 'Stocks',
                    value: this.stocks.length.toString(),
                    inline: true,
                },
                {
                    name: 'Shares',
                    value: format.shares(
                        this.stocks
                            .map((stock) => stock.shares)
                            .reduce((a, b) => a + b, 0),
                    ),
                    inline: true,
                },
                {
                    name: 'Total',
                    value: format.currency(
                        this.stocks
                            .map((stock) => {
                                const quote = this.quotes[stock.symbol]
                                if (!quote)
                                    UserError.throw('Failed to get snapshot')
                                const price = yahoo.getPrice(quote)
                                return stock.shares * price
                            })
                            .reduce((a, b) => a + b, 0),
                    ),
                    inline: true,
                },
            ],
            image: {
                url: 'attachment://divider.png',
            },
            footer: {
                text: this.transactionId.toUpperCase(),
            },
            timestamp: new Date().toISOString(),
        }

        return {
            embeds: [embed],
            files: [
                {
                    attachment: divider(),
                    name: 'divider.png',
                },
            ],
        }
    }
}
