import mongoose from 'mongoose'

import { ClientModel } from '@/models/client'
import { TransactionModel } from '@/models/transaction'

export class Database {
    constructor(uri: string) {
        mongoose.connect(uri).catch(console.error)
    }

    async getClient(clientId: string) {
        const client = await ClientModel.findOneAndUpdate(
            { clientId },
            { clientId },
            { upsert: true, new: true },
        ).catch(console.error)
        if (!client) throw new Error('Failed to get client')
        return client
    }

    async getTransactionsByDate(clientId: string, start: Date, end: Date) {
        const transactions = await TransactionModel.find({
            clientId,
            date: { $gte: start, $lt: end },
        }).catch(console.error)
        if (!transactions) throw new Error('Failed to get transactions')
        return transactions
    }

    async postTransaction(
        clientId: string,
        symbol: string,
        quantity: number,
    ) {
        const transaction = await TransactionModel.create({
            clientId,
            symbol,
            quantity,
        }).catch(console.error)
        if (!transaction) throw new Error('Failed to create transaction')
        return transaction
    }
}

if (!process.env['MONGODB_URI']) throw new Error('MONGODB_URI not set')

const database = new Database(process.env['MONGODB_URI'])

export default database
