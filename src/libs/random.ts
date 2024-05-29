import ranks from '@/data/ranks'
import suits from '@/data/suits'
import { CardType } from '@/models/card'

function sample<T>(arr: readonly T[] | T[]): T {
    const sample = arr[Math.floor(Math.random() * arr.length)]
    if (!sample) throw new Error('Array is empty')
    return sample
}

function card(): CardType {
    return {
        rank: sample(ranks),
        suit: sample(suits),
    }
}

const random = {
    sample,
    card,
}

export default random
