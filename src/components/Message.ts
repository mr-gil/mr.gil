import {
  APIMentions,
  APIMessage,
  APIMessageReaction,
  Routes
} from 'guilded-api-typings';
import { BaseServer, Emote, ChatChannel, Member, User } from '.';
import { MessageEmbed } from '../builder';
import { Client } from '../Client';
import { collectorOptions } from '../collectors/BaseCollector';
import { MessageReactionCollector } from '../collectors/MessageCollector';
import { GuildedApiError } from '../errors/apiError';

export class Message {
  content: string;
  createdAt: Date;
  mentions: mentionTypes;
  private _client: Client;
  replies: string[];
  private apiMessage: APIMessage;
  private: boolean;
  silent: boolean;
  webhook: boolean | { id: string };
  id: string;
  deletedAt: Date;

  constructor(
    message: APIMessage,
    private obj: {
      server: BaseServer;
      channel: ChatChannel;
      member?: Member | User;
    },
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
      replyMessageIds
    } = message;
    Object.defineProperty(this, '_client', {
      enumerable: false,
      writable: false,
      value: client
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
    this.webhook =
      createdByWebhookId != '' ? { id: createdByWebhookId } : false;
    this.createdAt = new Date(createdAt);
    this.mentions = new Mentions(mentions);

    this.replies = replyMessageIds;

    if (cache) this.channel.messages.cache.set(this.id, this);
  }

  get server() {
    return this.obj.server;
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

        const m = new Message(
          message,
          {
            server: this.server,
            channel: this.channel,
            member: await this.server.members.fetch(
              message.createdBy,
              message.serverId
            )
          },
          this.client
        );

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

        const msg = new Message(
          message,
          {
            server: this.server,
            channel: this.channel,
            member: this.member
          },
          this.client
        );

        resolve(msg);
      } catch (err: any) {
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
  id: number;
  message: Message;
  reactedBy: Member;
  createdBy: string;
  messageId: string;
  emote: Emote;
  channelId: string;

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

export type messageSend = {
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
