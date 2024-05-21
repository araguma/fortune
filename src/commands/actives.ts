import { Group } from '@/enums'
import Command from '@/libs/command'
import { getEnvironmentVariable } from '@/libs/env'
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
        by,
        actives,
    })
    await interaction.reply(reply)
})

discord.addCommand(command)
