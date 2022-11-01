import {
  APIMessage,
  APIMessageFetchManyOptions,
  Routes,
} from "guilded-api-typings";
import { FetchManyOptions, FetchOptions } from ".";
import { Client } from "../Client";
import { ChatChannel, Message } from "../components";
import { Collection } from "../components/Collection";

export class MessageManager {
  readonly cache: Collection<string, Message>;
  channel: ChatChannel;
  client: Client;

  constructor(channel: ChatChannel, maxCache = Infinity) {
    this.client = channel.client;
    this.channel = channel;
    this.cache = new Collection([], {
      client: this.client,
      maxSize: channel.client.cacheSize || maxCache,
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
      if (typeof msgId === "string") {
        const cached = this.cache.get(msgId);
        if (cached && !options?.force) return resolve(cached);

        const { message } = await this.client.rest.get(
          Routes.message(this.channel.id, msgId)
        );

        let server = await this.client.servers.fetch(message.serverId);
        const msg = new Message(
          message,
          {
            server: server,
            channel: await this.client.channels.fetch(message.channelId),
            member: await server.members.fetch(
              message.createdBy,
              message.serverId
            ),
          },
          this.client
        );
        this.cache.set(msg.id, msg)
        return resolve(msg);
      } else {
        const { messages } = await this.client.rest.get(
          Routes.messages(this.channel.id),
          msgId
        );

        const ms: Collection<string, Message> = new Collection<string, Message>(
          [],
          { client: this.client, type: "messages" }
        );

        messages.forEach(async (m: APIMessage) => {
          let cac = this.cache.get(m.id)
          if (cac) {
            ms.set(cac.id, cac)
          } else {
            let server = await this.client.servers.fetch(m.serverId)
            const msg = new Message(
              m,
              {
                server: server,
                channel: await this.client.channels.fetch(m.channelId),
                member: await server.members.fetch(m.createdBy, m.serverId),
              },
              this.client
            );

            ms.set(msg.id, msg);
          }
        });
        return resolve(ms);
      }
    });
  }
}
