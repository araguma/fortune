import { SlashCommandSubcommandBuilder } from 'discord.js'

import { Group } from '@/enums'
import UserError from '@/errors/user'
import Command from '@/libs/command'
import Tag from '@/libs/tag'
import { generateViewReply } from '@/libs/view'
import { generateWatchlistReply } from '@/libs/watchlist'
import Client from '@/services/client'
import discord from '@/services/discord'
import yahoo from '@/services/yahoo'
import { WatchlistReply } from '@/views/watchlist'

const command = new Command().setName('watchlist').setDescription('Manage watchlist').setGroup(Group.Trade)

command.addSubcommand(
    new SlashCommandSubcommandBuilder()
        .setName('add')
        .setDescription('Add stock to watchlist')
        .addStringOption((option) => option.setName('symbol').setDescription('Stock ticker').setRequired(true)),
)

command.addSubcommand(
    new SlashCommandSubcommandBuilder()
        .setName('remove')
        .setDescription('Remove stock from watchlist')
        .addStringOption((option) => option.setName('symbol').setDescription('Stock ticker').setRequired(true)),
)

command.addSubcommand(new SlashCommandSubcommandBuilder().setName('show').setDescription('Display watchlist'))

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
        page: 1,
    })
    await interaction.reply(reply)
})

command.setButtonHandler(async (interaction) => {
    const tag = new Tag(interaction.customId)

    switch (tag.getAction(true)) {
        case 'update': {
            const client = await Client.findById(tag.getData('clientId', true))
            const userId = client.model.userId
            const user = await discord.users.fetch(userId)

            const quotes = await yahoo.getQuotes(client.model.watchlist)
            const reply = new WatchlistReply({
                quotes,
                clientId: client.getId(),
                client: client.model,
                userIcon: user.displayAvatarURL(),
                page: 1,
            })
            await interaction.update(reply)
            break
        }
    }
})

command.setStringSelectMenuHandler(async (interaction) => {
    const tag = new Tag(interaction.customId)

    switch (tag.getAction(true)) {
        case 'view': {
            const client = await Client.findById(tag.getData('clientId', true))
            const symbol = interaction.values[0]
            const userId = client.model.userId

            if (!symbol) UserError.missingSymbol()

            const reply = await generateViewReply(symbol, '1D', userId)
            await interaction.reply(reply)
            break
        }
        case 'page': {
            const client = await Client.findById(tag.getData('clientId', true))
            const userId = client.model.userId

            const reply = await generateWatchlistReply(userId, parseInt(interaction.values[0] ?? '1'))
            await interaction.update(reply)
            break
        }
    }
})

discord.addCommand(command)
