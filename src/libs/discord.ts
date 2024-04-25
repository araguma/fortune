import {
    Client,
    ClientOptions,
    GatewayIntentBits,
    Interaction,
    Routes,
} from 'discord.js'

import database from '@/libs/database'
import { UserError } from '@/libs/error'
import getGroup from '@/libs/group'
import { ErrorReply } from '@/libs/reply/error'
import { Command } from '@/types'

export class Discord extends Client {
    commands: Record<string, Command> = {}

    constructor(token: string, options: ClientOptions) {
        super(options)
        void this.on('ready', this.handleReady.bind(this))
            .on('interactionCreate', this.handleInteraction.bind(this))
            .login(token)
    }

    handleReady(client: Client<true>) {
        console.log(`Logged in as ${client.user.tag}`)
        this.registerCommands()
    }

    async handleInteraction(interaction: Interaction) {
        if (!interaction.isChatInputCommand()) return

        const ephemeral = !!interaction.channel?.isThread()
        await interaction.deferReply({ ephemeral })

        try {
            if (
                interaction.guildId &&
                !interaction.channel?.isThread() &&
                interaction.commandName !== 'whitelist'
            ) {
                const group = getGroup(interaction.commandName)
                const whitelist = await database.getWhitelistByGuildId(
                    interaction.guildId,
                )
                if (!whitelist.channels.get(interaction.channelId)?.[group])
                    UserError.throw(
                        `This channel is not whitelisted for ${group}`,
                    )
            }

            const command = this.commands[interaction.commandName]
            if (!command) UserError.throw('This command does not exist')

            const reply = await command.handler(interaction)
            await interaction.editReply(reply)
        } catch (error) {
            if (error instanceof UserError) {
                await interaction
                    .editReply(new ErrorReply(error.message).toJSON())
                    .catch(console.error)
            } else {
                console.error(error)
                await interaction
                    .editReply(
                        new ErrorReply(
                            'There was an error while executing this command',
                        ).toJSON(),
                    )
                    .catch(console.error)
            }
        }
    }

    addCommand(command: Command) {
        this.commands[command.descriptor.name] = command
        this.registerCommands()
    }

    registerCommands() {
        if (!this.user) return
        this.rest
            .put(Routes.applicationCommands(this.user.id), {
                body: Object.values(this.commands).map(
                    (command) => command.descriptor,
                ),
            })
            .catch(console.error)
    }
}

if (!process.env['DISCORD_TOKEN']) throw new Error('DISCORD_TOKEN not set')

const discord = new Discord(process.env['DISCORD_TOKEN'], {
    intents: [GatewayIntentBits.Guilds],
})

export default discord
