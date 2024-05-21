import { Group } from '@/enums'
import UserError from '@/errors/user'
import Command from '@/libs/command'
import { generatePortfolioReply } from '@/libs/portfolio'
import Tag from '@/libs/tag'
import { generateViewReply } from '@/libs/view'
import Client from '@/services/client'
import discord from '@/services/discord'

const command = new Command()
    .setName('portfolio')
    .setDescription('Display portfolio')
    .setGroup(Group.Trade)

command.addUserOption((option) =>
    option.setName('user').setDescription('Target user').setRequired(false),
)

command.setChatInputCommandHandler(async (interaction) => {
    const userId =
        interaction.options.getUser('user')?.id ?? interaction.user.id

    const reply = await generatePortfolioReply(userId, 1)
    await interaction.reply(reply)
})

command.setButtonHandler(async (interaction) => {
    const tag = new Tag(interaction.customId)

    switch (tag.getAction(true)) {
        case 'update': {
            const client = await Client.findById(tag.getData('clientId', true))
            const userId = client.model.userId

            const reply = await generatePortfolioReply(userId, 1)
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

            const reply = await generateViewReply(symbol, '5Y', userId)
            await interaction.reply(reply)
            break
        }
        case 'page': {
            const client = await Client.findById(tag.getData('clientId', true))
            const userId = client.model.userId

            const reply = await generatePortfolioReply(
                userId,
                parseInt(interaction.values[0] ?? '1'),
            )
            await interaction.update(reply)
            break
        }
    }
})

discord.addCommand(command)
