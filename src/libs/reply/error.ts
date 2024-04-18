import { InteractionReplyOptions } from 'discord.js'

export class ErrorReply {
    constructor(public message: string) {}

    toJSON(): InteractionReplyOptions {
        return {
            embeds: [
                {
                    title: 'Error',
                    description: this.message,
                    color: 0x000000,
                },
            ],
            ephemeral: true,
        }
    }
}
