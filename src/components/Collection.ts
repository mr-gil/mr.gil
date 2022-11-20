import {
  APIChannel,
  APIServer,
  APIServerMember,
  APIUser,
  APIUserSummary,
  Routes
} from 'guilded-api-typings';
import { resolve } from 'path';
import { ChannelBuilder } from '../builder/ChannelBuilder';
import { Client } from '../Client';
import { GuildedApiError } from '../errors/apiError';
import {
  AnyChannel,
  BaseChannel,
  CalendarChannel,
  DocChannel,
  ForumChannel,
  ListChannel
} from './Channel';
import { BaseServer, User, Member, ChatChannel } from './index';

type collectionObj = {
  client?: Client;
  maxSize?: number;
  type?: 'users' | 'members' | 'servers' | 'channels' | 'emotes';
};

export class Collection<K, V> extends Map<K, V> {
  createdAt: Date;
  fetchLinkType: string;
  private _client: Client;
  public maxSize?: number;

  constructor(arr: any[], options: collectionObj) {
    super();
    this.createdAt = new Date();
    this.maxSize = options.maxSize || this._client?.cacheSize || 25;
    if (this.maxSize && this.maxSize <= 1)
      throw new GuildedApiError('Max cache size must be greater than 1.');

    this.fetchLinkType = options.type;

    Object.defineProperty(this, '_client', {
      enumerable: false,
      writable: false,
      value: options.client
    });
  }

  get createdTimestamp() {
    return this.createdAt.getTime();
  }

  get client(): Client {
    return this._client;
  }

  get first() {
    return this.array()[0];
  }
  get last() {
    var ar = this.array();
    return ar[ar.length - 1];
  }

  array() {
    return Array.from(this.values());
  }

  find(fn = () => {}) {
    return this.array().find(fn);
  }

  set(key: K, value: V) {
    if (this.maxSize && this.size >= this.maxSize)
      this.delete(this.keys().next().value!);

    return super.set(key, value);
  }

  map(fn = () => {}) {
    return this.array().map(fn);
  }

  fetch(id: K, {}, {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const f = this.get(id);
      resolve(f);
    });
  }

  setMaxSize(maxSize?: number) {
    this.maxSize = maxSize;
    return this;
  }
}

export class ChannelCollection extends Collection<string, AnyChannel> {
  generate(channel: APIChannel): Promise<AnyChannel> {
    return new Promise(async (resolve) => {
      if (!channel || !channel.id)
        return new GuildedApiError('Unknown Channel');

      let server = await this.client.servers.fetch(channel.serverId);

      let newObj: AnyChannel;

      switch (channel.type) {
        case 'docs':
          newObj = new DocChannel(
            channel,
            {
              server: server
            },
            this.client
          ) as AnyChannel;
          break;
        case 'chat':
          newObj = new ChatChannel(
            channel,
            {
              server: server
            },
            this.client
          ) as AnyChannel;

          break;
        case 'forums':
          newObj = new ForumChannel(
            channel,
            {
              server: server
            },
            this.client
          ) as AnyChannel;

          break;
        case 'list':
          newObj = new ListChannel(
            channel,
            {
              server: server
            },
            this.client
          ) as AnyChannel;
          break;
        case 'calendar':
          newObj = new CalendarChannel(
            channel,
            {
              server: server
            },
            this.client
          ) as AnyChannel;
          break;
        default:
          newObj = new BaseChannel(
            channel,
            {
              server: server
            },
            this.client
          ) as AnyChannel;
      }

      if (!newObj || !newObj.id) return new GuildedApiError('Unknown Channel');

      this.set(newObj.id.toString(), newObj);

      resolve(this.get(newObj.id));
    });
  }

