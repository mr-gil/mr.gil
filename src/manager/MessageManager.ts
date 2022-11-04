import {
  APIMessage,
  APIMessageFetchManyOptions,
  Routes
} from 'guilded-api-typings';
import { BaseManager, FetchManyOptions, FetchOptions } from './BaseManager';
import { ChatChannel, Message } from '../components';
import { Collection } from '../components/Collection';

export class MessageManager extends BaseManager {
  readonly cache: Collection<string, Message>;
  channel: ChatChannel;

  constructor(channel: ChatChannel, maxCache = Infinity) {
    super(channel.client);
    this.channel = channel;
    this.cache = new Collection([], {
      client: this.client,
      maxSize: super.client.cacheSize || maxCache
    });
  }

  setMaxCache(num: number) {
    this.cache.setMaxSize(num);
    return this;
  }

  async fetch(id: string, options?: FetchOptions): Promise<Message>;
  async fetch(
    options?: FetchManyOptions | APIMessageFetchManyOptions
  ): Promise<Collection<string, Message>>;

  async fetch(
    msgId?: string | FetchManyOptions | APIMessageFetchManyOptions,
    options?: FetchOptions
  ): Promise<Collection<string, Message> | Message> {
    return new Promise(async (resolve, reject) => {
      if (typeof msgId === 'string') {
        const cached = this.cache.get(msgId);
        if (cached && !options?.force) return resolve(cached);

        const { message } = await this.client.rest.get(
          Routes.message(this.channel.id, msgId)
        );

        const msg = new Message(
          message,
          {
            server: this.channel.server,
            channel: await this.client.channels.fetch(message.channelId),
            member: await this.channel.server.members.fetch(
              message.createdBy,
              message.serverId
            )
          },
          this.client
        );
        this.cache.set(msg.id, msg);
        resolve(msg);
      } else {
        const { messages } = await this.client.rest.get(
          Routes.messages(this.channel.id),
          msgId
        );

        const ms: Collection<string, Message> = new Collection<string, Message>(
          [],
          { client: this.client }
        );

        messages.forEach(async (m: APIMessage) => {
          const cac = this.cache.get(m.id);
          if (cac) {
            ms.set(cac.id, cac);
          } else {
            const msg = new Message(
              m,
              {
                server: this.channel.server,
                channel: await this.client.channels.fetch(m.channelId),
                member: await this.channel.server.members.fetch(
                  m.createdBy,
                  m.serverId
                )
              },
              this.client
            );

            ms.set(msg.id, msg);
          }
        });
        resolve(ms);
      }
    });
  }
}
