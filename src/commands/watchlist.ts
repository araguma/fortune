import { SlashCommandBuilder } from 'discord.js'

import divider from '@/images/divider'
import alpaca from '@/libs/alpaca'
import database from '@/libs/database'
import discord from '@/libs/discord'
import format from '@/libs/format'

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
        const userId =
            interaction.options.getUser('user')?.id ?? interaction.user.id
        const user = await discord.users.fetch(userId)
        const client = await database.getClientByUserId(userId)

        const snapshots = await alpaca.getSnapshots(client.watchlist)

        const description = client.watchlist
            .map((symbol) => {
                const snapshot = snapshots[symbol]
                if (!snapshot) throw new Error('Failed to get snapshot')
                const quote = snapshot.latestTrade?.p || NaN
                const open = snapshot.dailyBar?.o || NaN
                return [
                    quote - open >= 0 ? '▴' : '▾',
                    format.bold(symbol),
                    format.currency(quote),
                    `(${format.percentage((quote - open) / open)})`,
                ].join(' ')
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
                    description:
                        description.substring(0, 4096) || '> *No stocks found*',
                    image: {
                        url: 'attachment://divider.png',
                    },
                    footer: {
                        text: client._id.toString().toUpperCase(),
                        icon_url: user.displayAvatarURL(),
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