  fetch(id: string): Promise<AnyChannel> {
    return new Promise(async (resolve, reject) => {
      let f: AnyChannel = this.get(id);
      if (!f) {
        const { channel }: { channel: APIChannel } = await this.client.rest.get(
          Routes.channel(id)
        );
        if (!channel || !channel.id)
          return new GuildedApiError('Unknown Channel');

        let server = await this.client.servers.fetch(channel.serverId);

        let newObj: AnyChannel;

        switch (channel.type) {
          case 'docs':
            newObj = new DocChannel(
              channel,
              {
                server: server
              },
              this.client
            ) as AnyChannel;
            break;
          case 'chat':
            newObj = new ChatChannel(
              channel,
              {
                server: server
              },
              this.client
            ) as AnyChannel;

            break;
          case 'forums':
            newObj = new ForumChannel(
              channel,
              {
                server: server
              },
              this.client
            ) as AnyChannel;

            break;
          case 'list':
            newObj = new ListChannel(
              channel,
              {
                server: server
              },
              this.client
            ) as AnyChannel;
            break;
          case 'calendar':
            newObj = new CalendarChannel(
              channel,
              {
                server: server
              },
              this.client
            ) as AnyChannel;
            break;
          default:
            newObj = new BaseChannel(
              channel,
              {
                server: server
              },
              this.client
            ) as AnyChannel;
        }

        if (!newObj || !newObj.id)
          return new GuildedApiError('Unknown Channel');

        this.set(id.toString(), newObj);
        f = this.get(id);
      }
      return resolve(f);
    });
  }

  create(buildr: ChannelBuilder, serverId?: string) {
    const link = Routes.channels;

    return new Promise(async (resolve) => {
      try {
        if (serverId) buildr.setServer(serverId);
        if (!buildr.type) buildr.setType('chat');

        const { channel }: { channel: APIChannel } =
          await this.client.rest.post(link, {
            body: JSON.stringify(buildr)
          });

        resolve(
          new BaseChannel(
            channel,
            {
              server: await this.client.servers.fetch(channel.id)
            },
            this.client
          )
        );
      } catch (err) {
        resolve(false);
        throw new GuildedApiError(err);
      }
    });
  }
}

export class EmoteCollection extends Collection<string, any> {}

export class ServerCollection extends Collection<string, BaseServer> {
  fetch(id: string): Promise<BaseServer> {
    return new Promise(async (resolve, reject) => {
      let f: BaseServer = this.get(id);
      if (!f) {
        const { server }: { server: APIServer } = await this.client.rest.get(
          Routes.server(id)
        );
        if (!server || !server.id) return new GuildedApiError('Unknown Server');

        const newObj = new BaseServer(server, this.client);

        if (!newObj || !newObj.id) return new GuildedApiError('Unknown Server');

        this.set(id.toString(), newObj);
        f = this.get(id);
      }

      return resolve(f);
    });
  }
}

export class MemberCollection extends Collection<string, Member> {
  fetch(id: string, serverId: string): Promise<Member> {
    return new Promise(async (resolve, reject) => {
      let f = this.get(id);
      if (!f) {
        const obj = await this.client.rest.get(
          Routes.serverMember(serverId, id)
        );

        const member = obj.member;

        if (!member || !member.user) return resolve(undefined);
        const newObj = new Member(member, {
          server: await this.client.servers.fetch(serverId),
          user: await this.client.users.fetch({}, member.user)
        });

        if (!newObj || !newObj.id) return resolve(undefined);

        this.set(id.toString(), newObj);

        f = this.get(id);
      }

      return resolve(f);
    });
  }
}

export class UserCollection extends Collection<string, User> {
  fetch({}, user: APIUser | APIUserSummary): Promise<User> {
    return new Promise(async (resolve, reject) => {
      let f = this.get(user.id);
      if (!f) {
        const newObj = new User(user);

        if (!newObj || !newObj.id) return new GuildedApiError('Unknown User');

        this.set(user.id.toString(), newObj);
        f = this.get(user.id);
      }

      return resolve(f);
    });
  }
}
