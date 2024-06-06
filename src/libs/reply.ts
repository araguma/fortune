import { Canvas } from 'canvas'
import { ActionRowBuilder, AttachmentPayload, ButtonBuilder, EmbedBuilder, StringSelectMenuBuilder } from 'discord.js'

export default abstract class Reply<D extends object> extends EmbedBuilder {
    public embeds: EmbedBuilder[] = []
    public files: AttachmentPayload[] = []
    public canvas: Canvas | null = null
    public components: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] = []
    public ephemeral = false

    public constructor() {
        super()
        this.embeds = [this]
    }

    public setCanvas(canvas: Canvas) {
        this.canvas = canvas
        this.files[0] = {
            attachment: this.canvas.toBuffer(),
            name: 'image.png',
        }
        this.setImage(`attachment://image.png`)
        return this
    }

    public setComponents(components: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[]) {
        this.components = components
        return this
    }

    public setEphemeral(ephemeral: boolean) {
        this.ephemeral = ephemeral
        return this
    }

    public abstract update(data: D): void
}

export type BaseReplyData = object
