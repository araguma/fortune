import { SlashCommandSubcommandBuilder } from 'discord.js'

import { Group } from '@/enums'
import UserError from '@/errors/user'
import Command from '@/libs/command'
import discord from '@/services/discord'
import Server from '@/services/server'
import { WhitelistReply } from '@/views/whitelist'

const groups = Object.values(Group).filter((group) => group !== Group.Admin)

const command = new Command()
    .setName('whitelist')
    .setDescription('Manage whitelist')
    .setGroup(Group.Admin)

command.addSubcommand(
    new SlashCommandSubcommandBuilder()
        .setName('add')
        .setDescription('Add group to channel whitelist')
        .addChannelOption((option) =>
            option
                .setName('channel')
                .setDescription('Target channel')
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName('group')
                .setDescription('Target group')
                .addChoices(
                    groups.map((group) => ({
                        name: group,
                        value: group,
                    })),
                )
                .setRequired(true),
        ),
)

command.addSubcommand(
    new SlashCommandSubcommandBuilder()
        .setName('remove')
        .setDescription('Remove group from channel whitelist')
        .addChannelOption((option) =>
            option
                .setName('channel')
                .setDescription('Target channel')
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName('group')
                .setDescription('Target group')
                .addChoices(
                    groups.map((group) => ({
                        name: group,
                        value: group,
                    })),
                )
                .setRequired(true),
        ),
)

command.addSubcommand(
    new SlashCommandSubcommandBuilder()
        .setName('show')
        .setDescription('Display whitelist'),
)

command.setChatInputCommandHandler(async (interaction) => {
    if (!interaction.inGuild()) UserError.guildOnly()

    const subcommand = interaction.options.getSubcommand()
    const server = await Server.getServerByGuildId(interaction.guildId)

    if (subcommand === 'add' || subcommand === 'remove') {
        const channel = interaction.options.getChannel('channel', true)
        const group = interaction.options.getString('group', true) as Group

        switch (subcommand) {
            case 'add': {
                server.addToWhitelist(channel.id, group)
                break
            }
            case 'remove': {
                server.removeFromWhitelist(channel.id, group)
                break
            }
        }
    }
    await server.save()

    const reply = new WhitelistReply({
        whitelists: server.model.whitelists,
        serverId: server.getId(),
    })

    await interaction.reply(reply)
})

discord.addCommand(command)
