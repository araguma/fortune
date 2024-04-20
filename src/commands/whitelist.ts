import {
    SlashCommandBuilder,
    SlashCommandStringOption,
    SlashCommandSubcommandBuilder,
} from 'discord.js'

import { groups } from '@/data/groups'
import divider from '@/images/divider'
import database from '@/libs/database'
import discord from '@/libs/discord'
import { UserError } from '@/libs/error'

const displayGroups = groups.filter(
    (group) => group !== 'admin' && group !== 'threads',
)
const choices = displayGroups.map((group) => ({
    name: (group[0] ?? '').toUpperCase() + group.slice(1),
    value: group,
}))
const groupOption = (option: SlashCommandStringOption) =>
    option
        .setName('group')
        .setDescription('Command group')
        .addChoices(...choices)
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
                const whitelist = Object.fromEntries(
                    displayGroups.map((group) => [
                        group,
                        channel?.[group] ?? false,
                    ]),
                )
                whitelist[group] = subcommand === 'add'
                server.channels.set(interaction.channelId, whitelist)
                await server.save()
            }
        }

        const fields = displayGroups.map((group) => {
            let value = ''
            server.channels.forEach((channel, id) => {
                if (channel[group]) value += `<#${id}>\n`
            })

            return {
                name: (group[0] ?? '').toUpperCase() + group.slice(1),
                value,
                inline: true,
            }
        })

        await interaction.reply({
            embeds: [
                {
                    color: 0x3498db,
                    author: {
                        name: '---',
                    },
                    title: 'Whitelist',
                    fields,
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
