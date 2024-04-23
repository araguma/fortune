import { SlashCommandBuilder } from 'discord.js'

import graph from '@/images/graph'
import alpaca from '@/libs/alpaca'
import database from '@/libs/database'
import discord from '@/libs/discord'
import { UserError } from '@/libs/error'
import format from '@/libs/format'

const timeframes = {
    '1D': {
        interval: '2T',
        duration: 1,
    },
    '7D': {
        interval: '15T',
        duration: 7,
    },
    '1M': {
        interval: '1H',
        duration: 30,
    },
    '6M': {
        interval: '6H',
        duration: 180,
    },
    '1Y': {
        interval: '12H',
        duration: 365,
    },
    '5Y': {
        interval: '1W',
        duration: 365 * 5,
    },
}

discord.addCommand({
    descriptor: new SlashCommandBuilder()
        .setName('view')
        .setDescription('Inspect a stock')
        .addStringOption((option) =>
            option
                .setName('symbol')
                .setDescription('Stock ticker')
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName('timeframe')
                .setDescription('Timeframe')
                .addChoices(
                    ...Object.keys(timeframes).map((timeframe) => ({
                        name: timeframe,
                        value: timeframe,
                    })),
                )
                .setRequired(true),
        )
        .toJSON(),
    handler: async (interaction) => {
        const symbol = interaction.options
            .getString('symbol', true)
            .toUpperCase()
        const timeframe = interaction.options.getString(
            'timeframe',
            true,
        ) as keyof typeof timeframes
        const interval = timeframes[timeframe].interval
        const duration = timeframes[timeframe].duration

        const snapshot = (await alpaca.getSnapshots([symbol]))[symbol]
        if (!snapshot) UserError.throw('Symbol not found')

        const start = new Date()
        const end = new Date()
        start.setDate(end.getDate() - duration)
        const history = (
            await alpaca.getHistory([symbol], interval, start, end)
        )[symbol]
        if (!history) UserError.throw('Failed to get history')

        const client = await database.getClientByUserId(interaction.user.id)
        const shares = client.portfolio.get(symbol)?.shares ?? 0

        const quote = snapshot.latestTrade?.p || NaN
        const open = snapshot.dailyBar?.o || NaN
        const delta = quote - open
        const sign = delta >= 0 ? '▴' : '▾'

        await interaction.reply({
            embeds: [
                {
                    color:
                        delta > 0 ? 0x2ecc71 : delta < 0 ? 0xe74c3c : 0x3498db,
                    author: {
                        name: '---',
                    },
                    title: symbol,
                    description: [
                        '#',
                        format.currency(quote),
                        '\n',
                        sign,
                        format.currency(Math.abs(delta)),
                        `(${format.percentage(delta / open)})`,
                    ].join(' '),
                    fields: [
                        {
                            name: 'Open',
                            value: format.currency(open),
                            inline: true,
                        },
                        {
                            name: 'High',
                            value: format.currency(snapshot.dailyBar?.h),
                            inline: true,
                        },
                        {
                            name: 'Low',
                            value: format.currency(snapshot.dailyBar?.l),
                            inline: true,
                        },
                        {
                            name: 'Volume',
                            value: format.number(snapshot.dailyBar?.v),
                            inline: true,
                        },
                        {
                            name: 'Trades',
                            value: format.number(snapshot.dailyBar?.n),
                            inline: true,
                        },
                        {
                            name: 'Owned',
                            value: shares.toString(),
                            inline: true,
                        },
                    ],
                    image: {
                        url: 'attachment://graph.png',
                    },
                    footer: {
                        text: `${timeframe}  •  ${history.length} Data Points`,
                    },
                },
            ],
            files: [
                {
                    attachment: graph(
                        history.map((bar) => {
                            return {
                                x: new Date(bar.t).getTime(),
                                y: bar.o,
                            }
                        }),
                        delta > 0
                            ? '#2ecc71'
                            : delta < 0
                              ? '#e74c3c'
                              : '#3498db',
                    ),
                    name: 'graph.png',
                },
            ],
        })
    },
})
