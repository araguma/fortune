import {
    SlashCommandBuilder,
    SlashCommandStringOption,
    SlashCommandSubcommandBuilder,
} from 'discord.js'

import divider from '@/images/divider'
import database from '@/libs/database'
import discord from '@/libs/discord'
import { UserError } from '@/libs/error'

const groupOption = (option: SlashCommandStringOption) =>
    option
        .setName('group')
        .setDescription('Command group')
        .addChoices(
            {
                name: 'Predictions',
                value: 'predictions',
            },
            {
                name: 'Trades',
                value: 'trades',
            },
        )
        .setRequired(true)

discord.addCommand({
    descriptor: new SlashCommandBuilder()
        .setName('whitelist')
        .setDescription('Manage channel whitelist')
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName('add')
                .setDescription('Add this channel to the whitelist')
                .addStringOption(groupOption),
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName('remove')
                .setDescription('Remove this channel from the whitelist')
                .addStringOption(groupOption),
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName('list')
                .setDescription('List whitelisted channels'),
        )
        .toJSON(),
    handler: async (interaction) => {
        const subcommand = interaction.options.getSubcommand()

        if (!interaction.guild) UserError.throw('Failed to get guild')
        const server = await database.getServerByGuildId(interaction.guild.id)

        switch (subcommand) {
            case 'add':
            case 'remove': {
                const group = interaction.options.getString('group', true)
                const channel = server.channels.get(interaction.channelId)
                server.channels.set(interaction.channelId, {
                    predictions: channel?.predictions ?? null,
                    trades: channel?.trades ?? null,
                    [group]: subcommand === 'add',
                })
                await server.save()
            }
        }

        let predictions = ''
        let trades = ''
        server.channels.forEach((channel, id) => {
            if (channel.predictions) predictions += `<#${id}>\n`
            if (channel.trades) trades += `<#${id}>\n`
        })

        await interaction.reply({
            embeds: [
                {
                    color: 0x3498db,
                    author: {
                        name: '---',
                    },
                    title: 'Whitelist',
                    fields: [
                        {
                            name: 'Predictions',
                            value: predictions || 'None',
                            inline: true,
                        },
                        {
                            name: 'Trades',
                            value: trades || 'None',
                            inline: true,
                        },
                    ],
                    image: {
                        url: 'attachment://divider.png',
                    },
                    footer: {
                        text: server._id.toString().toUpperCase(),
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
            ephemeral: true,
        })
    },
})
