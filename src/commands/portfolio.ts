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

        const shares = await database.getAllShares(interaction.user.id)
        const snapshots = await alpaca.snapshots(
            shares.map((share) => share.symbol),
        )

        const value = shares.reduce((acc, share) => {
            const snapshot = snapshots[share.symbol]
            if (!snapshot) throw new Error('Failed to get snapshot')
            return acc + snapshot.latestTrade.p * share.quantity
        }, 0)
        const delta = shares.reduce((acc, share) => {
            const snapshot = snapshots[share.symbol]
            if (!snapshot) throw new Error('Failed to get snapshot')
            return (
                acc +
                (snapshot.latestTrade.p - snapshot.dailyBar.o) * share.quantity
            )
        }, 0)
        const description = shares
            .map((share) => {
                const snapshot = snapshots[share.symbol]
                if (!snapshot) throw new Error('Failed to get snapshot')
                const symbol = share.symbol
                const quantity = share.quantity
                const quote = snapshot.latestTrade.p
                const total = quote * quantity
                const percent =
                    ((quote - snapshot.dailyBar.o) / snapshot.dailyBar.o) * 100
                const sign = percent >= 0 ? '▴' : '▾'
                return `${sign} **${symbol}** ${quantity} ⋅ $${quote} ▸ $${total.toFixed(2)} (${percent.toFixed(2)}%)`
            })
            .join('\n')

        await interaction.reply({
            embeds: [
                {
                    color: delta >= 0 ? 0x2ecc71 : 0xe74c3c,
                    author: {
                        name: '---',
                    },
                    title: 'Portfolio',
                    description: description || '> *No shares found*',
                    fields: [
                        {
                            name: 'Value',
                            value: `$${value.toFixed(2)} (${value === 0 ? '0.00' : ((delta / value) * 100).toFixed(2)}%)`,
                            inline: true,
                        },
                        {
                            name: 'Balance',
                            value: `$${client.balance.toFixed(2)}`,
                            inline: true,
                        },
                        {
                            name: 'Total',
                            value: `$${(value + client.balance).toFixed(2)} (${((delta / (value + client.balance)) * 100).toFixed(2)}%)`,
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
                },
            ],
            files: [
                {
                    attachment: divider(),
                    name: 'divider.png',
                },
            ],
        })
    },
})
