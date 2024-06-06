import { SlashCommandSubcommandBuilder } from 'discord.js'

import { Group } from '@/enums'
import UserError from '@/errors/user'
import Command from '@/libs/command'
import { generateTransactionReply, handleTransactionStringSelectMenu } from '@/libs/transaction'
import Client from '@/services/client'
import discord from '@/services/discord'

const command = new Command().setName('buy').setDescription('Buy shares').setGroup(Group.Trade)

command.addSubcommand(
    new SlashCommandSubcommandBuilder()
        .setName('max')
        .setDescription('Exhaust balance')
        .addStringOption((option) => option.setName('symbol').setDescription('Stock ticker').setRequired(true)),
)

command.addSubcommand(
    new SlashCommandSubcommandBuilder()
        .setName('share')
        .setDescription('Purchase by shares')
        .addStringOption((option) => option.setName('symbol').setDescription('Stock ticker').setRequired(true))
        .addNumberOption((option) => option.setName('shares').setDescription('Number of shares').setRequired(true)),
)

command.addSubcommand(
    new SlashCommandSubcommandBuilder()
        .setName('value')
        .setDescription('Purchase by value')
        .addStringOption((option) => option.setName('symbol').setDescription('Stock ticker').setRequired(true))
        .addNumberOption((option) => option.setName('value').setDescription('Total stock value').setRequired(true)),
)

command.setChatInputCommandHandler(async (interaction) => {
    const client = await Client.getClientByUserId(interaction.user.id)

    const subcommand = interaction.options.getSubcommand()
    const transaction = await (async () => {
        switch (subcommand) {
            case 'max': {
                const symbol = interaction.options.getString('symbol', true)
                return client.buyMax(symbol)
            }
            case 'share': {
                const symbol = interaction.options.getString('symbol', true)
                const shares = interaction.options.getNumber('shares', true)
                if (shares <= 0) UserError.invalid('shares', shares)
                return client.buyShares(symbol, shares)
            }
            case 'value': {
                const symbol = interaction.options.getString('symbol', true)
                const value = interaction.options.getNumber('value', true)
                if (value <= 0) UserError.invalid('value', value)
                return client.buyValue(symbol, value)
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
