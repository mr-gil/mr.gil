import {
  APIChannel,
  APIDoc,
  APIMessage,
  ChannelType,
  Routes
} from 'guilded-api-typings';
import { MessageEmbed, DocBuilder } from '../builder';
import { Client } from '../Client';
import { collectorOptions } from '../collectors/BaseCollector';
import { MessageCollector } from '../collectors/MessageCollector';
import { GuildedApiError } from '../errors/apiError';
import { DocManager } from '../manager/DocManager';
import { MessageManager } from '../manager/MessageManager';
import { WebhookManager } from '../manager/WebhookManager';
import { Collection } from './Collection';
import { Doc } from './Doc';
import { Message } from './Message';
import { BaseServer } from './Server';
import { Webhook } from './Webhook';

type messageSend = {
  content?: string;
  embeds?: MessageEmbed[];
  replyIds?: string[];
  private?: boolean;
  silent?: boolean;
  webhook?: string | webhook;
};

type webhook = {
  id: string;
  token: string;
};

export type AnyChannel = BaseChannel & ChatChannel & DocChannel;

export class BaseChannel {
  id: string;
  type: ChannelType;
  name: string;
  topic: string;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  serverId: string;
  parent: string;
  category: number;
  groupId: string;
  public: boolean;
  archivedBy: string;
  archivedAt: Date;
  private _client: Client;
  webhooks: WebhookManager;

  constructor(
    channel: APIChannel,
    private obj: { server: BaseServer },
    client: Client
  ) {
    Object.defineProperty(this, '_client', {
      enumerable: false,
      writable: false,
      value: client
    });

    this.id = channel.id;
    this.type = channel.type;
    this.name = channel.name;
    this.topic = channel.topic;
    this.createdAt = new Date(channel.createdAt);
    this.createdBy = channel.createdBy;
    this.updatedAt = new Date(channel.updatedAt);
    this.serverId = channel.serverId;
    this.parent = channel.parentId;
    this.category = channel.categoryId;
    this.groupId = channel.groupId;
    this.public = channel.isPublic;
    this.archivedBy = channel.archivedBy;
    this.archivedAt = new Date(channel.archivedAt);
    this.webhooks = new WebhookManager(this);
  }

  get server() {
    return this.obj.server;
  }

  get client() {
    return this._client;
  }

  toString() {
    return `<#${this.id}>`;
  }
}

export class ChatChannel extends BaseChannel {
  readonly messages: MessageManager;
  constructor(
    channel: APIChannel,
    obj: { server: BaseServer },
    client: Client
  ) {
    super(channel, obj, client);
    this.messages = new MessageManager(this);
  }

  fetchBulk(
    options: {
      before?: string;
      after?: string;
      limit?: number;
      includePrivate?: boolean;
    } = { limit: 25 }
  ) {
    const link = Routes.messages(this.id);

    if (options.limit > 100) options.limit = 100;

    return new Promise(async (resolve, reject) => {
      try {
        const { messages }: { messages: APIMessage[] } =
          await this.client.rest.get(link, {
            body: JSON.stringify(options)
          });

        const msgs = new Collection([], { client: this.client });

        messages.forEach(async (m) => {
          const msg = new Message(
            m,
            {
              server: this.server,
              channel: this,
              member: await this.server.members.fetch(
                m.createdBy,
                this.server.id
              )
            },
            this.client
          );

          msgs.set(msg.id, msg);
        });

        resolve(msgs);
      } catch (err: any) {
        throw new GuildedApiError(err);
      }
    });
  }

  send(text: string | messageSend, options: messageSend): Promise<Message> {
    const link = Routes.messages(this.id);

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

    return new Promise(async (resolve, reject) => {
      try {
        if (
          (typeof text == 'string' && options?.webhook) ||
          (typeof text !== 'string' && text?.webhook)
        ) {
          let uri;

          if (options) {
            if (typeof options.webhook !== 'string') {
              uri = Routes.webhookExecute(
                options?.webhook.id,
                options?.webhook.token
              );
            } else if (typeof options.webhook == 'string') {
              uri = options.webhook.replace('https://media.guilded.gg', '');
            }
          } else if (typeof text !== 'string') {
            if (typeof text.webhook !== 'string') {
              uri = Routes.webhookExecute(
                text?.webhook.id,
                text?.webhook.token
              );
            } else if (typeof text.webhook == 'string') {
              uri = text.webhook.replace('https://media.guilded.gg', '');
            }
          }

          const { message }: { message: APIMessage } =
            await this.client.rest.https('', 'POST', {
              host: `media.guilded.gg`,
              uri: uri,
              body: JSON.stringify(data)
            });
          resolve(
            new Message(
              message,
              {
                server: this.server,
                channel: this
              },
              this.client
            )
          );
        } else {
          const { message }: { message: APIMessage } =
            await this.client.rest.post(link, {
              body: JSON.stringify(data)
            });
          resolve(
            new Message(
              message,
              {
                server: this.server,
                channel: this,
                member: await this.server.members.fetch(
                  message.createdBy,
                  message.serverId
                )
              },
              this.client
            )
          );
        }
      } catch (err: any) {
        throw new GuildedApiError(err);
      }
    });
  }

  createMessageCollector(options?: collectorOptions<Message>) {
    return new MessageCollector(this, options);
  }

  awaitMessages(options?: collectorOptions<Message>) {
    return new Promise((resolve) => {
      this.createMessageCollector(options).once('end', (item) => resolve(item));
    });
  }
}

export class DocChannel extends BaseChannel {
  docs: DocManager;

  constructor(
    channel: APIChannel,
    obj: { server: BaseServer },
    client: Client
  ) {
    super(channel, obj, client);
    this.docs = new DocManager(this);
  }

  fetchBulk(
    options: {
      before?: string;
      limit?: number;
    } = { limit: 15 }
  ) {
    const link = Routes.docs(this.id);

    if (options.limit > 100) options.limit = 100;

    return new Promise(async (resolve, reject) => {
      try {
        const { docs }: { docs: APIDoc[] } = await this.client.rest.get(link, {
          body: JSON.stringify(options)
        });

        const dcs = new Collection([], { client: this.client });

        docs.forEach(async (d) => {
          const doc = new Doc(
            d,
            {
              server: this.server,
              channel: this,
              member: await this.server.members.fetch(
                d.createdBy,
                this.server.id
              )
            },
            this.client
          );

          dcs.set(doc.id, doc);
        });

        resolve(dcs);
      } catch (err: any) {
        throw new GuildedApiError(err);
      }
    });
  }

  post(title: string | DocBuilder, content: string) {
    const link = Routes.docs(this.id);

    return new Promise(async (resolve, reject) => {
      try {
        let data: DocBuilder | { title: string; content: string };

        if (title instanceof DocBuilder) {
          data = title;
        } else
          data = {
            title: title as string,
            content
          };

        const { doc }: { doc: APIDoc } = await this.client.rest.post(link, {
          body: JSON.stringify(data)
        });

        resolve(
          new Doc(
            doc,
            {
              server: this.server,
              channel: this,
              member: await this.server.members.fetch(
                doc.createdBy,
                doc.serverId
              )
            },
            this.client
          )
        );
      } catch (err: any) {
        throw new GuildedApiError(err);
      }
    });
  }
}
