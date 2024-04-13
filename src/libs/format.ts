export class Format {
    currencyPrefix = '$'
    currencySuffix = ''

    currency(amount: number) {
        return (
            this.currencyPrefix +
            parseFloat(amount.toFixed(4)) +
            this.currencySuffix
        )
    }

    percentage(decimal: number) {
        if (Number.isNaN(decimal) || Math.abs(decimal) === Infinity) return '0%'
        return `${parseFloat((decimal * 100).toFixed(2))}%`
    }

    bold(text: string) {
        return `**${text}**`
    }
}

const format = new Format()

export default format
