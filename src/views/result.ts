import { Color } from '@/enums'
import divider from '@/libs/canvas/divider'
import { getEnvironmentVariable } from '@/libs/env'
import format from '@/libs/format'
import Reply from '@/libs/reply'

const FIELD_LINE_LIMIT = parseInt(getEnvironmentVariable('FIELD_LINE_LIMIT'))

export default class ResultReply extends Reply<ResultReplyData> {
    constructor(data: ResultReplyData) {
        super()
        this.update(data)
    }

    update({ winners }: ResultReplyData) {
        winners.sort((a, b) => b.amount - a.amount)
        winners.slice(0, FIELD_LINE_LIMIT)

        const padding = winners.length.toString().length

        this.setColor(Color.Blue)
        this.setAuthor({ name: '---' })
        this.setTitle('Prediction Settled')
        this.setFields(
            {
                name: 'User',
                value:
                    winners
                        .map((entry, index) => {
                            const rank = (index + 1).toString().padStart(padding, ' ')
                            return `\`${rank}\`<@${entry.userId}>`
                        })
                        .join('\n') || '> *None*',
                inline: true,
            },
            {
                name: 'Amount',
                value: winners.map((entry) => `\`${format.value(entry.amount)}\``).join('\n') || '> *None*',
                inline: true,
            },
        )
        this.setCanvas(divider())
        this.setTimestamp()
    }
}

export type ResultReplyData = {
    winners: { userId: string; amount: number }[]
}
