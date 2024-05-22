export default class Pagination<T> {
    private page = 1

    public constructor(
        private items: T[],
        private max: number,
        private reverse = false,
    ) {}

    public setItems(items: T[]) {
        this.items = items
    }

    public getItems() {
        return this.items
    }

    public setMax(max: number) {
        this.max = max
    }

    public getMax() {
        return this.max
    }

    public setReverse(reverse: boolean) {
        this.reverse = reverse
    }

    public getReverse() {
        return this.reverse
    }

    public setPage(page: number) {
        this.page = page
    }

    public getPage() {
        return this.page
    }

    public getLength() {
        return this.items.length
    }

    public getPages() {
        return Math.max(Math.ceil(this.getLength() / this.max), 1)
    }

    public getStart() {
        if (this.reverse) {
            return Math.max(0, this.getLength() - this.page * this.max)
        } else {
            return Math.min(this.getLength(), (this.page - 1) * this.max)
        }
    }

    public getEnd() {
        if (this.reverse) {
            return this.getLength() - (this.page - 1) * this.max
        } else {
            return Math.min(this.getLength(), this.page * this.max)
        }
    }

    public getCurrent() {
        return this.items.slice(this.getStart(), this.getEnd())
    }
}
