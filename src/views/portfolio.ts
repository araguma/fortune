import {
    StringSelectMenuBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} from 'discord.js'

import { Color } from '@/enums'
import divider from '@/libs/canvas/divider'
import codec from '@/libs/codec'
import { getEnvironmentVariable } from '@/libs/env'
import format from '@/libs/format'
import Pagination from '@/libs/pagination'
import Reply from '@/libs/reply'
import Tag from '@/libs/tag'
import { ClientType } from '@/models/client'
import { Quote } from '@/services/yahoo'

const DESCRIPTION_LINE_LIMIT = parseInt(
    getEnvironmentVariable('DESCRIPTION_LINE_LIMIT'),
)
const padStart = DESCRIPTION_LINE_LIMIT.toString().length

export class PortfolioReply extends Reply<PortfolioReplyData> {
    public constructor(data: PortfolioReplyData) {
        super()
        this.update(data)
    }

    public override update({
        quotes,
        clientId,
        client,
        userIcon,
        page,
    }: PortfolioReplyData) {
        const { symbols, description, value, delta, maxDelta, minDelta } =
            Array.from(client.portfolio.entries()).reduce(
                (accumulator, [symbol, stock], index) => {
                    symbol = codec.decode(symbol)
                    const quote = quotes[symbol]
                    if (!quote) throw new Error(`No quote found for ${symbol}`)

                    const price = quote.price || NaN
                    const open = quote.regularMarketOpen || NaN
                    const value = stock.shares * price
                    const delta = stock.shares * (price - open)

                    const number = client.portfolio.size - index
                    const sign = delta >= 0 ? '▴' : '▾'
                    const description = [
                        `\`${number.toString().padStart(padStart)}\``,
                        sign,
                        format.symbol(symbol),
                        format.shares(stock.shares),
                        '⋅',
                        format.value(price),
                        '▸',
                        format.value(value),
                        `(${format.value(delta)})`,
                    ].join(' ')

                    accumulator.symbols.push(symbol)
                    accumulator.description.push(description)

                    return {
                        symbols: accumulator.symbols,
                        description: accumulator.description,
                        value: accumulator.value + value,
                        delta: accumulator.delta + delta,
                        maxDelta:
                            price > accumulator.maxDelta.delta
                                ? { symbol: quote.symbol, delta: delta }
                                : accumulator.maxDelta,
                        minDelta:
                            price < accumulator.minDelta.delta
                                ? { symbol: quote.symbol, delta: delta }
                                : accumulator.minDelta,
                    }
                },
                {
                    symbols: Array<string>(),
                    description: Array<string>(),
                    value: 0,
                    delta: 0,
                    maxDelta: {
                        symbol: '',
                        delta: -Infinity,
                    },
                    minDelta: {
                        symbol: '',
                        delta: Infinity,
                    },
                },
            )

        const pagination = new Pagination(
            description,
            DESCRIPTION_LINE_LIMIT,
            true,
        )
        pagination.setPage(page)

        const viewSelect = new StringSelectMenuBuilder()
            .setCustomId(
                new Tag()
                    .setCommand('portfolio')
                    .setAction('view')
                    .setData('clientId', clientId)
                    .toCustomId(),
            )
            .setPlaceholder('View symbol')
            .addOptions(
                symbols
                    .slice(pagination.getStart(), pagination.getEnd())
                    .map((symbol) => ({
                        label: symbol,
                        value: symbol,
                    })),
            )
        const pageSelect = new StringSelectMenuBuilder()
            .setCustomId(
                new Tag()
                    .setCommand('portfolio')
                    .setAction('page')
                    .setData('clientId', clientId)
                    .toCustomId(),
            )
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
                new Tag()
                    .setCommand('portfolio')
                    .setAction('update')
                    .setData('clientId', clientId)
                    .toCustomId(),
            )
            .setLabel('Update')
            .setStyle(ButtonStyle.Secondary)
        const row1 =
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                viewSelect,
            )
        const row2 =
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                pageSelect,
            )
        const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(
            updateButton,
        )

        const rows: ActionRowBuilder<
            StringSelectMenuBuilder | ButtonBuilder
        >[] = []
        if (pagination.getLength() >= 1) rows.push(row1)
        if (pagination.getPages() > 1) rows.push(row2)
        rows.push(row3)

        this.setAuthor({ name: '---' })
        this.setTitle('Portfolio')
        this.setCanvas(divider())
        this.setColor(
            delta > 0 ? Color.Green : delta < 0 ? Color.Red : Color.Yellow,
        )
        this.setDescription(pagination.getCurrent().join('\n') || 'None')
        this.setFields(
            {
                name: 'Value',
                value: format.value(value),
                inline: true,
            },
            {
                name: 'Balance',
                value: format.value(client.balance),
                inline: true,
            },
            {
                name: 'Total',
                value: format.value(value + client.balance),
                inline: true,
            },
            {
                name: 'Delta',
                value: format.value(delta),
                inline: true,
            },
            {
                name: 'Max Delta',
                value: format.valueSymbol(maxDelta.delta, maxDelta.symbol),
                inline: true,
            },
            {
                name: 'Min Delta',
                value: format.valueSymbol(minDelta.delta, minDelta.symbol),
                inline: true,
            },
            {
                name: 'Seed',
                value: format.value(client.seed),
                inline: true,
            },
            {
                name: 'Profit',
                value: format.value(value + client.balance - client.seed),
                inline: true,
            },
            {
                name: 'Page',
                value: `${pagination.getPage()} / ${pagination.getPages()}`,
                inline: true,
            },
        )
        this.setFooter({
            text: clientId.toUpperCase(),
            iconURL: userIcon,
        })
        this.setComponents(rows)
    }
}

export type PortfolioReplyData = {
    quotes: Record<string, Quote>
    clientId: string
    client: ClientType
    userIcon: string
    page: number
}
