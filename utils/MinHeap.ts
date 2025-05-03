export default class MinHeap<T> {
    private data: T[] = [];
    private comparator: (a: T, b: T) => number;
  
    constructor(comparator: (a: T, b: T) => number) {
      this.comparator = comparator;
    }
  
    private parent(index: number) { return Math.floor((index - 1) / 2); }
    private left(index: number) { return index * 2 + 1; }
    private right(index: number) { return index * 2 + 2; }
  
    private swap(i: number, j: number) {
      [this.data[i], this.data[j]] = [this.data[j], this.data[i]];
    }
  
    private heapifyUp(index: number) {
      while (index > 0 && this.comparator(this.data[index], this.data[this.parent(index)]) < 0) {
        this.swap(index, this.parent(index));
        index = this.parent(index);
      }
    }
  
    private heapifyDown(index: number) {
      let smallest = index;
      const left = this.left(index);
      const right = this.right(index);
  
      if (left < this.data.length && this.comparator(this.data[left], this.data[smallest]) < 0) {
        smallest = left;
      }
      if (right < this.data.length && this.comparator(this.data[right], this.data[smallest]) < 0) {
        smallest = right;
      }
      if (smallest !== index) {
        this.swap(index, smallest);
        this.heapifyDown(smallest);
      }
    }
  
    insert(item: T): void {
      this.data.push(item);
      this.heapifyUp(this.data.length - 1);
    }
  
    extractMin(): T | undefined {
      if (this.isEmpty()) return undefined;
      const min = this.data[0];
      const last = this.data.pop()!;
      if (this.data.length > 0) {
        this.data[0] = last;
        this.heapifyDown(0);
      }
      return min;
    }
  
    peek(): T | undefined {
      return this.data[0];
    }
  
    remove(item: T): void {
      const index = this.data.findIndex((x) => x === item);
      if (index === -1) return;
      const last = this.data.pop()!;
      if (index < this.data.length) {
        this.data[index] = last;
        this.heapifyDown(index);
        this.heapifyUp(index);
      }
    }
  
    isEmpty(): boolean {
      return this.data.length === 0;
    }
  }
  