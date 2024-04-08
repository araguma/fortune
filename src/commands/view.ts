import { SlashCommandBuilder } from 'discord.js'

import graph from '@/images/graph'
import alpaca from '@/libs/alpaca'
import database from '@/libs/database'
import discord from '@/libs/discord'
import { UserError } from '@/libs/error'

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
        const symbol = (
            interaction.options.getString('symbol') ??
            (() => {
                throw new UserError('Symbol is required')
            })()
        ).toUpperCase()

        const snapshot = (await alpaca.snapshots([symbol]))[symbol]
        if (!snapshot) throw new UserError('Symbol not found')

        const start = new Date()
        const end = new Date()
        start.setFullYear(end.getFullYear() - 1)
        const history = (
            await alpaca.history([symbol], '1Day', start, end, 1000)
        )[symbol]
        if (!history) throw new UserError('Failed to get history')

        const shares = await database.getShares(interaction.user.id, symbol)
        const quantity = shares?.quantity ?? 0

        const quote = snapshot.latestTrade.p
        const delta = quote - snapshot.dailyBar.o
        const sign = delta >= 0 ? '▴' : '▾'

        await interaction.reply({
            embeds: [
                {
                    author: {
                        name: '---',
                    },
                    title: symbol,
                    description: `# $${quote}\n${sign} ${Math.abs(delta).toFixed(2)} (${(delta / snapshot.dailyBar.o).toFixed(2)}%)`,
                    fields: [
                        {
                            name: 'Open',
                            value: `$${snapshot.dailyBar.o.toFixed(2)}`,
                            inline: true,
                        },
                        {
                            name: 'High',
                            value: `$${snapshot.dailyBar.h.toFixed(2)}`,
                            inline: true,
                        },
                        {
                            name: 'Low',
                            value: `$${snapshot.dailyBar.l.toFixed(2)}`,
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
                            value: quantity.toString(),
                            inline: true,
                        },
                    ],
                    image: {
                        url: 'attachment://graph.png',
                    },
                    footer: {
                        text: '1Y',
                    },
                    color: delta >= 0 ? 0x2ecc71 : 0xe74c3c,
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
                        delta >= 0 ? '#2ecc71' : '#e74c3c',
                    ),
                    name: 'graph.png',
                },
            ],
        })
    },
})