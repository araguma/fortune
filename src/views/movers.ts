import { StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js'

import { Color } from '@/enums'
import divider from '@/libs/canvas/divider'
import format from '@/libs/format'
import Reply from '@/libs/reply'
import Tag from '@/libs/tag'
import { AlpacaMover } from '@/services/alpaca'

const variant = {
    gainers: {
        color: Color.Green,
        sign: '▴',
    },
    losers: {
        color: Color.Red,
        sign: '▾',
    },
}

export class MoversReply extends Reply<MoversReplyData> {
    public constructor(data: MoversReplyData) {
        super()
        this.update(data)
    }

    public override update({ userId, by, movers }: MoversReplyData) {
        const { color, sign } = variant[by]

        const viewSelect = new StringSelectMenuBuilder()
            .setCustomId(new Tag().setCommand('movers').setAction('view').setData('userId', userId).toCustomId())
            .setPlaceholder('View symbol')
            .addOptions(
                movers.map((mover) => ({
                    label: mover.symbol,
                    value: mover.symbol,
                })),
            )
        const updateButton = new ButtonBuilder()
            .setCustomId(
                new Tag()
                    .setCommand('movers')
                    .setAction('update')
                    .setData('by', by)
                    .setData('userId', userId)
                    .toCustomId(),
            )
            .setLabel('Update')
            .setStyle(ButtonStyle.Secondary)
        const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(viewSelect)
        const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(updateButton)

        const rows: ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[] = []
        if (movers.length > 0) rows.push(row1)
        rows.push(row2)

        this.setColor(color)
        this.setAuthor({ name: '---' })
        this.setTitle(`Top ${format.capitalize(by)}`)
        this.setDescription(
            movers
                .map((mover) => {
                    return [
                        sign,
                        format.symbol(mover.symbol),
                        format.value(mover.price),
                        `(${mover.percent_change}%)`,
                    ].join(' ')
                })
                .join('\n'),
        )
        this.setCanvas(divider())
        this.setTimestamp(new Date())
        this.setComponents(rows)
    }
}

export type MoversReplyData = {
    userId: string
    by: 'gainers' | 'losers'
    movers: AlpacaMover[]
}
