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
        const type = (interaction.options.getString('type') ??
            (() => {
                throw new Error('Type is required')
            })()) as 'Gainers' | 'Losers'

        const movers = await alpaca.movers(10)

        const sign = type === 'Gainers' ? '▴' : '▾'

        await interaction.reply({
            embeds: [
                {
                    author: {
                        name: '---',
                    },
                    title: `Top ${type} Today`,
                    description:
                        '​\n' +
                        movers[type.toLowerCase() as Lowercase<typeof type>]
                            .map((mover) => {
                                return `${sign} **${mover.symbol}** $${mover.price} (${mover.percent_change}%)`
                            })
                            .join('\n'),
                    image: {
                        url: 'attachment://divider.png',
                    },
                    timestamp: new Date().toISOString(),
                    color: type === 'Gainers' ? 0x2ecc71 : 0xe74c3c,
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
