import { SlashCommandBuilder } from 'discord.js'

import divider from '@/images/divider'
import alpaca from '@/libs/alpaca'
import discord from '@/libs/discord'

discord.addCommand({
    descriptor: new SlashCommandBuilder()
        .setName('actives')
        .setDescription('List most active stocks')
        .addStringOption((option) =>
            option
                .setName('by')
                .setDescription('Sort by')
                .addChoices(
                    {
                        name: 'Volume',
                        value: 'Volume',
                    },
                    {
                        name: 'Trades',
                        value: 'Trades',
                    },
                )
                .setRequired(true),
        )
        .toJSON(),
    handler: async (interaction) => {
        const sortBy =
            interaction.options.getString('by') ??
            (() => {
                throw new Error('Sort by is required')
            })()

        const actives = await alpaca.getActives(10, sortBy)

        await interaction.reply({
            embeds: [
                {
                    color: 0x3498db,
                    author: {
                        name: '---',
                    },
                    title: `Active Stocks by ${sortBy}`,
                    fields: [
                        {
                            name: 'Symbol',
                            value: actives
                                .map((active) => active.symbol)
                                .join('\n'),
                            inline: true,
                        },
                        {
                            name: 'Trades',
                            value: actives
                                .map((active) => active.trade_count)
                                .join('\n'),
                            inline: true,
                        },
                        {
                            name: 'Volume',
                            value: actives
                                .map((active) => active.volume)
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
        })
    },
})
