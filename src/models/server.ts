import { InferSchemaType, Schema, model } from 'mongoose'

export type Server = InferSchemaType<typeof ServerSchema>

export const ServerSchema = new Schema({
    guildId: {
        type: String,
        required: true,
    },
    channels: {
        type: Map,
        of: {
            predictions: {
                type: Boolean,
            },
            trades: {
                type: Boolean,
            },
        },
        default: {},
    },
})

export const ServerModel = model('server', ServerSchema)
