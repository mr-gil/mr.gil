import {
  APIMentions,
  APIMessage,
  APIMessageFetchManyOptions,
  Routes,
} from "guilded-api-typings";
import { BaseServer } from ".";
import { MessageEmbed } from "../builder";
import { Client } from "../Client";
import { BaseChannel, ChatChannel } from "./Channel";
import { Member, User } from "./User";

type messageSend = {
  content?: string;
  embeds?: MessageEmbed[];
  replyIds?: string[];
  private?: boolean;
  silent?: boolean;
};

type mentionObj = {
  id: string | number;
};

type mentionTypes = {
  users?: mentionObj[];
  roles?: mentionObj[];
  channels?: mentionObj[];
  everyone?: boolean;
  here?: boolean;
};

export class Mentions {
  users: mentionObj[];
  roles: mentionObj[];
  everyone: boolean;
  here: boolean;
  constructor(d: APIMentions) {
    if (d == undefined) return undefined;
    else {
      this.users = d.users;
      this.roles = d.roles;
      this.everyone = d.everyone;
      this.here = d.here;
    }
  }
}

export class Message {
  content: string;
  createdAt: Date;
  mentions: mentionTypes;
  member: Member | User;
  channel: ChatChannel;
  server: BaseServer;
  author: User;
  private _client: Client;
  replies: string[];
  private apiMessage: APIMessage;
  private: boolean;
  silent: boolean;
  webhook: boolean | { id: string };
  id: string;

  constructor(
    message: APIMessage,
    obj: { server: BaseServer; channel: ChatChannel; member: Member | User },
    client: Client,
    cache = client.cacheMessage ?? true
  ) {
    const {
      mentions,
      id,
      createdAt,
      createdByWebhookId,
      isPrivate,
      isSilent,
      replyMessageIds,
    } = message;
    Object.defineProperty(this, "_client", {
      enumerable: false,
      writable: false,
      value: client,
    });

    Object.defineProperty(this, "apiMessage", {
      enumerable: false,
      writable: true,
      value: message,
    });
    this.id = id;
    this.content = message.content;
    this.private = isPrivate;
    this.silent = isSilent;
    this.webhook =
      createdByWebhookId != "" ? { id: createdByWebhookId } : false;
    this.createdAt = new Date(createdAt);
    this.mentions = new Mentions(mentions);

    this.server = obj.server;
    this.channel = obj.channel;
    this.member = obj.member;

    this.replies = replyMessageIds;

    if (cache) this.channel.messages.cache.set(this.id, this);
  }

  get channelUrl() {
    return `https://www.guilded.gg/api/v${this.client.gateway}${Routes.channel(
      this.channel.id
    )}`;
  }

  toString() {
    return this.content;
  }

  get client() {
    return this._client;
  }

  reply(text: string | messageSend, options: messageSend) {
    const link = Routes.messages(this.channel.id);

    if (typeof text != "string") {
      text.replyIds = [this.apiMessage.id];
    }

    const data =
      typeof text == "string"
        ? {
            content: text,
            isPrivate: options?.private || false,
            isSilent: options?.silent || undefined,
            embeds: options?.embeds,
            replyMessageIds: options?.replyIds
              ? [this.apiMessage.id, ...options?.replyIds]
              : [this.apiMessage.id],
          }
        : {
            content: text.content,
            isPrivate: text?.private,
            isSilent: text?.silent,
            embeds: text.embeds,
            replyMessageIds: text?.replyIds
              ? [this.apiMessage.id, ...text.replyIds]
              : [this.apiMessage.id],
          };

    return new Promise(async (resolve, reject) => {
      try {
        const { message } = await this.client.rest.post(link, {
          body: JSON.stringify(data),
        });

        const m = new Message(
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

        resolve(m);
      } catch (err) {
        reject(err);
      }
    });
  }

  async fetch(channelId: string, msgId: string): Promise<APIMessage>;
  async fetch(
    channelId: string,
    options?: APIMessageFetchManyOptions
  ): Promise<APIMessage[]>;

  async fetch(
    channelId: string,
    IdOrOptions?: string | APIMessageFetchManyOptions
  ): Promise<APIMessage[] | APIMessage> {
    return new Promise(async (resolve, reject) => {
      if (typeof IdOrOptions === "string") {
        const { message } = await this.client.rest.get(
          Routes.message(channelId, IdOrOptions)
        );
        return resolve(message);
      } else {
        const { messages } = await this.client.rest.get(
          Routes.messages(channelId),
          IdOrOptions
        );
        return resolve(messages);
      }
    });
  }
}
