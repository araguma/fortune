import { InferSchemaType, Schema, model } from 'mongoose'

export type Transaction = InferSchemaType<typeof TransactionSchema>

export const TransactionSchema = new Schema({
    userId: {
        type: String,
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
                    default: 0,
                },
            },
        ],
        default: [],
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
})

export const TransactionModel = model('transaction', TransactionSchema)
