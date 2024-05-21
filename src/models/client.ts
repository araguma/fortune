import { InferSchemaType, Schema } from 'mongoose'

import database from '@/services/database'

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
                default: 0,
                required: true,
            },
            seed: {
                type: Number,
                default: 0,
                required: true,
            },
        },
        default: {},
        required: true,
    },
    watchlist: {
        type: [String],
        default: [],
        required: true,
    },
    seed: {
        type: Number,
        default: 0,
        required: true,
    },
    balance: {
        type: Number,
        default: 0,
        required: true,
    },
    lastClaim: {
        type: Date,
        default: new Date(0),
        required: true,
    },
    claims: {
        type: Number,
        default: 0,
        required: true,
    },
})

export const ClientModel = database.connection.model('client', ClientSchema)

export type ClientType = InferSchemaType<typeof ClientSchema>
