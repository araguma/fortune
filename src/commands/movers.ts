import { SlashCommandBuilder } from 'discord.js'

import divider from '@/images/divider'
import alpaca from '@/libs/alpaca'
import discord from '@/libs/discord'

discord.addCommand({
    descriptor: new SlashCommandBuilder()
        .setName('movers')
        .setDescription('List top movers')
        .addStringOption((option) =>
            option
                .setName('type')
                .setDescription('Type of movers')
                .addChoices(
                    {
                        name: 'Gainers',
                        value: 'Gainers',
                    },
                    {
                        name: 'Losers',
                        value: 'Losers',
                    },
                )
                .setRequired(true),
        )
        .toJSON(),
    handler: async (interaction) => {
        const type = interaction.options.getString('type', true) as
            | 'Gainers'
            | 'Losers'

        const movers = await alpaca.getMovers(10)

        const sign = type === 'Gainers' ? '▴' : '▾'
        const description = movers[type.toLowerCase() as Lowercase<typeof type>]
            .map((mover) => {
                return `${sign} **${mover.symbol}** $${mover.price} (${mover.percent_change}%)`
            })
            .join('\n')

        await interaction.reply({
            embeds: [
                {
                    color: type === 'Gainers' ? 0x2ecc71 : 0xe74c3c,
                    author: {
                        name: '---',
                    },
                    title: `Top ${type} Today`,
                    description: description || '> *No stocks found*',
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
