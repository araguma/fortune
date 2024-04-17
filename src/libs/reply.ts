import { InteractionReplyOptions } from 'discord.js'

import divider from '@/images/divider'
import { UserError } from '@/libs/error'
import format from '@/libs/format'
import { Prediction } from '@/models/prediction'
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
                                return stock.shares * snapshot.latestTrade.p
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

export class PredictionReply {
    status: Prediction['status'] = 'opened'
    bets = 0
    pool: number[] = []

    constructor(
        public id: string,
        public question: string,
        public options: string[],
    ) {}

    toJSON(): InteractionReplyOptions {
        const pool = this.pool.reduce((a, b) => a + b, 0)
        const embed = {
            color: 0x3498db,
            author: {
                name: '---',
            },
            title: 'Prediction Poll',
            description: [
                `**${this.question}**\n`,
                ...this.options.map((option, index) => {
                    const percentage =
                        pool === 0 ? 0 : (this.pool[index] ?? 0) / pool
                    return `> ${index + 1}. ${option}\n> ${'>'.repeat(percentage * 32)}[${format.percentage(percentage)}]\n`
                }),
                this.status === 'opened'
                    ? 'Use **/predict** to place your bets'
                    : '',
            ].join('\n'),
            fields: [
                {
                    name: 'Status',
                    value:
                        this.status.charAt(0).toUpperCase() +
                        this.status.slice(1),
                    inline: true,
                },
                {
                    name: 'Bets',
                    value: this.bets.toString(),
                    inline: true,
                },
                {
                    name: 'Pool',
                    value: format.currency(pool),
                    inline: true,
                },
            ],
            image: {
                url: 'attachment://divider.png',
            },
            footer: {
                text: this.id,
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
