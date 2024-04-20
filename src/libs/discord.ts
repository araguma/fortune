import {
    Client,
    ClientOptions,
    GatewayIntentBits,
    Interaction,
    Routes,
} from 'discord.js'

import commandGroupMap from '@/data/groups'
import database from '@/libs/database'
import { UserError } from '@/libs/error'
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

        try {
            const group = commandGroupMap[interaction.commandName]
            if (!group) UserError.throw('This command does not exist')

            if (
                interaction.guildId &&
                group !== 'admin' &&
                group !== 'threads'
            ) {
                const server = await database.getServerByGuildId(
                    interaction.guildId,
                )
                if (!server.channels.get(interaction.channelId)?.[group])
                    UserError.throw(
                        `This channel is not whitelisted for ${group}`,
                    )
            }

            const command = this.commands[interaction.commandName]
            if (!command) UserError.throw('This command does not exist')

            await command.handler(interaction)
        } catch (error) {
            if (error instanceof UserError) {
                await interaction
                    .reply(new ErrorReply(error.message).toJSON())
                    .catch(console.error)
            } else {
                console.error(error)
                await interaction
                    .reply(
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
