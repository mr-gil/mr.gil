import { APIListItem, APIListItemNote, Routes } from 'guilded-api-typings';
import { ListBuilder } from '../builder';
import { Client } from '../Client';
import { GuildedApiError } from '../errors/apiError';
import { ListChannel } from './Channel';
import { Mentions } from './Message';
import { Member } from './User';
import { Webhook } from './Webhook';

export class ListItem {
  _client: Client;
  channelId: string;
  completed: boolean;
  completedAt?: Date;
  completedBy?: Member;
  createdAt: Date;
  createdBy: string;
  createdByWebhookId?: string;
  id: string;
  member: Member | Webhook;
  mentions: Mentions;
  message: string;
  note?: ListNote;
  obj: { channel: ListChannel };
  parentListItemId?: string;
  serverId: string;
  updatedAt?: Date;
  updatedBy?: string;
  webhook?: boolean;

  constructor(
    item: APIListItem,
    obj: { channel: ListChannel; member: Member | Webhook; completed?: Member },
    cache = obj.channel.client.cacheLists ?? true
  ) {
    Object.defineProperty(this, 'obj', {
      enumerable: false,
      writable: true,
      value: obj
    });

    Object.defineProperty(this, '_client', {
      enumerable: false,
      writable: false,
      value: this.channel.client
    });

    this.channelId = item.channelId;
    this.completed = item.completedAt !== undefined;
    if (this.completed) {
      this.completedAt = new Date(item.completedAt);
      this.completedBy = obj.completed;
    }
    this.createdAt = new Date(item.createdAt);
    this.createdBy = item.createdBy;
    this.createdByWebhookId = item.createdByWebhookId;
    if (this.createdByWebhookId) {
      this.channel.webhooks.fetch(this.createdByWebhookId).then((a) => {
        this.member = a;
        this.webhook = true;
      });
    } else this.member = obj.member;

    this.id = item.id;
    this.mentions = new Mentions(item.mentions);
    this.message = item.message;
    if (item.note) this.note = new ListNote(item.note);
    this.parentListItemId = item.parentListItemId;
    this.serverId = item.serverId;
    this.updatedAt = new Date(this.updatedAt);
    this.updatedBy = this.updatedBy;
    this.webhook = this.createdByWebhookId ? true : false;

    if (cache) this.channel.lists.cache.set(this.id, this);
  }

  get channel() {
    return this.obj.channel;
  }
  get client() {
    return this._client;
  }

  delete() {
    const link = Routes.listItem(this.channelId, this.id);

    return new Promise(async (resolve) => {
      try {
        await this.client.rest.delete(link);

        resolve(true);
      } catch (err) {
        resolve(false);
        throw new GuildedApiError(err);
      }
    });
  }
  edit(message: string | ListBuilder, note?: { content: string }) {
    const docUrl = Routes.listItem(this.channelId, this.id);

    return new Promise(async (resolve, reject) => {
      try {
        let data: ListBuilder;

        if (message instanceof ListBuilder) {
          data = message;
        } else
          new ListBuilder({
            message: message as string,
            note
          });

        const { listItem }: { listItem: APIListItem } =
          await this.client.rest.put(docUrl, {
            body: JSON.stringify(data)
          });

        const d = new ListItem(listItem, {
          channel: this.channel,
          member: this.member
        });

        resolve(d);
      } catch (err: any) {
        throw new GuildedApiError(err);
      }
    });
  }

  complete() {
    const link = Routes.listItemComplete(this.channel.id, this.id);

    return new Promise(async (resolve) => {
      try {
        await this.client.rest.post(link, { body: JSON.stringify({}) });

        resolve(true);
      } catch (err) {
        resolve(false);
        throw new GuildedApiError(err);
      }
    });
  }

  uncomplete() {
    const link = Routes.listItemComplete(this.channel.id, this.id);

    return new Promise(async (resolve) => {
      try {
        await this.client.rest.delete(link);

        resolve(true);
      } catch (err) {
        resolve(false);
        throw new GuildedApiError(err);
      }
    });
  }
}

export class ListNote {
  content: string;
  createdAt: Date;
  createdBy: string;
  list: ListItem;
  mentions?: Mentions;
  updatedAt?: Date;
  updatedBy?: string;

  constructor(note: APIListItemNote) {
    this.content = note.content;
    this.createdAt = new Date(note.createdAt);
    this.createdBy = note.createdBy;
    this.mentions = new Mentions(note.mentions);
    if (note.updatedAt) {
      this.updatedAt = new Date(note.updatedAt);
      this.updatedBy = note.updatedBy;
    }
  }

  async member() {
    const member = await this.list.channel.server.members.fetch(
      this.createdBy,
      this.list.serverId
    );

    return member;
  }
}
