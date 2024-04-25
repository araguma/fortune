import { InferSchemaType, Schema, model } from 'mongoose'

export type Client = InferSchemaType<typeof ClientSchema>

export const ClientSchema = new Schema({
    userId: {
        type: String,
        required: true,
    },
    portfolio: {
        type: Map,
        of: {
            shares: {
                type: Number,
                required: true,
                default: 0,
            },
            seed: {
                type: Number,
                required: true,
                default: 0,
            },
        },
        default: {},
    },
    seed: {
        type: Number,
        required: true,
        default: 0,
    },
    balance: {
        type: Number,
        required: true,
        default: 0,
    },
    watchlist: {
        type: [String],
        required: true,
        default: [],
    },
    lastClaim: {
        type: Date,
        required: true,
        default: new Date(0),
    },
    claims: {
        type: Number,
        required: true,
        default: 0,
    },
})

export const ClientModel = model('client', ClientSchema)
