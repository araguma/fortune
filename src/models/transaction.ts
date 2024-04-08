import { InferSchemaType, Schema, model } from 'mongoose'

export type Transaction = InferSchemaType<typeof TransactionSchema>

export const TransactionSchema = new Schema({
    clientId: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['buy', 'sell'],
    },
    symbol: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    total: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
})

export const TransactionModel = model('transaction', TransactionSchema)
