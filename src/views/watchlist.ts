import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js'

import { Color } from '@/enums'
import divider from '@/libs/canvas/divider'
import { getEnvironmentVariable } from '@/libs/env'
import format from '@/libs/format'
import Pagination from '@/libs/pagination'
import Reply from '@/libs/reply'
import Tag from '@/libs/tag'
import { ClientType } from '@/models/client'
import { Quote } from '@/services/yahoo'

const DESCRIPTION_LINE_LIMIT = parseInt(getEnvironmentVariable('DESCRIPTION_LINE_LIMIT'))

export class WatchlistReply extends Reply<WatchlistReplyData> {
    constructor(data: WatchlistReplyData) {
        super()
        this.update(data)
    }

    update({ quotes, clientId, client, userIcon, page }: WatchlistReplyData) {
        const { description, minDelta, maxDelta } = client.watchlist.reduce(
            (accumulator, symbol) => {
                const quote = quotes[symbol]
                if (!quote) throw new Error(`No quote found for ${symbol}`)
                const price = quote.price || NaN
                const open = quote.regularMarketOpen || NaN
                const delta = price - open

                accumulator.description.push(
                    [
                        delta >= 0 ? '▴' : '▾',
                        format.symbol(symbol),
                        format.value(price),
                        `(${format.percentage(delta / open)})`,
                    ].join(' '),
                )
                accumulator.minDelta =
                    delta < accumulator.minDelta.delta ? { symbol: quote.symbol, delta: delta } : accumulator.minDelta
                accumulator.maxDelta =
                    delta > accumulator.maxDelta.delta ? { symbol: quote.symbol, delta: delta } : accumulator.maxDelta

                return accumulator
            },
            {
                description: Array<string>(),
                minDelta: {
                    symbol: '',
                    delta: Infinity,
                },
                maxDelta: {
                    symbol: '',
                    delta: -Infinity,
                },
            },
        )

        const pagination = new Pagination(description, DESCRIPTION_LINE_LIMIT, true)
        pagination.setPage(page)

        const viewSelect = new StringSelectMenuBuilder()
            .setCustomId(new Tag().setCommand('portfolio').setAction('view').setData('clientId', clientId).toCustomId())
            .setPlaceholder('View symbol')
            .addOptions(
                client.watchlist.slice(pagination.getStart(), pagination.getEnd()).map((symbol) => ({
                    label: symbol,
                    value: symbol,
                })),
            )
        const pageSelect = new StringSelectMenuBuilder()
            .setCustomId(new Tag().setCommand('watchlist').setAction('page').setData('clientId', clientId).toCustomId())
            .setPlaceholder('Select page')
            .addOptions(
                Array(pagination.getPages())
                    .fill(0)
                    .map((_, index) => ({
                        label: (index + 1).toString(),
                        value: (index + 1).toString(),
                    })),
            )
        const updateButton = new ButtonBuilder()
            .setCustomId(
                new Tag().setCommand('watchlist').setAction('update').setData('clientId', clientId).toCustomId(),
            )
            .setLabel('Update')
            .setStyle(ButtonStyle.Secondary)
        const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(viewSelect)
        const row2 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(pageSelect)
        const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(updateButton)

        const rows: ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[] = []
        if (pagination.getLength() >= 1) rows.push(row1)
        if (pagination.getPages() > 1) rows.push(row2)
        rows.push(row3)

        this.setColor(Color.Blue)
        this.setAuthor({ name: '---' })
        this.setTitle('Watchlist')
        this.setDescription(pagination.getCurrent().join('\n') || '> *No stocks found*')
        this.setFields(
            {
                name: 'Min Delta',
                value: format.valueSymbol(minDelta.delta, minDelta.symbol),
                inline: true,
            },
            {
                name: 'Max Delta',
                value: format.valueSymbol(maxDelta.delta, maxDelta.symbol),
                inline: true,
            },
            {
                name: 'Page',
                value: `${pagination.getPage()} / ${pagination.getPages()}`,
                inline: true,
            },
        )
        this.setCanvas(divider())
        this.setFooter({
            text: clientId.toUpperCase(),
            iconURL: userIcon,
        })
        this.setComponents(rows)
    }
}

export type WatchlistReplyData = {
    quotes: Record<string, Quote>
    clientId: string
    client: ClientType
    userIcon: string
    page: number
}
