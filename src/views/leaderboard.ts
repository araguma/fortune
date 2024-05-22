import { Color } from '@/enums'
import divider from '@/libs/canvas/divider'
import { getEnvironmentVariable } from '@/libs/env'
import format from '@/libs/format'
import Reply from '@/libs/reply'

const FIELD_LINE_LIMIT = parseInt(getEnvironmentVariable('FIELD_LINE_LIMIT'))

export class LeaderboardReply extends Reply<LeaderboardReplyData> {
    public constructor(data: LeaderboardReplyData) {
        super()
        this.update(data)
    }

    public override update({ metric, type, entries }: LeaderboardReplyData) {
        const formatter = type === 'number' ? format.number : format.value

        metric = format.capitalize(metric)
        entries.sort((a, b) => b.metric - a.metric)
        entries = entries.slice(0, FIELD_LINE_LIMIT)

        const padding = entries.length.toString().length

        this.setColor(Color.Blue)
        this.setAuthor({ name: '---' })
        this.setTitle(`${metric} Leaderboard`)
        this.setFields(
            {
                name: 'User',
                value: entries
                    .map((entry, index) => {
                        const rank = (index + 1)
                            .toString()
                            .padStart(padding, ' ')
                        return `\`${rank}\`<@${entry.userId}>`
                    })
                    .join('\n'),
                inline: true,
            },
            {
                name: format.capitalize(metric),
                value: entries
                    .map((entry) => `\`${formatter(entry.metric)}\``)
                    .join('\n'),
                inline: true,
            },
        )
        this.setCanvas(divider())
        this.setTimestamp()
    }
}

export type LeaderboardReplyData = {
    metric: string
    type: 'number' | 'value'
    entries: {
        userId: string
        metric: number
    }[]
}
