import {
    SlashCommandBuilder,
    SlashCommandStringOption,
    SlashCommandSubcommandBuilder,
} from 'discord.js'

import divider from '@/images/divider'
import database from '@/libs/database'
import discord from '@/libs/discord'
import { UserError } from '@/libs/error'
import { groups } from '@/libs/group'

const groupStringOption = (option: SlashCommandStringOption) =>
    option
        .setName('group')
        .setDescription('Command group')
        .addChoices(
            ...groups.map((group) => ({
                name: (group[0] ?? '').toUpperCase() + group.slice(1),
                value: group,
            })),
        )
        .setRequired(true)

discord.addCommand({
    descriptor: new SlashCommandBuilder()
        .setName('whitelist')
        .setDescription('Manage channel whitelist')
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName('add')
                .setDescription('Add channel to the whitelist')
                .addChannelOption((option) =>
                    option
                        .setName('channel')
                        .setDescription('Channel to add')
                        .setRequired(true),
                )
                .addStringOption(groupStringOption),
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName('remove')
                .setDescription('Remove channel from the whitelist')
                .addChannelOption((option) =>
                    option
                        .setName('channel')
                        .setDescription('Channel to remove')
                        .setRequired(true),
                )
                .addStringOption(groupStringOption),
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
        const whitelist = await database.getWhitelistByGuildId(
            interaction.guild.id,
        )

        if (subcommand === 'add' || subcommand === 'remove') {
            const channel = interaction.options.getChannel('channel', true)
            const group = interaction.options.getString('group', true)
            const current = whitelist.channels.get(channel.id)
            const settings = Object.fromEntries(
                groups.map((key) => [key, current?.[key] ?? false]),
            )
            settings[group] = subcommand === 'add'
            whitelist.channels.set(channel.id, settings)
            await whitelist.save()
        }

        const fields = groups.map((group) => {
            let value = ''
            whitelist.channels.forEach((channel, id) => {
                if (channel[group]) value += `<#${id}>\n`
            })

            return {
                name: (group[0] ?? '').toUpperCase() + group.slice(1),
                value,
                inline: true,
            }
        })

        return {
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
                        text: whitelist._id.toString().toUpperCase(),
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
        }
    },
})
