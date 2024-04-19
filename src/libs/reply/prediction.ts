import { InteractionReplyOptions } from 'discord.js'

import divider from '@/images/divider'
import format from '@/libs/format'
import { Prediction } from '@/models/prediction'

export class PredictionReply {
    status: Prediction['status'] = 'opened'
    bets = 0
    pool: number[] = []

    constructor(
        public id: string,
        public question: string,
        public options: string[],
        public minimum: number,
    ) {}

    toJSON(): InteractionReplyOptions {
        const pool = this.pool.reduce((a, b) => a + b, 0)
        const embed = {
            color: this.status === 'opened' ? 0x3498db : 0x9b59b6,
            author: {
                name: '---',
            },
            title: 'Prediction Poll',
            description: [
                `**${this.question}**\n`,
                ...this.options.map((option, index) => {
                    const percentage =
                        pool === 0 ? 0 : (this.pool[index] ?? 0) / pool
                    return [
                        `> ${index + 1}) ${option}`,
                        `> ${'I'.repeat(percentage * 64)}[${format.percentage(percentage)}]`,
                        `> ${format.currency(this.pool[index] ?? 0)}\n`,
                    ].join('\n')
                }),
                this.status === 'opened'
                    ? 'Use **/predict** to place your bets'
                    : '',
            ].join('\n'),
            fields: [
                {
                    name: 'Minimum',
                    value: format.currency(this.minimum),
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
