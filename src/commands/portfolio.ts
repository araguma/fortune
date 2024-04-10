import { SlashCommandBuilder } from 'discord.js'

import divider from '@/images/divider'
import alpaca from '@/libs/alpaca'
import database from '@/libs/database'
import discord from '@/libs/discord'

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
        const client = await database.getClient(
            interaction.options.getUser('user')?.id ?? interaction.user.id,
        )

        const snapshots = await alpaca.snapshots(
            Array.from(client.portfolio.keys()),
        )

        const { value, delta } = Array.from(client.portfolio.entries()).reduce(
            (acc, [symbol, share]) => {
                const snapshot = snapshots[symbol]
                if (!snapshot) throw new Error('Failed to get snapshot')
                const quote = snapshot.latestTrade.p
                return {
                    value: acc.value + quote * (share.quantity ?? 0),
                    delta:
                        acc.delta +
                        (quote - snapshot.dailyBar.o) * (share.quantity ?? 0),
                }
            },
            { value: 0, delta: 0 },
        )
        const total = value + client.balance
        const profit = total - client.seed
        const description = Array.from(client.portfolio.entries())
            .map(([symbol, share]) => {
                const snapshot = snapshots[symbol]
                if (!snapshot) throw new Error('Failed to get snapshot')
                const quote = snapshot.latestTrade.p
                const total = quote * (share.quantity ?? 0)
                const percent =
                    ((quote - snapshot.dailyBar.o) / snapshot.dailyBar.o) * 100
                const sign = percent > 0 ? '▴' : percent < 0 ? '▾' : '•'
                return `${sign} **${symbol}** ${share.quantity ?? 0} ⋅ $${quote} ▸ $${total.toFixed(2)} (${percent.toFixed(2)}%)`
            })
            .join('\n')
        const embed = {
            color: delta > 0 ? 0x2ecc71 : delta < 0 ? 0xe74c3c : 0x3498db,
            author: {
                name: '---',
            },
            title: 'Portfolio',
            description: description || '> *No shares found*',
            fields: [
                {
                    name: 'Value',
                    value: `$${value.toFixed(2)} (${(value ? (delta / value) * 100 : 0).toFixed(2)}%)`,
                    inline: true,
                },
                {
                    name: 'Balance',
                    value: `$${client.balance.toFixed(2)}`,
                    inline: true,
                },
                {
                    name: 'Total',
                    value: `$${total.toFixed(2)} (${(total ? (delta / total) * 100 : 0).toFixed(2)}%)`,
                    inline: true,
                },
                {
                    name: 'Delta',
                    value: `$${delta.toFixed(2)}`,
                    inline: true,
                },
                {
                    name: 'Seed',
                    value: `$${client.seed.toFixed(2)}`,
                    inline: true,
                },
                {
                    name: 'Profit',
                    value: `$${profit.toFixed(2)} (${(profit ? (delta / profit) * 100 : 0).toFixed(2)}%)`,
                    inline: true,
                },
            ],
            image: {
                url: 'attachment://divider.png',
            },
            footer: {
                text: client._id.toString().toUpperCase(),
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
