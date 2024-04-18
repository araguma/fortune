import { SlashCommandBuilder } from 'discord.js'

import divider from '@/images/divider'
import database from '@/libs/database'
import discord from '@/libs/discord'
import { UserError } from '@/libs/error'
import format from '@/libs/format'

discord.addCommand({
    descriptor: new SlashCommandBuilder()
        .setName('pay')
        .setDescription('Pay a user')
        .addUserOption((option) =>
            option
                .setName('user')
                .setDescription('Target user')
                .setRequired(true),
        )
        .addNumberOption((option) =>
            option
                .setName('amount')
                .setDescription('Amount to pay')
                .setRequired(true),
        )
        .toJSON(),
    handler: async (interaction) => {
        const user = interaction.options.getUser('user', true)
        const amount = interaction.options.getNumber('amount', true)

        if (amount <= 0) UserError.throw('Invalid amount')

        const client = await database.getClientById(interaction.user.id)
        const target = await database.getClientById(user.id)

        if (client.balance < amount) UserError.throw('Insufficient funds')

        client.balance -= amount
        target.balance += amount

        await client.save()
        await target.save()

        await interaction.reply({
            embeds: [
                {
                    color: 0xe74c3c,
                    author: {
                        name: '---',
                    },
                    title: `Target Paid`,
                    fields: [
                        {
                            name: 'Sender',
                            value: `<@${interaction.user.id}>`,
                            inline: true,
                        },
                        {
                            name: 'Target',
                            value: `<@${user.id}>`,
                            inline: true,
                        },
                        {
                            name: 'Amount',
                            value: format.currency(amount),
                            inline: true,
                        },
                    ],
                    image: {
                        url: 'attachment://divider.png',
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
        })
    },
})
