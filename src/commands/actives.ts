import { Group } from '@/enums'
import UserError from '@/errors/user'
import Command from '@/libs/command'
import { getEnvironmentVariable } from '@/libs/env'
import Tag from '@/libs/tag'
import { generateViewReply } from '@/libs/view'
import alpaca from '@/services/alpaca'
import discord from '@/services/discord'
import { ActivesReply } from '@/views/actives'

const FIELD_LINE_LIMIT = parseInt(getEnvironmentVariable('FIELD_LINE_LIMIT'))

const command = new Command()
    .setName('actives')
    .setDescription('List active stocks')
    .setGroup(Group.Trade)

command.addStringOption((option) =>
    option
        .setName('by')
        .setDescription('Sort by')
        .addChoices(
            {
                name: 'Volume',
                value: 'volume',
            },
            {
                name: 'Trades',
                value: 'trades',
            },
        )
        .setRequired(true),
)

command.setChatInputCommandHandler(async (interaction) => {
    const by = interaction.options.getString('by', true) as 'volume' | 'trades'

    const actives = await alpaca.getActives(FIELD_LINE_LIMIT, by)

    const reply = new ActivesReply({
        userId: interaction.user.id,
        by,
        actives,
    })
    await interaction.reply(reply)
})

command.setButtonHandler(async (interaction) => {
    const tag = new Tag(interaction.customId)

    switch (tag.getAction(true)) {
        case 'update': {
            const userId = tag.getData('userId', true)
            const by = tag.getData('by', true) as 'volume' | 'trades'
            const actives = await alpaca.getActives(FIELD_LINE_LIMIT, by)

            const reply = new ActivesReply({
                userId,
                by,
                actives,
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
            const userId = tag.getData('userId', true)
            const symbol = interaction.values[0]

            if (!symbol) UserError.missingSymbol()

            const reply = await generateViewReply(symbol, '1D', userId)
            await interaction.reply(reply)
            break
        }
    }
})

discord.addCommand(command)
