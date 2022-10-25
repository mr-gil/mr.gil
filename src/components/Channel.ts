import {
  APIChannel,
  APIMessage,
  ChannelType,
  Routes,
} from "guilded-api-typings";
import { MessageEmbed } from "../builder";
import { Client } from "../Client";
import { Message } from "./Message";
import { BaseServer } from "./Server";

type messageSend = {
  content?: string;
  embeds?: MessageEmbed[];
  replyIds?: string[];
  private?: boolean;
  silent?: boolean;
};

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
  server: BaseServer;

  constructor(channel: APIChannel, obj: { server: BaseServer }, client: Client) {

        Object.defineProperty(this, "_client", {
          enumerable: false,
          writable: false,
          value: client,
        });
    
        this.id = channel.id;
        this.type = channel.type;
        this.name = channel.name;
        this.topic = channel.topic;
        this.createdAt = new Date(channel.createdAt);
        this.createdBy = channel.createdBy;
        this.updatedAt = new Date(channel.updatedAt);
        this.serverId = channel.serverId;
        this.server = obj.server
        this.parent = channel.parentId;
        this.category = channel.categoryId;
        this.groupId = channel.groupId;
        this.public = channel.isPublic;
        this.archivedBy = channel.archivedBy;
        this.archivedAt = new Date(channel.archivedAt);

  }

  get client() {
    return this._client;
  }

  toString() {
    return `<#${this.id}>`;
  }
}

export class ChatChannel extends BaseChannel {
  constructor(
    channel: APIChannel,
    obj: { server: BaseServer },
    client: Client
  ) {
    super(channel, obj, client);
  }

  send(text: string | messageSend, options: messageSend) {
    const link = Routes.messages(this.id);

    const data =
      typeof text == "string"
        ? {
            content: text,
            isPrivate: options.private,
            isSilent: options.silent,
            embeds: options.embeds ?? [],
            replyMessageIds: options.replyIds,
          }
        : {
            content: text.content,
            isPrivate: text.private,
            isSilent: text.silent,
            embeds: text.embeds ?? [],
            replyMessageIds: text.replyIds,
          };

    if (data.embeds) {
      if (!Array.isArray(data.embeds)) data.embeds = [data.embeds];
    }

    return new Promise(async (resolve, reject) => {
      try {
        let message: APIMessage = await this.client.rest.post(link, {
          body: JSON.stringify(data),
        });
        resolve(
          new Message(
            message,
            {
              server: await this.client.servers.fetch(message.serverId),
              channel: await this.client.channels.fetch(message.channelId),
              member: await this.client.members.fetch(
                message.createdBy,
                message.serverId,
              ),
            },
            this.client
          )
        );
      } catch (err) {
        reject(err);
      }
    });
  }
}
