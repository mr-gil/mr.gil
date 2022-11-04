import { APIDoc, Routes } from 'guilded-api-typings';
import { Client } from '../Client';
import { GuildedApiError } from '../errors/apiError';
import { DocChannel } from './Channel';
import { Mentions } from './Message';
import { Member } from './User';

export class Doc {
  channelId: string;
  content: string;
  createdAt: Date;
  createdBy: string;
  deleted: boolean;
  id: number;
  mentions: Mentions;
  private _client: Client;
  serverId: string;
  title: string;
  updatedAt: Date;
  updatedBy: string;

  constructor(
    doc: APIDoc,
    private obj: { channel: DocChannel; member: Member },
    cache = obj.channel.client.cacheDocs ?? true
  ) {
    this.id = doc.id;
    this.channelId = doc.channelId;
    this.serverId = doc.serverId;

    this.title = doc.title;
    this.createdAt = new Date(doc.createdAt);
    this.createdBy = doc.createdBy;
    this.content = doc.content;
    this.mentions = new Mentions(doc.mentions);

    if (doc.updatedBy || doc.updatedAt) {
      this.updatedAt = new Date(doc.updatedAt);
      this.updatedBy = doc.updatedBy;
    }

    if (cache) this.channel.docs.cache.set(this.id, this);
  }

  get server() {
    return this.obj.channel.server;
  }

  get channel() {
    return this.obj.channel;
  }

  get client() {
    return this._client;
  }

  get author() {
    return this.obj.member;
  }

  toString() {
    return this.content;
  }

  delete() {
    const link = Routes.doc(this.channelId, this.id);

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
  edit(title: string, content: string) {
    const docUrl = Routes.doc(this.channelId, this.id);

    return new Promise(async (resolve, reject) => {
      try {
        const { doc }: { doc: APIDoc } = await this.client.rest.put(docUrl, {
          body: JSON.stringify({ title, content })
        });

        const d = new Doc(doc, {
          channel: this.channel,
          member: this.author
        });

        resolve(d);
      } catch (err: any) {
        throw new GuildedApiError(err);
      }
    });
  }
}
