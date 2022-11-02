import { APIDoc, Routes } from "guilded-api-typings";
import { Client } from "../Client";
import { GuildedApiError } from "../errors/apiError";
import { DocChannel } from "./Channel";
import { Mentions } from "./Message";
import { BaseServer } from "./Server";
import { Member } from "./User";

export class Doc {
  id: number;
  title: string;
  createdAt: Date;
  createdBy: string;
  serverId: string;
  channelId: string;
  content: string;
  updatedBy: string;
  updatedAt: Date;
  private _client: Client;
  server: BaseServer;
  mentions: Mentions;
  deleted: boolean;
  channel: DocChannel;

  constructor(
    doc: APIDoc,
    obj: { server: BaseServer; channel: DocChannel; member: Member },
    client: Client,
    cache = client.cacheDocs ?? true
  ) {
    this.id = doc.id;
    this.channelId = doc.channelId;
    this.server = obj.server;
    this.serverId = doc.serverId;
    Object.defineProperty(this, "_client", {
      enumerable: false,
      writable: false,
      value: client,
    });

    this.title = doc.title;
    this.createdAt = new Date(doc.createdAt);
    this.createdBy = doc.createdBy;
    this.content = doc.content;
    this.mentions = new Mentions(doc.mentions);
    this.channel = obj.channel;

    if (doc.updatedBy || doc.updatedAt) {
      this.updatedAt = new Date(doc.updatedAt);
      this.updatedBy = doc.updatedBy;
    }

    if (cache) this.channel.docs.cache.set(this.id, this);
  }

  get client() {
    return this._client;
  }

  async author() {
    const member = await this.server.members.get(this.createdBy);
    return member;
  }

  toString() {
    return this.content;
  }

  edit(title: string, content: string) {
    const docUrl = Routes.doc(this.channelId, this.id);

    return new Promise(async (resolve, reject) => {
      try {
        const { doc }: { doc: APIDoc } = await this.client.rest.put(docUrl, {
          body: JSON.stringify({ title, content }),
        });

        const d = new Doc(
          doc,
          {
            server: this.server,
            channel: this.channel,
            member: await this.author(),
          },
          this.client
        );

        resolve(d);
      } catch (err: any) {
        throw new GuildedApiError(err);
      }
    });
  }
}
