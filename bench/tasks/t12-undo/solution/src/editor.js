export class Editor {
  constructor(text = '') {
    this.text = text;
    this.past = [];
    this.future = [];
  }

  #edit(next) {
    this.past.push(this.text);
    if (this.past.length > 50) this.past.shift();
    this.future = [];
    this.text = next;
  }

  insert(pos, str) {
    this.#edit(this.text.slice(0, pos) + str + this.text.slice(pos));
  }

  delete(pos, len) {
    this.#edit(this.text.slice(0, pos) + this.text.slice(pos + len));
  }

  undo() {
    if (!this.past.length) return;
    this.future.push(this.text);
    this.text = this.past.pop();
  }

  redo() {
    if (!this.future.length) return;
    this.past.push(this.text);
    this.text = this.future.pop();
  }
}
