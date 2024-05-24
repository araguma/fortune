import { SlashCommandSubcommandBuilder } from 'discord.js'

import { Group } from '@/enums'
import UserError from '@/errors/user'
import Command from '@/libs/command'
import {
    generateTransactionReply,
    handleTransactionStringSelectMenu,
} from '@/libs/transaction'
import Client from '@/services/client'
import discord from '@/services/discord'

const command = new Command()
    .setName('sell')
    .setDescription('Sell shares')
    .setGroup(Group.Trade)

command.addSubcommand(
    new SlashCommandSubcommandBuilder()
        .setName('all')
        .setDescription('Sell everything'),
)

command.addSubcommand(
    new SlashCommandSubcommandBuilder()
        .setName('stock')
        .setDescription('Sell by stock')
        .addStringOption((option) =>
            option
                .setName('symbol')
                .setDescription('Stock ticker')
                .setRequired(true),
        ),
)

command.addSubcommand(
    new SlashCommandSubcommandBuilder()
        .setName('share')
        .setDescription('Sell by shares')
        .addStringOption((option) =>
            option
                .setName('symbol')
                .setDescription('Stock ticker')
                .setRequired(true),
        )
        .addNumberOption((option) =>
            option
                .setName('shares')
                .setDescription('Number of shares')
                .setRequired(true),
        ),
)

command.addSubcommand(
    new SlashCommandSubcommandBuilder()
        .setName('value')
        .setDescription('Sell by value')
        .addStringOption((option) =>
            option
                .setName('symbol')
                .setDescription('Stock ticker')
                .setRequired(true),
        )
        .addNumberOption((option) =>
            option
                .setName('value')
                .setDescription('Total stock value')
                .setRequired(true),
        ),
)

command.addSubcommand(
    new SlashCommandSubcommandBuilder()
        .setName('last')
        .setDescription('Sell last n stocks')
        .addIntegerOption((option) =>
            option
                .setName('count')
                .setDescription('Number of stocks to sell')
                .setRequired(false),
        ),
)

command.setChatInputCommandHandler(async (interaction) => {
    const client = await Client.getClientByUserId(interaction.user.id)

    const subcommand = interaction.options.getSubcommand()
    const transaction = await (async () => {
        switch (subcommand) {
            case 'all': {
                return client.sellAll()
            }
            case 'stock': {
                const symbol = interaction.options.getString('symbol', true)
                return client.sellStock(symbol)
            }
            case 'share': {
                const symbol = interaction.options.getString('symbol', true)
                const shares = interaction.options.getNumber('shares', true)
                if (shares <= 0) UserError.invalid('shares', shares)
                return client.sellShares(symbol, shares)
            }
            case 'value': {
                const symbol = interaction.options.getString('symbol', true)
                const value = interaction.options.getNumber('value', true)
                if (value <= 0) UserError.invalid('value', value)
                return client.sellValue(symbol, value)
            }
            case 'last': {
                const count = interaction.options.getInteger('count') ?? 1
                if (count <= 0) UserError.invalid('count', count)
                return client.sellLast(count)
            }
            default: {
                UserError.invalid('subcommand', subcommand)
            }
        }
    })()

    await client.save()
    await transaction.save()

    const reply = await generateTransactionReply(transaction.getId(), 1)
    await interaction.reply(reply)
})

command.setStringSelectMenuHandler(handleTransactionStringSelectMenu)

discord.addCommand(command)
