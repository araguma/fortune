import { InteractionReplyOptions } from 'discord.js'

import divider from '@/images/divider'
import { UserError } from '@/libs/error'
import format from '@/libs/format'
import { SnapshotsResponse, Stock } from '@/types'

export class TransactionReply {
    constructor(
        public type: 'buy' | 'sell',
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
            color: 0x3498db,
            author: {
                name: this.type === 'buy' ? '>>>' : '<<<',
            },
            title: this.type === 'buy' ? 'Buy Receipt' : 'Sell Receipt',
            description: description || '> *No stocks found*',
            fields: [
                {
                    name: 'Stocks',
                    value: this.stocks.length.toString(),
                    inline: true,
                },
                {
                    name: 'Shares',
                    value: this.stocks
                        .map((stock) => stock.shares)
                        .reduce((a, b) => a + b, 0)
                        .toString(),
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
