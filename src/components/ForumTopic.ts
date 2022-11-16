import { APIForumTopic, Routes } from 'guilded-api-typings';
import { GuildedApiError } from '../errors/apiError';
import { topicReaction } from '../events/TopicReactionEvents';
import { ForumChannel } from './Channel';
import { Mentions } from './Message';
import { Emote } from './Server';
import { Member } from './User';
import { Webhook } from './Webhook';

export class ForumTopic {
  bumpedAt?: Date;
  channelId: string;
  content: string;
  createdAt: Date;
  createdBy: string;
  id: number;
  locked?: boolean;
  mentions?: Mentions;
  pinned?: boolean;
  serverId: string;
  title: string;
  updatedAt?: Date;
  webhook?: Webhook | boolean;
  obj?: { channel: ForumChannel; member?: Member | Webhook };

  constructor(
    forum: (APIForumTopic & { isLocked: boolean; isPinned: boolean }) | any,
    obj: { channel: ForumChannel; member?: Member | Webhook },
    cache = obj.channel.client.cacheTopics ?? true
  ) {
    Object.defineProperty(this, 'obj', {
      enumerable: false,
      writable: false,
      value: obj
    });

    this.pinned = forum.isPinned;
    this.locked = forum.isLocked;
    this.bumpedAt = new Date(forum.bumpedAt);
    this.channelId = forum.channelId;
    this.content = forum.content;
    this.createdBy = forum.createdBy;
    this.createdAt = new Date(this.createdAt);
    this.id = forum.id;
    this.mentions = new Mentions(forum.mentions);
    this.serverId = forum.serverId;
    this.title = forum.title;
    this.updatedAt = new Date(forum.updatedAt);
    this.webhook = forum.createdByWebhookId ? (obj.member as Webhook) : false;
    if (cache) this.channel.forums.cache.set(this.id, this);
  }

  get channel() {
    return this.obj.channel;
  }

  get author() {
    return this.obj.member;
  }

  get server() {
    return this.obj.channel.server;
  }

  delete(): Promise<boolean> {
    const link = Routes.forumTopic(this.channelId, this.id);

    return new Promise(async (resolve) => {
      try {
        await this.channel.client.rest.delete(link);

        resolve(true);
      } catch (err) {
        resolve(false);
        throw new GuildedApiError(err);
      }
    });
  }

  edit(title?: string, content?: string): Promise<ForumTopic | boolean> {
    const link = Routes.forumTopic(this.channelId, this.id);

    return new Promise(async (resolve) => {
      try {
        const { forumTopic }: { forumTopic: APIForumTopic } =
          await this.channel.client.rest.patch(link, {
            body: JSON.stringify({ title, content })
          });

        const fr = new ForumTopic(forumTopic, {
          channel: this.channel,
          member: this.author
        });

        resolve(fr);
      } catch (err: any) {
        throw new GuildedApiError(err);
      }
    });
  }

  pin(): Promise<boolean> {
    const link = Routes.forumTopicPin(this.channel.id, this.id);

    return new Promise(async (resolve) => {
      try {
        await this.channel.client.rest.put(link);
        resolve(true);
      } catch (err) {
        resolve(false);
        throw new GuildedApiError(err);
      }
    });
  }

  unpin(): Promise<boolean> {
    const link = Routes.forumTopicPin(this.channel.id, this.id);

    return new Promise(async (resolve) => {
      try {
        await this.channel.client.rest.delete(link);
        resolve(true);
      } catch (err) {
        resolve(false);
        throw new GuildedApiError(err);
      }
    });
  }

  react(emojiId: number): Promise<boolean> {
    const link =
      Routes.forumTopic(this.channel.id, this.id) + `/emotes/${emojiId}`;

    return new Promise(async (resolve) => {
      try {
        await this.channel.client.rest.put(link);
        resolve(true);
      } catch (err) {
        resolve(false);
        throw new GuildedApiError(err);
      }
    });
  }

  unreact(emojiId: number): Promise<boolean> {
    const link =
      Routes.forumTopic(this.channel.id, this.id) + `/emotes/${emojiId}`;

    return new Promise(async (resolve) => {
      try {
        await this.channel.client.rest.delete(link);
        resolve(true);
      } catch (err) {
        resolve(false);
        throw new GuildedApiError(err);
      }
    });
  }

