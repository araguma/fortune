import { MessageCreateOptions, MessageEditOptions } from 'discord.js'
import { HydratedDocument } from 'mongoose'

import divider from '@/images/divider'
import format from '@/libs/format'
import { Prediction } from '@/models/prediction'

export class PredictionReply {
    constructor(public prediction: HydratedDocument<Prediction>) {}

    toJSON(): MessageCreateOptions & MessageEditOptions {
        const pool = this.prediction.pool.reduce((a, b) => a + b, 0)
        const embed = {
            color: this.prediction.status === 'opened' ? 0x3498db : 0x9b59b6,
            author: {
                name: '---',
            },
            title: 'Prediction Poll',
            description: [
                `**${this.prediction.question}**\n`,
                ...this.prediction.options.map((option, index) => {
                    const percentage =
                        pool === 0
                            ? 0
                            : (this.prediction.pool[index] ?? 0) / pool
                    return [
                        `> ${index + 1}) ${option}`,
                        `> ${'I'.repeat(percentage * 64)}[${format.percentage(percentage)}]`,
                        `> ${format.currency(this.prediction.pool[index] ?? 0)}\n`,
                    ].join('\n')
                }),
                this.prediction.status === 'opened'
                    ? 'Use **/predict** to place your bets'
                    : '',
            ].join('\n'),
            fields: [
                {
                    name: 'Minimum',
                    value: format.currency(this.prediction.minimum),
                    inline: true,
                },
                {
                    name: 'Bets',
                    value: this.prediction.bets.size.toString(),
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
                text: this.prediction._id.toString().toUpperCase(),
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
