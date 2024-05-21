import { Group } from '@/enums'
import Command from '@/libs/command'
import { getEnvironmentVariable } from '@/libs/env'
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
        by,
        movers: movers[by],
    })
    await interaction.reply(reply)
})

discord.addCommand(command)
