import { SlashCommandSubcommandBuilder } from 'discord.js'

import { Group } from '@/enums'
import Command from '@/libs/command'
import Client from '@/services/client'
import discord from '@/services/discord'
import yahoo from '@/services/yahoo'
import { WatchlistReply } from '@/views/watchlist'

const command = new Command()
    .setName('watchlist')
    .setDescription('Manage watchlist')
    .setGroup(Group.Trade)

command.addSubcommand(
    new SlashCommandSubcommandBuilder()
        .setName('add')
        .setDescription('Add stock to watchlist')
        .addStringOption((option) =>
            option
                .setName('symbol')
                .setDescription('Stock ticker')
                .setRequired(true),
        ),
)

command.addSubcommand(
    new SlashCommandSubcommandBuilder()
        .setName('remove')
        .setDescription('Remove stock from watchlist')
        .addStringOption((option) =>
            option
                .setName('symbol')
                .setDescription('Stock ticker')
                .setRequired(true),
        ),
)

command.addSubcommand(
    new SlashCommandSubcommandBuilder()
        .setName('show')
        .setDescription('Display watchlist'),
)

command.setChatInputCommandHandler(async (interaction) => {
    const subcommand = interaction.options.getSubcommand()
    const client = await Client.getClientByUserId(interaction.user.id)

    switch (subcommand) {
        case 'add': {
            const symbol = interaction.options.getString('symbol', true)
            await yahoo.getQuote(symbol)
            client.addToWatchlist(symbol)
            break
        }
        case 'remove': {
            const symbol = interaction.options.getString('symbol', true)
            await yahoo.getQuote(symbol)
            client.removeFromWatchlist(symbol)
            break
        }
    }

    await client.save()

    const quotes = await yahoo.getQuotes(client.model.watchlist)
    const reply = new WatchlistReply({
        quotes,
        clientId: client.getId(),
        client: client.model,
        userIcon: interaction.user.displayAvatarURL(),
    })
    await interaction.reply(reply)
})

discord.addCommand(command)
