export class StringConsumer {
  #pos = 0;

  public constructor(public readonly raw: string) {}

  public read(amnt: number) {
    const slice = this.peak(amnt);
    this.#pos += amnt;
    return slice;
  }

  public readWords(amnt: number): string[];
  public readWords(amnt?: 1 | undefined): string | undefined;
  public readWords(amnt = 1): string | undefined | string[] {
    const { pos, words } = this.peakWordsWithPos(amnt);
    this.#pos += pos;

    return amnt === 1 ? words[0] : words;
  }

  public peak(amnt: number) {
    return this.raw.slice(this.#pos, this.#pos + amnt);
  }

  public peakWords(amnt: number): string[];
  public peakWords(amnt?: 1 | undefined): string | undefined;
  public peakWords(amnt = 1): string | undefined | string[] {
    const { words } = this.peakWordsWithPos(amnt);
    return amnt === 1 ? words[0] : words;
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
