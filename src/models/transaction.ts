import { InferSchemaType, Schema, model } from 'mongoose'

export type Transaction = InferSchemaType<typeof TransactionSchema>

export const TransactionSchema = new Schema({
    clientId: {
        type: String,
        required: true,
    },
    symbol: {
        type: String,
        required: true,
    },
    quantity: {
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
