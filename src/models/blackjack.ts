import { InferSchemaType, Schema } from 'mongoose'

import { CardSchema } from '@/models/card'
import database from '@/services/database'

export const BlackjackSchema = new Schema({
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
    double: {
        type: Boolean,
        default: false,
        required: true,
    },
    bet: {
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

export const BlackjackModel = database.connection.model('blackjack', BlackjackSchema)

export type BlackjackType = InferSchemaType<typeof BlackjackSchema>
