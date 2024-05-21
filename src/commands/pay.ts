import { Group } from '@/enums'
import Command from '@/libs/command'
import Client from '@/services/client'
import discord from '@/services/discord'
import { PayReply } from '@/views/pay'

const command = new Command()
    .setName('pay')
    .setDescription('Pay a user')
    .setGroup(Group.Trade)

command
    .addUserOption((option) =>
        option.setName('user').setDescription('Target user').setRequired(true),
    )
    .addNumberOption((option) =>
        option
            .setName('amount')
            .setDescription('Amount to pay')
            .setRequired(true),
    )

command.setChatInputCommandHandler(async (interaction) => {
    const userId = interaction.user.id
    const targetUserId = interaction.options.getUser('user', true).id
    const amount = interaction.options.getNumber('amount', true)

    const client = await Client.getClientByUserId(userId)
    const target = await Client.getClientByUserId(targetUserId)

    client.pay(target.model, amount)

    await client.save()
    await target.save()

    const reply = new PayReply({ userId, targetUserId, amount })
    await interaction.reply(reply)
})

discord.addCommand(command)
