import { InteractionReplyOptions } from 'discord.js'

import divider from '@/images/divider'
import { UserError } from '@/libs/error'
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
                const quote = snapshot.latestTrade.p
                const total = stock.shares * quote
                return `**${stock.symbol}** ${stock.shares} ⋅ $${quote} ▸ $${total.toFixed(2)}`
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
                    value: '$' + this.stocks
                        .map((stock) => {
                            const snapshot = this.snapshots[stock.symbol]
                            if (!snapshot)
                                UserError.throw('Failed to get snapshot')
                            return stock.shares * snapshot.latestTrade.p
                        })
                        .reduce((a, b) => a + b, 0)
                        .toFixed(2),
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
