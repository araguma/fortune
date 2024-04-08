import mongoose from 'mongoose'

import { ClientModel } from '@/models/client'
import { ShareModel } from '@/models/share'
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

    async putClient(client: Awaited<ReturnType<Database['getClient']>>) {
        await ClientModel.findOneAndUpdate(
            { clientId: client.clientId },
            {
                clientId: client.clientId,
                balance: client.balance,
                watchlist: client.watchlist,
                lastClaim: client.lastClaim,
            },
            { upsert: true, new: true },
        ).catch(console.error)
        return client
    }

    async getShares(clientId: string, symbol: string) {
        return await ShareModel.findOne({ clientId, symbol }).catch(
            console.error,
        )
    }

    async getAllShares(clientId: string) {
        const shares = await ShareModel.find({ clientId }).catch(console.error)
        if (!shares) throw new Error('Failed to get shares')
        return shares
    }

    async putShares(
        clientId: string,
        symbol: string,
        quantity: number,
        seed: number,
    ) {
        const shares =
            quantity <= 0
                ? await ShareModel.findOneAndDelete({ clientId, symbol }).catch(
                      console.error,
                  )
                : await ShareModel.findOneAndUpdate(
                      { clientId, symbol },
                      { clientId, symbol, quantity, seed },
                      { upsert: true, new: true },
                  ).catch(console.error)
        if (!shares) throw new Error('Failed to update shares')
        return shares
    }

    async getTransactions(clientId: string, start: Date, end: Date) {
        const transactions = await TransactionModel.find({
            clientId,
            date: { $gte: start, $lt: end },
        }).catch(console.error)
        if (!transactions) throw new Error('Failed to get transactions')
        return transactions
    }

    async postTransaction(
        clientId: string,
        type: 'buy' | 'sell',
        symbol: string,
        quantity: number,
        total: number,
    ) {
        const transaction = await TransactionModel.create({
            clientId,
            type,
            symbol,
            quantity,
            total,
        }).catch(console.error)
        if (!transaction) throw new Error('Failed to create transaction')
        return transaction
    }
}

if (!process.env['MONGODB_URI']) throw new Error('MONGODB_URI not set')

const database = new Database(process.env['MONGODB_URI'])

export default database
