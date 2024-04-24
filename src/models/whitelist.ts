import { InferSchemaType, Schema, model } from 'mongoose'

export type Whitelist = InferSchemaType<typeof WhitelistSchema>

export const WhitelistSchema = new Schema({
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
        },
        default: {},
    },
})

export const WhitelistModel = model('whitelist', WhitelistSchema)
