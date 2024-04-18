const predictions = ['open', 'predict', 'close', 'settle']

export default function getGroup(command: string) {
    return predictions.includes(command) ? 'predictions' : 'trades'
}
