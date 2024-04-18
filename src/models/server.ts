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
            trades: {
                type: Boolean,
            },
            predictions: {
                type: Boolean,
            },
            admin: {
                type: Boolean,
            },
        },
        default: {},
    },
})

export const ServerModel = model('server', ServerSchema)
