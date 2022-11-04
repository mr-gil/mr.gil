import { APIDoc } from 'guilded-api-typings';

export class DocBuilder {
  content: string;
  title?: string;

  constructor(data: APIDoc) {
    this.title = data.title || 'New Document';
    this.content = data.content;
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
