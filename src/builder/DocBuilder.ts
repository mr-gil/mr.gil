export class DocBuilder {
  content: string;
  title?: string;

  constructor(data?: docBuilderOptions) {
    this.title = data?.title || 'New Document';
    this.content = data?.content;
  }

  setTitle(title?: string) {
    this.title = title;
    return this;
  }

  setContent(content?: string) {
    this.content = content;
    return this;
  }
}

export type docBuilderOptions = {
  title?: string;
  content?: string;
};
