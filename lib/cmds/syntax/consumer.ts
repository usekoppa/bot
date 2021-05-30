// StringConsumer allows you to read a string in controlled ways with a position
// to keep track of how much of the string you have exhausted.
export class StringConsumer {
  #pos = 0;

  public constructor(public readonly raw: string) {}

  public get position() {
    return this.#pos;
  }

  public get current() {
    return this.raw.slice(this.#pos);
  }

  public read(amnt: number) {
    amnt = Math.min(this.raw.length - this.#pos + 1, amnt);
    const slice = this.peak(amnt);
    this.#pos += amnt;
    return slice;
  }

  public readRest() {
    const amnt = this.raw.length - this.#pos + 1;
    const slice = this.peak(amnt);
    this.#pos = this.raw.length - 1;
    return slice;
  }

  public readWord(): string | undefined {
    const [word] = this.readWords(1);
    return word;
  }

  public readWords(amnt: number): string[] {
    const { pos, words } = this.peakWordsWithPos(amnt);
    this.#pos += pos;

    return words;
  }

  public peak(amnt: number) {
    return this.raw.slice(this.#pos, this.#pos + amnt);
  }

  public peakRest() {
    const amnt = this.raw.length - this.#pos + 1;
    return this.peak(amnt);
  }

  public peakWord() {
    const [word] = this.peakWords(1);
    return word;
  }

  public peakWords(amnt: number): string[] {
    return this.peakWordsWithPos(amnt).words;
  }

  private peakWordsWithPos(amnt: number): { pos: number; words: string[] } {
    const words = this.raw.split(/\s/g);
    let pos = 0;
    const collected: string[] = [];
    for (const word of words) {
      if (pos >= this.#pos) {
        collected.push(word);
        if (amnt === collected.length) break;
      }

      pos += word.length + 1;
    }

    // Do this because otherwise it would be assuming we accounted for another space at the end.
    pos -= 1;

    return { words: collected, pos };
  }
}
