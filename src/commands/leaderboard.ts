import { SlashCommandBuilder } from 'discord.js'

import divider from '@/images/divider'
import alpaca from '@/libs/alpaca'
import database from '@/libs/database'
import discord from '@/libs/discord'
import format from '@/libs/format'

const limit = 20
const padding = limit.toString().length

discord.addCommand({
    descriptor: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Display leaderboard')
        .addStringOption((option) =>
            option
                .setName('metric')
                .setDescription('Metric to use')
                .addChoices(
                    {
                        name: 'Profit',
                        value: 'profit',
                    },
                    {
                        name: 'Total',
                        value: 'total',
                    },
                )
                .setRequired(true),
        )
        .toJSON(),
    handler: async (interaction) => {
        const metric = interaction.options.getString('metric', true)

        const clients = await database.getAllClients()
        const leaderboard = clients.map((client) => ({
            userId: client.userId,
            portfolio: client.portfolio,
            balance: client.balance,
            seed: client.seed,
            metric: 0,
        }))

        const symbols = new Set<string>()
        clients.forEach((client) => {
            client.portfolio.forEach((_, symbol) => symbols.add(symbol))
        })

        const snapshots = await alpaca.getSnapshots(Array.from(symbols))
        leaderboard.forEach((entry) => {
            const value = Array.from(entry.portfolio.entries()).reduce(
                (acc, [symbol, stock]) => {
                    const snapshot = snapshots[symbol]
                    if (!snapshot) throw new Error('Failed to get snapshot')
                    const quote =
                        snapshot.minuteBar?.c || snapshot.latestTrade?.p || NaN
                    return acc + quote * stock.shares
                },
                0,
            )
            switch (metric) {
                case 'profit':
                    entry.metric = value + entry.balance - entry.seed
                    break
                case 'total':
                    entry.metric = value + entry.balance
                    break
            }
        })

        const formatter = (value: number) => {
            switch (metric) {
                case 'profit':
                case 'total':
                    return format.currency(value)
                default:
                    return value
            }
        }
        leaderboard.sort((a, b) => b.metric - a.metric)
        leaderboard.splice(limit)

        return {
            embeds: [
                {
                    color: 0x3498db,
                    author: {
                        name: '---',
                    },
                    title: `Leaderboard (${format.capitalize(metric)})`,
                    fields: [
                        {
                            name: 'Name',
                            value: leaderboard
                                .map(
                                    (entry, index) =>
                                        `\`${(index + 1).toString().padStart(padding)})\` <@${entry.userId}>`,
                                )
                                .join('\n'),
                            inline: true,
                        },
                        {
                            name: format.capitalize(metric),
                            value: leaderboard
                                .map(
                                    (entry) => `\`${formatter(entry.metric)}\``,
                                )
                                .join('\n'),
                            inline: true,
                        },
                    ],
                    image: {
                        url: 'attachment://divider.png',
                    },
                    timestamp: new Date().toISOString(),
                },
            ],
            files: [
                {
                    attachment: divider(),
                    name: 'divider.png',
                },
            ],
        }
    },
})
