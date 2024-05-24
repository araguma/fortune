import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'

import { Color } from '@/enums'
import divider from '@/libs/canvas/divider'
import format from '@/libs/format'
import Reply from '@/libs/reply'
import Tag from '@/libs/tag'
import { PredictionType } from '@/models/prediction'

const variant = {
    opened: {
        status: 'Opened',
        color: Color.Blue,
    },
    closed: {
        status: 'Closed',
        color: Color.Purple,
    },
    settled: {
        status: 'Settled',
        color: Color.Black,
    },
} as const

export class PredictionReply extends Reply<PredictionReplyData> {
    public constructor(data: PredictionReplyData) {
        super()
        this.update(data)
    }

    public override update({ predictionId, prediction }: PredictionReplyData) {
        const total = prediction.pool.reduce((a, b) => a + b, 0)

        this.setCanvas(divider())
        this.setTimestamp()
        this.setColor(variant[prediction.status].color)
        this.setAuthor({ name: '---' })
        this.setTitle('Prediction Poll')
        this.setDescription(
            [
                `**${prediction.prompt}**\n`,
                ...prediction.options.map((option, index) => {
                    const pool = prediction.pool[index] ?? 0
                    const decimal = pool / total
                    return [
                        `> ${index + 1}) **${option}**`,
                        `> ${'I'.repeat(decimal * 64)}[${format.percentage(decimal)}]`,
                        `> ${format.value(pool)}\n`,
                    ].join('\n')
                }),
            ].join('\n'),
        )
        this.setFields(
            {
                name: 'Minimum',
                value: format.value(prediction.minimum),
                inline: true,
            },
            {
                name: 'Bets',
                value: prediction.bets.size.toString(),
                inline: true,
            },
            {
                name: 'Total',
                value: format.value(total),
                inline: true,
            },
            {
                name: 'Status',
                value: variant[prediction.status].status,
                inline: true,
            },
            {
                name: 'Options',
                value: prediction.options.length.toString(),
                inline: true,
            },
            {
                name: 'Result',
                value: format.string(prediction.options[prediction.result]),
                inline: true,
            },
        ).setFooter({
            text: predictionId.toUpperCase(),
        })

        switch (prediction.status) {
            case 'opened': {
                const closeButton = new ButtonBuilder()
                    .setCustomId(
                        new Tag()
                            .setCommand('prediction')
                            .setAction('close')
                            .setData('predictionId', predictionId)
                            .toCustomId(),
                    )
                    .setLabel('Close')
                    .setStyle(ButtonStyle.Secondary)
                const predictButton = new ButtonBuilder()
                    .setCustomId(
                        new Tag()
                            .setCommand('prediction')
                            .setAction('predict')
                            .setData('predictionId', predictionId)
                            .toCustomId(),
                    )
                    .setLabel('Predict')
                    .setStyle(ButtonStyle.Primary)
                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    closeButton,
                    predictButton,
                )
                this.setComponents([row])
                break
            }
            case 'closed': {
                const settleButton = new ButtonBuilder()
                    .setCustomId(
                        new Tag()
                            .setCommand('prediction')
                            .setAction('settle')
                            .setData('predictionId', predictionId)
                            .toCustomId(),
                    )
                    .setLabel('Settle')
                    .setStyle(ButtonStyle.Secondary)
                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    settleButton,
                )
                this.setComponents([row])
                break
            }
        }
    }
}

export type PredictionReplyData = {
    predictionId: string
    prediction: PredictionType
}
