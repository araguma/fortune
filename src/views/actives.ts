import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js'

import { Color } from '@/enums'
import divider from '@/libs/canvas/divider'
import format from '@/libs/format'
import Reply from '@/libs/reply'
import Tag from '@/libs/tag'
import { AlpacaActive } from '@/services/alpaca'

export class ActivesReply extends Reply<ActivesReplyData> {
    public constructor(data: ActivesReplyData) {
        super()
        this.update(data)
    }

    public override update({ userId, by, actives }: ActivesReplyData) {
        const viewSelect = new StringSelectMenuBuilder()
            .setCustomId(new Tag().setCommand('actives').setAction('view').setData('userId', userId).toCustomId())
            .setPlaceholder('View symbol')
            .addOptions(
                actives.map((active) => ({
                    label: active.symbol,
                    value: active.symbol,
                })),
            )
        const updateButton = new ButtonBuilder()
            .setCustomId(
                new Tag()
                    .setCommand('actives')
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
        if (actives.length > 0) rows.push(row1)
        rows.push(row2)

        this.setColor(Color.Blue)
        this.setAuthor({ name: '---' })
        this.setTitle(`Active Stocks by ${format.capitalize(by)}`)
        this.setFields(
            {
                name: 'Symbol',
                value: actives.map((active) => active.symbol).join('\n'),
                inline: true,
            },
            {
                name: 'Trades',
                value: actives.map((active) => active.trade_count).join('\n'),
                inline: true,
            },
            {
                name: 'Volume',
                value: actives.map((active) => active.volume).join('\n'),
                inline: true,
            },
        )
        this.setCanvas(divider())
        this.setComponents(rows)
    }
}

export type ActivesReplyData = {
    userId: string
    by: 'volume' | 'trades'
    actives: AlpacaActive[]
}
