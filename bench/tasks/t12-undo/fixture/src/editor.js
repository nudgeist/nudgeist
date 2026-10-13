export class Editor {
  constructor(text = '') {
    this.text = text;
  }

  insert(pos, str) {
    this.text = this.text.slice(0, pos) + str + this.text.slice(pos);
  }

  delete(pos, len) {
    this.text = this.text.slice(0, pos) + this.text.slice(pos + len);
  }
}
