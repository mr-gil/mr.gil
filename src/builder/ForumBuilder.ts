export class ForumBuilder {
  content: string;
  title?: string;

  constructor(data?: forumBuilderOptions) {
    this.title = data?.title || 'New Topic';
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

export type forumBuilderOptions = {
  title?: string;
  content?: string;
};
