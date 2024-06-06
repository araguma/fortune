import { InferSchemaType, Schema } from 'mongoose'

import database from '@/services/database'

export const PredictionSchema = new Schema({
    status: {
        type: String,
        enum: ['opened', 'closed', 'settled'],
        default: 'opened',
        required: true,
    },
    prompt: {
        type: String,
        required: true,
    },
    options: {
        type: [String],
        default: [],
        required: true,
    },
    pool: {
        type: [Number],
        default: [],
        required: true,
    },
    minimum: {
        type: Number,
        default: 0,
        required: true,
    },
    bets: {
        type: Map,
        of: {
            option: {
                type: Number,
                required: true,
            },
            amount: {
                type: Number,
                required: true,
            },
        },
        default: {},
        required: true,
    },
    result: {
        type: Number,
        default: -1,
        required: true,
    },
})

export const PredictionModel = database.connection.model('prediction', PredictionSchema)

export type PredictionType = InferSchemaType<typeof PredictionSchema>
