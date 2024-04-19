import { SlashCommandBuilder } from 'discord.js'

import graph from '@/images/graph'
import alpaca from '@/libs/alpaca'
import database from '@/libs/database'
import discord from '@/libs/discord'
import { UserError } from '@/libs/error'
import format from '@/libs/format'

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
        .toJSON(),
    handler: async (interaction) => {
        const symbol = interaction.options
            .getString('symbol', true)
            .toUpperCase()

        const snapshot = (await alpaca.getSnapshots([symbol]))[symbol]
        if (!snapshot) UserError.throw('Symbol not found')

        const start = new Date()
        const end = new Date()
        start.setFullYear(end.getFullYear() - 1)
        const history = (
            await alpaca.getHistory([symbol], '1Day', start, end)
        )[symbol]
        if (!history) UserError.throw('Failed to get history')

        const client = await database.getClientByUserId(interaction.user.id)
        const shares = client.portfolio.get(symbol)?.shares ?? 0

        const quote = snapshot.latestTrade.p
        const delta = quote - snapshot.dailyBar.o
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
                        `(${format.percentage(delta / snapshot.dailyBar.o)})`,
                    ].join(' '),
                    fields: [
                        {
                            name: 'Open',
                            value: format.currency(snapshot.dailyBar.o),
                            inline: true,
                        },
                        {
                            name: 'High',
                            value: format.currency(snapshot.dailyBar.h),
                            inline: true,
                        },
                        {
                            name: 'Low',
                            value: format.currency(snapshot.dailyBar.l),
                            inline: true,
                        },
                        {
                            name: 'Volume',
                            value: snapshot.dailyBar.v.toString(),
                            inline: true,
                        },
                        {
                            name: 'Trades',
                            value: snapshot.dailyBar.n.toString(),
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
                        text: '1Y',
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
