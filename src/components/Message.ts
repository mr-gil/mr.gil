import {
  APIMentions,
  APIMessage,
  APIMessageReaction,
  Routes
} from 'guilded-api-typings';
import { BaseServer, Emote, ChatChannel, Member, User, Webhook } from '.';
import { MessageEmbed } from '../builder';
import { Client } from '../Client';
import { collectorOptions } from '../collectors/BaseCollector';
import { MessageReactionCollector } from '../collectors/MessageCollector';
import { GuildedApiError } from '../errors/apiError';

export class Message {
  content: string;
  createdAt: Date;
  deletedAt?: Date;
  id: string;
  mentions?: Mentions;
  private _client: Client;
  private apiMessage: APIMessage;
  private?: boolean;
  replies?: string[];
  silent?: boolean;
  webhook?: Webhook | boolean;
  private _obj: {
    channel: ChatChannel;
    member?: Member | Webhook;
  };

  constructor(
    message: APIMessage,
    obj: {
      channel: ChatChannel;
      member?: Member | Webhook;
    },
    cache = obj.channel.client.cacheMessage ?? true
  ) {
    Object.defineProperty(this, '_obj', {
      enumerable: false,
      writable: true,
      value: obj
    });

    const {
      createdAt,
      createdByWebhookId,
      id,
      isPrivate,
      isSilent,
      mentions,
      replyMessageIds
    } = message;
    Object.defineProperty(this, '_client', {
      enumerable: false,
      writable: false,
      value: this.channel.client
    });

    Object.defineProperty(this, 'apiMessage', {
      enumerable: false,
      writable: true,
      value: message
    });
    this.id = id;
    this.content = message.content;
    this.private = isPrivate;
    this.silent = isSilent;
    this.webhook = createdByWebhookId != '' ? (obj.member as Webhook) : false;
    this.createdAt = new Date(createdAt);
    this.mentions = new Mentions(mentions);

    this.replies = replyMessageIds;

    if (cache) this.channel.messages.cache.set(this.id, this);
  }

  get obj() {
    return this._obj;
  }

  get server() {
    return this.channel.server;
  }

  get member() {
    return this.obj.member;
  }

  get channel() {
    return this.obj.channel;
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

  delete() {
    const link = Routes.message(this.channel.id, this.id);

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

  reply(text: string | messageSend, options: messageSend) {
    const link = Routes.messages(this.channel.id);

    if (typeof text != 'string') {
      text.replyIds = [this.apiMessage.id];
    }

    const data =
      typeof text == 'string'
        ? {
            content: text,
            isPrivate: options?.private || false,
            isSilent: options?.silent || undefined,
            embeds: options?.embeds,
            replyMessageIds: options?.replyIds
              ? [this.apiMessage.id, ...options?.replyIds]
              : [this.apiMessage.id]
          }
        : {
            content: text.content,
            isPrivate: text?.private,
            isSilent: text?.silent,
            embeds: text.embeds,
            replyMessageIds: text?.replyIds
              ? [this.apiMessage.id, ...text.replyIds]
              : [this.apiMessage.id]
          };

    return new Promise(async (resolve, reject) => {
      try {
        const { message } = await this.client.rest.post(link, {
          body: JSON.stringify(data)
        });

        const m = new Message(message, {
          channel: this.channel,
          member: await this.server.members.fetch(
            message.createdBy,
            message.serverId
          )
        });

        resolve(m);
      } catch (err: any) {
        throw new GuildedApiError(err);
      }
    });
  }

  edit(text: string | messageSend, options: messageSend) {
    const data =
      typeof text == 'string'
        ? {
            content: text,
            isPrivate: options?.private || false,
            isSilent: options?.silent || undefined,
            embeds: options?.embeds,
            replyMessageIds: options?.replyIds
              ? [this.apiMessage.id, ...options?.replyIds]
              : [this.apiMessage.id]
          }
        : {
            content: text.content,
            isPrivate: text?.private,
            isSilent: text?.silent,
            embeds: text.embeds,
            replyMessageIds: text?.replyIds
              ? [this.apiMessage.id, ...text.replyIds]
              : [this.apiMessage.id]
          };

    const msgUrl = Routes.message(this.channel.id, this.id);

    if (typeof text != 'string') {
      text.replyIds = [this.apiMessage.id];
    }

    return new Promise(async (resolve, reject) => {
      try {
        const { message }: { message: APIMessage } = await this.client.rest.put(
          msgUrl,
          {
            body: JSON.stringify(data)
          }
        );

        const msg = new Message(message, {
          channel: this.channel,
          member: this.member
        });

        resolve(msg);
      } catch (err: any) {
        throw new GuildedApiError(err);
      }
    });
  }

  react(emojiId: number) {
    const link = Routes.reaction(this.channel.id, this.id, emojiId);

    return new Promise(async (resolve) => {
      try {
        await this.channel.client.rest.put(link);
        resolve(true);
      } catch (err) {
        resolve(false);
        throw new GuildedApiError(err);
      }
    });
  }

  unreact(emojiId: number) {
    const link = Routes.reaction(this.channel.id, this.id, emojiId);

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

  createReactionCollector(options?: collectorOptions<MessageReaction>) {
    return new MessageReactionCollector(this, options);
  }

  awaitReactions(options?: collectorOptions<MessageReaction>) {
    return new Promise((resolve) => {
      this.createReactionCollector(options).once('end', (item: any) =>
        resolve(item)
      );
    });
  }
}

export class MessageReaction extends String {
  channelId: string;
  createdBy: string;
  emote: Emote;
  id: number;
  message: Message;
  messageId: string;
  reactedBy: Member;

  constructor(
    reaction: APIMessageReaction,
    obj: { message: Message; member: Member }
  ) {
    super();
    this.message = obj.message;
    this.reactedBy = obj.member;
    this.createdBy = reaction.createdBy;
    this.messageId = reaction.messageId;
    this.emote = new Emote(reaction.emote);
    this.id = this.emote.id;
    this.channelId = reaction.channelId;
  }

  remove() {
    const link = Routes.reaction(this.channelId, this.messageId, this.emote.id);

    return new Promise(async (resolve, reject) => {
      try {
        await this.message.client.rest.delete(link);

        resolve(true);
      } catch (err) {
        resolve(false);
        throw new GuildedApiError(err);
      }
    });
  }
}

export class Mentions {
  everyone: boolean;
  here: boolean;
  roles: mentionObj[];
  users: mentionObj[];
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

export type messageSend = {
  content?: string;
  embeds?: MessageEmbed[];
  private?: boolean;
  replyIds?: string[];
  silent?: boolean;
};

type mentionObj = {
  id: string | number;
};
