export class ListBuilder {
  message?: string;
  note?: { content?: string };

  constructor(data: listBuilderOptions) {
    this.message = data.message || 'New ListItem';
    this.note = data.note;
  }

  setMessage(message?: string) {
    this.message = message;
    return this;
  }

  setContent(content?: string) {
    if (!this.note) this.note = { content: null };

    this.note.content = content;
    return this;
  }
}

export type listBuilderOptions = {
  message?: string;
  note?: { content?: string };
};
