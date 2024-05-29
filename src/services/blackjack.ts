import { HydratedDocument } from 'mongoose'

import ranks from '@/data/ranks'
import UserError from '@/errors/user'
import random from '@/libs/random'
import { BlackjackModel, BlackjackType } from '@/models/blackjack'
import { CardType } from '@/models/card'
import { ClientType } from '@/models/client'

export default class Blackjack {
    public constructor(public model: HydratedDocument<BlackjackType>) {}

    public static async findById(id: string) {
        const blackjack = await BlackjackModel.findById(id)
        if (!blackjack) throw new Error('Blackjack not found')
        return new Blackjack(blackjack)
    }

    public static create(
        userId: BlackjackType['userId'],
        bet: BlackjackType['bet'],
    ) {
        const model = new BlackjackModel({
            userId,
            bet,
        })
        return new Blackjack(model)
    }

    public initialize(client: ClientType) {
        this.hit(client)
        this.hit(client)
        this.model.dealer.push(random.card())
        client.balance -= this.model.bet
        if (client.balance < 0) UserError.insufficientBalance()
    }

    public hit(client: ClientType) {
        if (this.model.winner !== 'none') return
        this.model.player.push(random.card())
        const playerTotal = calculateTotal(this.model.player)
        if (playerTotal === 21) {
            this.model.winner = 'player'
            client.balance += this.model.bet * (this.model.double ? 2 : 1) * 2
        } else if (playerTotal > 21) {
            this.model.winner = 'dealer'
        }
    }

    public stand(client: ClientType) {
        if (this.model.winner !== 'none') return
        while (calculateTotal(this.model.dealer) < 17) {
            this.model.dealer.push(random.card())
        }
        const playerTotal = calculateTotal(this.model.player)
        const dealerTotal = calculateTotal(this.model.dealer)
        if (dealerTotal > 21 || dealerTotal < playerTotal) {
            this.model.winner = 'player'
            client.balance += this.model.bet * (this.model.double ? 2 : 1) * 2
        } else if (dealerTotal === 21 || dealerTotal >= playerTotal) {
            this.model.winner = 'dealer'
        }
    }

    public double(client: ClientType) {
        if (this.model.double) return
        this.model.double = true
        client.balance -= this.model.bet
        if (client.balance < 0) UserError.insufficientBalance()
        this.hit(client)
        this.stand(client)
    }

    public getPlayerTotal() {
        return calculateTotal(this.model.player)
    }

    public getDealerTotal() {
        return calculateTotal(this.model.dealer)
    }

    public getId() {
        return this.model._id.toHexString()
    }

    public async save() {
        await this.model.save()
    }
}

const rankValues: Record<(typeof ranks)[number], number> = {
    'A': 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '10': 10,
    'J': 10,
    'Q': 10,
    'K': 10,
}

function calculateTotal(cards: CardType[]) {
    return cards
        .map((card) => rankValues[card.rank])
        .sort((a, b) => b - a)
        .reduce((acc, value) => {
            if (value === 1 && acc + 11 <= 21) return acc + 11
            return acc + value
        }, 0)
}
