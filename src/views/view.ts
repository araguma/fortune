import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
} from 'discord.js'
import { ChartResultArray } from 'yahoo-finance2/dist/esm/src/modules/chart'

import { Color } from '@/enums'
import graph from '@/libs/canvas/graph'
import codec from '@/libs/codec'
import format from '@/libs/format'
import Reply from '@/libs/reply'
import Tag from '@/libs/tag'
import { ClientType } from '@/models/client'
import { Quote } from '@/services/yahoo'

export const timeframes = {
    '1D': {
        duration: 1,
        interval: '2m',
    },
    '7D': {
        duration: 7,
        interval: '15m',
    },
    '1M': {
        duration: 30,
        interval: '1h',
    },
    '6M': {
        duration: 180,
        interval: '1d',
    },
    '1Y': {
        duration: 365,
        interval: '1d',
    },
    '5Y': {
        duration: 365 * 5,
        interval: '5d',
    },
} as const

export class ViewReply extends Reply<ViewReplyData> {
    public constructor(data: ViewReplyData) {
        super()
        this.update(data)
    }

    public override update({
        quote,
        chart,
        timeframe,
        client,
        userIcon,
    }: ViewReplyData) {
        const price = quote.price ?? NaN
        const open = quote.regularMarketOpen ?? NaN

        const delta = price - open
        const color =
            delta > 0 ? Color.Green : delta < 0 ? Color.Red : Color.Yellow
        const sign = delta >= 0 ? '▴' : '▾'

        const key = codec.encode(quote.symbol)
        const stock = client.portfolio.get(key)
        const seed = stock?.seed ?? 0
        const shares = stock?.shares ?? 0

        const timeframeSelect = new StringSelectMenuBuilder()
            .setCustomId(
                new Tag()
                    .setCommand('view')
                    .setAction('timeframe')
                    .setData('symbol', quote.symbol)
                    .setData('userId', client.userId)
                    .toCustomId(),
            )
            .setPlaceholder('Select timeframe')
            .addOptions(
                Object.keys(timeframes).map((timeframe) => ({
                    label: timeframe,
                    value: timeframe,
                })),
            )
        const updateButton = new ButtonBuilder()
            .setCustomId(
                new Tag()
                    .setCommand('view')
                    .setAction('update')
                    .setData('symbol', quote.symbol)
                    .setData('timeframe', timeframe)
                    .setData('userId', client.userId)
                    .toCustomId(),
            )
            .setLabel('Update')
            .setStyle(ButtonStyle.Secondary)
        const row1 =
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                timeframeSelect,
            )
        const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
            updateButton,
        )

        this.setAuthor({ name: '---' })
        this.setColor(color)
        this.setTitle(format.stockName(quote.shortName, quote.symbol))
        this.setURL(`https://finance.yahoo.com/quote/${quote.symbol}`)
        this.setDescription(
            [
                '#',
                format.value(price),
                '\n',
                sign,
                format.value(Math.abs(delta)),
                `(${format.percentage(delta / open)})`,
            ].join(' '),
        )
        this.setFields(
            {
                name: 'Open',
                value: format.value(open),
                inline: true,
            },
            {
                name: 'High',
                value: format.value(quote.regularMarketDayHigh),
                inline: true,
            },
            {
                name: 'Low',
                value: format.value(quote.regularMarketDayLow),
                inline: true,
            },
            {
                name: 'P/B',
                value: format.number(quote.priceToBook),
                inline: true,
            },
            {
                name: 'Volume',
                value: format.number(quote.regularMarketVolume),
                inline: true,
            },
            {
                name: 'Market Cap',
                value: format.value(quote.marketCap),
                inline: true,
            },
            {
                name: 'Seed',
                value: format.value(seed),
                inline: true,
            },
            {
                name: 'Owned',
                value: format.shares(shares),
                inline: true,
            },
            {
                name: 'Profit',
                value: format.value(shares * price - seed),
                inline: true,
            },
        )
        this.setCanvas(
            graph(
                chart.quotes.map((bar) => {
                    return {
                        x: bar.date.getTime(),
                        y: bar.close ?? NaN,
                    }
                }),
                color,
            ),
        )
        this.setFooter({
            text: `${timeframe}  •  ${chart.quotes.length} Data Points`,
            iconURL: userIcon,
        })
        this.setComponents([row1, row2])
    }
}

export type ViewReplyData = {
    quote: Quote
    chart: ChartResultArray
    timeframe: keyof typeof timeframes
    client: ClientType
    userIcon: string
}
