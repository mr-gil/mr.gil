import { APIMessage, APIWebhook, Routes } from 'guilded-api-typings';
import { GuildedApiError } from '../errors/apiError';
import { FetchOptions } from '../manager/BaseManager';
import { BaseChannel, ChatChannel } from './Channel';
import { Message, messageSend } from './Message';
import { BaseServer } from './Server';

export class Webhook {
  name: string;
  serverId: string;
  channelId: string;
  createdAt: Date;
  createdBy: string;
  deletedAt: Date;
  id: string;
  token: string;

  constructor(public _channel: BaseChannel, web: APIWebhook) {
    this.name = web.name;
    this.serverId = web.serverId;
    this.channelId = web.channelId;
    this.createdBy = web.createdBy;
    this.createdAt = new Date(web.createdAt);
    this.deletedAt = new Date(web.deletedAt);
    this.token = web.token;
    this.id = web.id;

    this.channel.webhooks.cache.set(this.name, this);
  }
  get server() {
    return this.channel.server;
  }

  get channel() {
    return this._channel;
  }
  get author() {
    return this.channel.server.members.fetch(
      this.createdBy,
      this.channel.server.icon
    );
  }

  async fetch(options?: FetchOptions): Promise<Webhook> {
    return await this.channel.webhooks.fetch(this.id, options);
  }

  send(
    text: string | messageSend,
    options: messageSend
  ): Promise<Message | boolean> {
    const data =
      typeof text == 'string'
        ? {
            content: text,
            isPrivate: options?.private || false,
            isSilent: options?.silent || undefined,
            embeds: options?.embeds,
            replyMessageIds: options?.replyIds
          }
        : {
            content: text.content,
            isPrivate: text?.private,
            isSilent: text?.silent,
            embeds: text.embeds,
            replyMessageIds: text?.replyIds
          };

    if (data.embeds) {
      if (!Array.isArray(data.embeds)) data.embeds = [data.embeds];
    }

    return new Promise(async (resolve) => {
      try {
        const me = await this.channel.client.rest.https('', 'POST', {
          host: `media.guilded.gg`,
          uri: `${Routes.webhookExecute(this.id, this.token)}`,
          body: JSON.stringify(data)
        });
        return console.log(me);
        /** 
        const m = new Message(
          message,
          {
            server: this.server,
            channel: this.channel as ChatChannel,
            member: await this.server.members.fetch(
              message.createdBy,
              message.serverId
            )
          },
          this.channel.client
        );

        resolve(m);
        */
      } catch (err) {
        resolve(false);
        throw new GuildedApiError(err);
      }
    });
  }

  async edit(name: string, channelId?: string) {
    return await this.channel.webhooks.edit(this.id, name, channelId);
  }

  async delete() {
    return await this.channel.webhooks.delete(this.id);
  }
}