  lock(): Promise<boolean> {
    const link = Routes.forumTopicLock(this.channel.id, this.id);

    return new Promise(async (resolve) => {
      try {
        await this.channel.client.rest.put(link);
        resolve(true);
      } catch (err) {
        resolve(false);
        throw new GuildedApiError(err);
      }
    });
  }

  unlock(): Promise<boolean> {
    const link = Routes.forumTopicLock(this.channel.id, this.id);

    return new Promise(async (resolve) => {
      try {
        await this.channel.client.rest.delete(link);
        resolve(true);
      } catch (err) {
        resolve(false);
        throw new GuildedApiError(err);
      }
    });
  }

  comment(content: string): Promise<ForumTopicComment | boolean> {
    const link = Routes.forumTopic(this.channel.id, this.id) + `/comments`;

    return new Promise(async (resolve) => {
      try {
        const { forumTopicComment } = await this.channel.client.rest.post(
          link,
          {
            body: JSON.stringify({ content: content })
          }
        );

        const comment = new ForumTopicComment(forumTopicComment, {
          topic: this,
          member: await this.channel.server.members.fetch(
            this.createdBy,
            this.serverId
          )
        });
        resolve(comment);
      } catch (err) {
        resolve(false);
        throw new GuildedApiError(err);
      }
    });
  }
}

export class ForumTopicReaction extends String {
  channelId: string;
  createdBy: string;
  emote: Emote;
  id: number;
  topic: ForumTopic;
  forumTopicId: number;
  reactedBy: Member;

  constructor(
    reaction: topicReaction,
    obj: { topic: ForumTopic; member: Member }
  ) {
    super();
    this.topic = obj.topic;
    this.reactedBy = obj.member;
    this.createdBy = reaction.createdBy;
    this.forumTopicId = reaction.forumTopicId;
    this.emote = new Emote(reaction.emote);
    this.id = this.emote.id;
    this.channelId = reaction.channelId;
  }

  remove() {
    const link =
      Routes.forumTopic(this.channelId, this.id) + `/emotes/${this.emote.id}`;

    return new Promise(async (resolve) => {
      try {
        await this.topic.channel.client.rest.delete(link);
        resolve(true);
      } catch (err) {
        resolve(false);
        throw new GuildedApiError(err);
      }
    });
  }
}

export class ForumTopicComment {
  content: string;
  createdAt: Date;
  createdBy: string;
  forumTopicId: number;
  id: number;
  obj?: { topic: ForumTopic; member: Member };
  updatedAt?: Date;

  constructor(
    comment: APIForumComment,
    obj: { topic: ForumTopic; member: Member }
  ) {
    Object.defineProperty(this, 'obj', {
      enumerable: false,
      writable: false,
      value: obj
    });

    this.content = comment.content;
    this.createdAt = new Date(comment.createdAt);
    this.createdBy = comment.createdBy;
    this.forumTopicId = comment.forumTopicId;
    this.id = comment.id;
    this.updatedAt = comment.updatedAt;
  }

  get author() {
    return this.obj.member;
  }

  get topic() {
    return this.obj.topic;
  }

  toString() {
    return this.content;
  }

  delete(): Promise<boolean> {
    const link =
      Routes.forumTopic(this.topic.channel.id, this.topic.id) +
      `/comments/${this.id}`;

    return new Promise(async (resolve) => {
      try {
        await this.topic.channel.client.rest.delete(link);

        resolve(true);
      } catch (err) {
        resolve(false);
        throw new GuildedApiError(err);
      }
    });
  }

  edit(content: string): Promise<ForumTopicComment | boolean> {
    const link =
      Routes.forumTopic(this.topic.channel.id, this.topic.id) +
      `/comments/${this.id}`;

    return new Promise(async (resolve) => {
      try {
        const { forumTopicComment } =
          await this.topic.channel.client.rest.patch(link, {
            body: JSON.stringify({ content: content })
          });

        const comment = new ForumTopicComment(forumTopicComment, {
          topic: this.topic,
          member: await this.topic.channel.server.members.fetch(
            this.createdBy,
            this.topic.serverId
          )
        });
        resolve(comment);
      } catch (err) {
        resolve(false);
        throw new GuildedApiError(err);
      }
    });
  }
}

export interface APIForumComment {
  content: string;
  createdAt: Date;
  createdBy: string;
  forumTopicId: number;
  id: number;
  updatedAt?: Date;
}
