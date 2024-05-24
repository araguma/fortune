import { Group } from '@/enums'
import UserError from '@/errors/user'
import Command from '@/libs/command'
import { getEnvironmentVariable } from '@/libs/env'
import Tag from '@/libs/tag'
import { generateViewReply } from '@/libs/view'
import alpaca from '@/services/alpaca'
import discord from '@/services/discord'
import { MoversReply } from '@/views/movers'

const FIELD_LINE_LIMIT = parseInt(getEnvironmentVariable('FIELD_LINE_LIMIT'))

const command = new Command()
    .setName('movers')
    .setDescription('List top movers')
    .setGroup(Group.Trade)

command.addStringOption((option) =>
    option
        .setName('by')
        .setDescription('Mover type')
        .addChoices(
            {
                name: 'Gainers',
                value: 'gainers',
            },
            {
                name: 'Losers',
                value: 'losers',
            },
        )
        .setRequired(true),
)

command.setChatInputCommandHandler(async (interaction) => {
    const by = interaction.options.getString('by', true) as 'gainers' | 'losers'
    const movers = await alpaca.getMovers(FIELD_LINE_LIMIT, 'stocks')

    const reply = new MoversReply({
        userId: interaction.user.id,
        by,
        movers: movers[by],
    })
    await interaction.reply(reply)
})

command.setButtonHandler(async (interaction) => {
    const tag = new Tag(interaction.customId)

    switch (tag.getAction(true)) {
        case 'update': {
            const userId = tag.getData('userId', true)
            const by = tag.getData('by', true).toLowerCase() as
                | 'gainers'
                | 'losers'
            const movers = await alpaca.getMovers(FIELD_LINE_LIMIT, 'stocks')

            const reply = new MoversReply({
                userId,
                by,
                movers: movers[by],
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
