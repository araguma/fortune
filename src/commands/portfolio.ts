import { SlashCommandBuilder } from 'discord.js'

import divider from '@/images/divider'
import alpaca from '@/libs/alpaca'
import database from '@/libs/database'
import discord from '@/libs/discord'
import format from '@/libs/format'

discord.addCommand({
    descriptor: new SlashCommandBuilder()
        .setName('portfolio')
        .setDescription('Display portfolio')
        .addUserOption((option) =>
            option
                .setName('user')
                .setDescription('Target user')
                .setRequired(false),
        )
        .toJSON(),
    handler: async (interaction) => {
        const userId =
            interaction.options.getUser('user')?.id ?? interaction.user.id
        const user = await discord.users.fetch(userId)
        const client = await database.getClientByUserId(userId)
        const snapshots = await alpaca.getSnapshots(
            Array.from(client.portfolio.keys()),
        )

        const { value, delta } = Array.from(client.portfolio.entries()).reduce(
            (acc, [symbol, stock]) => {
                const snapshot = snapshots[symbol]
                if (!snapshot) throw new Error('Failed to get snapshot')
                const quote = snapshot.latestTrade?.p || NaN
                const open = snapshot.dailyBar?.o || NaN
                return {
                    value: acc.value + quote * stock.shares,
                    delta: acc.delta + (quote - open) * stock.shares,
                }
            },
            { value: 0, delta: 0 },
        )
        const total = value + client.balance
        const profit = parseFloat((total - client.seed).toFixed(5))

        client.profit = profit
        await client.save()

        const description = Array.from(client.portfolio.entries())
            .map(([symbol, stock]) => {
                const snapshot = snapshots[symbol]
                if (!snapshot) throw new Error('Failed to get snapshot')
                const quote = snapshot.latestTrade?.p || NaN
                const open = snapshot.dailyBar?.o || NaN
                const delta = (quote - open) * stock.shares
                const value = quote * stock.shares
                return [
                    delta >= 0 ? '▴' : '▾',
                    format.bold(symbol),
                    stock.shares,
                    '⋅',
                    format.currency(quote),
                    '▸',
                    format.currency(value),
                    `(${format.percentage(delta / value)})`,
                ].join(' ')
            })
            .join('\n')
        const embed = {
            color: delta > 0 ? 0x2ecc71 : delta < 0 ? 0xe74c3c : 0x3498db,
            author: {
                name: '---',
            },
            title: 'Portfolio',
            description: description || '> *No stocks found*',
            fields: [
                {
                    name: 'Value',
                    value: [
                        format.currency(value),
                        `(${format.percentage(delta / Math.abs(value))})`,
                    ].join(' '),
                    inline: true,
                },
                {
                    name: 'Balance',
                    value: format.currency(client.balance),
                    inline: true,
                },
                {
                    name: 'Total',
                    value: [
                        format.currency(total),
                        `(${format.percentage(delta / Math.abs(total))})`,
                    ].join(' '),
                    inline: true,
                },
                {
                    name: 'Delta',
                    value: format.currency(delta),
                    inline: true,
                },
                {
                    name: 'Seed',
                    value: format.currency(client.seed),
                    inline: true,
                },
                {
                    name: 'Profit',
                    value: [
                        format.currency(profit),
                        `(${format.percentage(delta / Math.abs(profit))})`,
                    ].join(' '),
                    inline: true,
                },
            ],
            image: {
                url: 'attachment://divider.png',
            },
            footer: {
                text: client._id.toString().toUpperCase(),
                icon_url: user.displayAvatarURL(),
            },
            timestamp: new Date().toISOString(),
        }

        await interaction.reply({
            embeds: [embed],
            files: [
                {
                    attachment: divider(),
                    name: 'divider.png',
                },
            ],
        })
    },
})
