import {
  APIMessage,
  APIMessageFetchManyOptions,
  Routes,
} from "guilded-api-typings";
import { Client } from "../Client";
import { ChatChannel, Message } from "../components";
import { Collection } from "../components/Collection";

export class MessageManager {
  readonly cache: Collection;
  client: Client;

  constructor(channel: ChatChannel, maxCache = Infinity) {
    this.client = channel.client;
    this.cache = new Collection([], {
      maxSize: channel.client.cacheSize || maxCache,
    });
  }

  setMaxCache(num: number) {
    this.cache.setMaxSize(num);
    return this;
  }

  async fetch(channelId: string, msgId: string): Promise<Message>;
  async fetch(
    channelId: string,
    options?: APIMessageFetchManyOptions
  ): Promise<Message[]>;

  async fetch(
    channelId: string,
    IdOrOptions?: string | APIMessageFetchManyOptions
  ): Promise<Message[] | Message> {
    return new Promise(async (resolve, reject) => {
      if (typeof IdOrOptions === "string") {
        const { message } = await this.client.rest.get(
          Routes.message(channelId, IdOrOptions)
        );

        const msg = new Message(
          message,
          {
            server: await this.client.servers.fetch(message.serverId),
            channel: await this.client.channels.fetch(message.channelId),
            member: await this.client.members.fetch(
              message.createdBy,
              message.serverId
            ),
          },
          this.client
        );
        return resolve(msg);
      } else {
        const { messages } = await this.client.rest.get(
          Routes.messages(channelId),
          IdOrOptions
        );

        const ms: Message[] = [];

        messages.forEach(async (m: APIMessage) => {
          const msg = new Message(
            m,
            {
              server: await this.client.servers.fetch(m.serverId),
              channel: await this.client.channels.fetch(m.channelId),
              member: await this.client.members.fetch(m.createdBy, m.serverId),
            },
            this.client
          );

          ms.push(msg);
        });
        return resolve(ms);
      }
    });
  }
}
