import { InteractionReplyOptions } from 'discord.js'

import divider from '@/images/divider'
import { UserError } from '@/libs/error'
import format from '@/libs/format'
import { SnapshotsResponse, Stock } from '@/types'

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
        public snapshots: SnapshotsResponse<string>,
        public stocks: Stock[],
        public transactionId: string,
    ) {}

    toJSON(): InteractionReplyOptions {
        const description = this.stocks
            .map((stock) => {
                const snapshot = this.snapshots[stock.symbol]
                if (!snapshot) UserError.throw('Failed to get snapshot')
                const quote = snapshot.latestTrade?.p || NaN
                const total = stock.shares * quote
                return [
                    format.bold(stock.symbol),
                    stock.shares,
                    '⋅',
                    format.currency(quote),
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
                                const snapshot = this.snapshots[stock.symbol]
                                if (!snapshot)
                                    UserError.throw('Failed to get snapshot')
                                const quote = snapshot.latestTrade?.p || NaN
                                return stock.shares * quote
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
