import { HydratedDocument } from 'mongoose'

import { TransactionModel, TransactionType } from '@/models/transaction'

export default class Transaction {
    public constructor(public model: HydratedDocument<TransactionType>) {}

    public static async findById(id: string) {
        const transaction = await TransactionModel.findById(id)
        if (!transaction) throw new Error('Transaction not found')
        return new Transaction(transaction)
    }

    public static create(userId: TransactionType['userId'], type: TransactionType['type']) {
        const model = new TransactionModel({
            userId,
            type,
        })
        return new Transaction(model)
    }

    public addStock(symbol: string, shares: number, price: number) {
        symbol = symbol.toUpperCase()
        this.model.stocks.push({
            symbol,
            shares,
            price,
        })
    }

    public getTotal() {
        return this.model.stocks.reduce((acc, stock) => acc + stock.shares * stock.price, 0)
    }

    public getId() {
        return this.model._id.toHexString()
    }

    public async save() {
        return await this.model.save()
    }
}
