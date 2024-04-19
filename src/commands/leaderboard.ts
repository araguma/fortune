import { SlashCommandBuilder } from 'discord.js'

import divider from '@/images/divider'
import database from '@/libs/database'
import discord from '@/libs/discord'
import format from '@/libs/format'

const limit = 10

discord.addCommand({
    descriptor: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Display profit leaderboard')
        .toJSON(),
    handler: async (interaction) => {
        const clients = await database.getAllClients()

        clients.sort((a, b) => b.profit - a.profit)

        let name = ''
        let profit = ''
        for (let i = 0; i < limit; i++) {
            const client = clients[i]
            if (!client) break
            const user = await discord.users.fetch(client.userId)
            name += `${i + 1}) ${user.displayName}\n`
            profit += `${format.currency(client.profit)}\n`
        }

        await interaction.reply({
            embeds: [
                {
                    color: 0x3498db,
                    author: {
                        name: '---',
                    },
                    title: 'Leaderboard',
                    fields: [
                        {
                            name: 'Name',
                            value: name,
                            inline: true,
                        },
                        {
                            name: 'Profit',
                            value: profit,
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
        })
    },
})
