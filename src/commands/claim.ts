import { Group } from '@/enums'
import Command from '@/libs/command'
import {
    generateTransactionReply,
    handleTransactionStringSelectMenu,
} from '@/libs/transaction'
import Client from '@/services/client'
import discord from '@/services/discord'

const command = new Command()
    .setName('claim')
    .setDescription('Receive a random stock')
    .setGroup(Group.Trade)

command.setChatInputCommandHandler(async (interaction) => {
    const client = await Client.getClientByUserId(interaction.user.id)

    const transaction = await client.claim()

    await client.save()
    await transaction.save()

    const reply = await generateTransactionReply(transaction.getId(), 1)
    await interaction.reply(reply)
})

command.setStringSelectMenuHandler(handleTransactionStringSelectMenu)

discord.addCommand(command)
