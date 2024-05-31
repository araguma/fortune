import { InferSchemaType, Schema } from 'mongoose'

import { CardSchema } from '@/models/card'
import database from '@/services/database'

export const WarSchema = new Schema({
    userId: {
        type: String,
        required: true,
    },
    winner: {
        type: String,
        enum: ['tbd', 'player', 'dealer', 'none'],
        default: 'tbd',
        required: true,
    },
    action: {
        type: String,
        enum: ['tbd', 'surrender', 'war'],
        default: 'tbd',
    },
    bet: {
        type: Number,
        required: true,
    },
    tieBet: {
        type: Number,
        required: true,
    },
    delta: {
        type: Number,
        default: 0,
        required: true,
    },
    playerCards: {
        type: [CardSchema],
        default: [],
        required: true,
    },
    dealerCards: {
        type: [CardSchema],
        default: [],
        required: true,
    },
})

export const WarModel = database.connection.model('war', WarSchema)

export type WarType = InferSchemaType<typeof WarSchema>
