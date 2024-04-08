import { SlashCommandBuilder } from 'discord.js'

import divider from '@/images/divider'
import alpaca from '@/libs/alpaca'
import database from '@/libs/database'
import discord from '@/libs/discord'

discord.addCommand({
    descriptor: new SlashCommandBuilder()
        .setName('watchlist')
        .setDescription('View watchlist')
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

        const snapshots = await alpaca.snapshots(client.watchlist)

        const description = client.watchlist
            .map((symbol) => {
                const snapshot = snapshots[symbol]
                if (!snapshot) throw new Error('Failed to get snapshot')
                const quote = snapshot.latestTrade.p
                const percent =
                    ((quote - snapshot.dailyBar.o) / snapshot.dailyBar.o) * 100
                const sign = percent >= 0 ? '▴' : '▾'
                return `${sign} **${symbol}** $${quote} (${percent.toFixed(2)}%)`
            })
            .join('\n')

        await interaction.reply({
            embeds: [
                {
                    color: 0x3498db,
                    author: {
                        name: '---',
                    },
                    title: 'Watchlist',
                    description: description || '> *No stocks found*',
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
