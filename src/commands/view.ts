import { Group } from '@/enums'
import Command from '@/libs/command'
import Tag from '@/libs/tag'
import { generateViewReply } from '@/libs/view'
import discord from '@/services/discord'
import { timeframes } from '@/views/view'

const command = new Command()
    .setName('view')
    .setDescription('Inspect a stock')
    .setGroup(Group.Trade)

command
    .addStringOption((option) =>
        option
            .setName('symbol')
            .setDescription('Stock ticker')
            .setRequired(true),
    )
    .addStringOption((option) =>
        option
            .setName('timeframe')
            .setDescription('Timeframe')
            .addChoices(
                ...Object.keys(timeframes).map((timeframe) => ({
                    name: timeframe,
                    value: timeframe,
                })),
            )
            .setRequired(true),
    )
    .addUserOption((option) =>
        option.setName('as').setDescription('View as user').setRequired(false),
    )

command.setChatInputCommandHandler(async (interaction) => {
    const symbol = interaction.options.getString('symbol', true)
    const timeframe = interaction.options.getString(
        'timeframe',
        true,
    ) as keyof typeof timeframes
    const userId = interaction.options.getUser('as')?.id ?? interaction.user.id

    const reply = await generateViewReply(symbol, timeframe, userId)
    await interaction.reply(reply)
})

command.setButtonHandler(async (interaction) => {
    const tag = new Tag(interaction.customId)

    switch (tag.getAction(true)) {
        case 'update': {
            const symbol = tag.getData('symbol', true)
            const timeframe = tag.getData(
                'timeframe',
                true,
            ) as keyof typeof timeframes
            const userId = tag.getData('userId', true)

            const reply = await generateViewReply(symbol, timeframe, userId)
            await interaction.message.edit(reply)
            await interaction.deferUpdate()

            break
        }
    }
})

command.setStringSelectMenuHandler(async (interaction) => {
    const tag = new Tag(interaction.customId)

    switch (tag.getAction(true)) {
        case 'timeframe': {
            const symbol = tag.getData('symbol', true)
            const timeframe = (interaction.values[0] ??
                '1D') as keyof typeof timeframes
            const userId = tag.getData('userId', true)

            const reply = await generateViewReply(symbol, timeframe, userId)
            await interaction.message.edit(reply)
            await interaction.deferUpdate()

            break
        }
    }
})

discord.addCommand(command)
