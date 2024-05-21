import { InferSchemaType, Schema } from 'mongoose'

import database from '@/services/database'

export const TransactionSchema = new Schema({
    userId: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['claim', 'buy', 'sell'],
        required: true,
    },
    stocks: {
        type: [
            {
                symbol: {
                    type: String,
                    required: true,
                },
                shares: {
                    type: Number,
                    required: true,
                },
                price: {
                    type: Number,
                    required: true,
                },
            },
        ],
        default: [],
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
        required: true,
    },
})

export const TransactionModel = database.connection.model(
    'transaction',
    TransactionSchema,
)

export type TransactionType = InferSchemaType<typeof TransactionSchema>
