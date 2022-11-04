import { APIForumTopic, Routes } from 'guilded-api-typings';
import { GuildedApiError } from '../errors/apiError';
import { ForumChannel } from './Channel';
import { Mentions } from './Message';
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

  constructor(
    forum: APIForumTopic,
    private obj: { channel: ForumChannel; member?: Member | Webhook },
    cache = obj.channel.client.cacheForumTopics ?? true
  ) {
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
    this.webhook =
      forum.createdByWebhookId != '' ? (obj.member as Webhook) : false;
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

  delete() {
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

  edit(title?: string, content?: string) {
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
}
