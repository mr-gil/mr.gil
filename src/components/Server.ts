import {
  APIEmote,
  APIServer,
  APIServerBan,
  APIServerMember,
  Routes,
  ServerType
} from 'guilded-api-typings';
import { Client } from '../Client';
import { Collection, MemberCollection } from './Collection';
import { MemberBan } from './MemberBan';
import { Member, User } from './User';
import { GuildedApiError } from '../errors/apiError';

export class Emote {
  name: string;
  id: number;
  url: string;

  constructor(obj: APIEmote) {
    this.name = obj.name;
    this.id = obj.id;
    this.url = obj.url;
  }

  get imageUrl() {
    return this.url;
  }

  toString() {
    return `:${this.name}:`;
  }
}

export class BaseServer {
  private _client: Client;
  about: string;
  avatar: string;
  banner: string;
  bans: Bans;
  createdAt: Date;
  defaultChannelId: string;
  icon: string;
  id: string;
  isVerified: boolean;
  members: MemberCollection;
  name: string;
  ownerId: string;
  timezone: string;
  type: ServerType;
  url: string;
  verified: boolean;

  constructor(server: APIServer, client: Client) {
    this.id = server.id;
    this.name = server.name;
    this.avatar = this.icon = server.avatar;
    this.about = server.about;
    this.isVerified = this.verified = server.isVerified;
    this.banner = server.banner;
    this.ownerId = server.ownerId;
    this.createdAt = new Date(server.createdAt);
    this.defaultChannelId = server.defaultChannelId;
    this.timezone = server.timezone;
    this.url = server.url;
    this.type = server.type;

    Object.defineProperty(this, 'members', {
      enumerable: false,
      writable: false,
      value: new MemberCollection([], {
        type: 'members',
        client: client
      })
    });

    Object.defineProperty(this, 'bans', {
      enumerable: false,
      writable: false,
      value: new Bans(this, client)
    });
    Object.defineProperty(this, '_client', {
      enumerable: false,
      writable: false,
      value: client
    });
  }

  fetchBulk() {
    const link = Routes.serverMembers(this.id);

    return new Promise(async (resolve) => {
      try {
        const { members }: { members: APIServerMember[] } =
          await this._client.rest.get(link);

        const col = new Collection([], { client: this._client });
        members.forEach(async (m: APIServerMember) => {
          const mem = new Member(m, {
            server: this,
            user: await this._client.users.fetch({}, m.user)
          });

          col.set(mem.id, mem);
        });

        resolve(col);
      } catch (err) {
        throw new GuildedApiError(err);
      }
    });
  }

  setRoleXp(amount: number, roleId: number) {
    const link = Routes.serverRoleXp(this.id, roleId);

    return new Promise(async (resolve) => {
      try {
        await this._client.rest.post(link, {
          body: JSON.stringify({ amount: amount })
        });

        resolve(true);
      } catch (err) {
        resolve(false);
        throw new GuildedApiError(err);
      }
    });
  }
}

class Bans {
  client: Client;
  serverId: string;

  constructor(server: BaseServer, client: Client) {
    this.serverId = server.id;
    Object.defineProperty(this, 'client', {
      enumerable: false,
      writable: false,
      value: client
    });
  }

  async fetch() {
    const ban = await this.client.rest.get(Routes.serverBans(this.serverId));
    const bans = new Collection<string, MemberBan>([], { client: this.client });

    ban.forEach(async (b: APIServerBan) => {
      const user = await this.client.users.fetch({}, b.user);
      const banz = new MemberBan(b, { user: user });

      bans.set(user.id, banz);
    });

    return bans;
  }

  get(user: User | string): Promise<MemberBan> {
    const link = Routes.serverBan(
      this.serverId,
      user instanceof User ? user.id : user
    );

    return new Promise(async (resolve, reject) => {
      try {
        const ban: APIServerBan = await this.client.rest.get(link);

        const serverBan = new MemberBan(ban, {
          user:
            user instanceof User
              ? user
              : await this.client.users.fetch({}, ban.user)
        });

        resolve(serverBan);
      } catch (err: any) {
        throw new GuildedApiError(err);
      }
    });
  }

  create(user: User, reason?: string) {
    const link = Routes.serverBan(this.serverId, user.id);
    return new Promise(async (resolve, reject) => {
      try {
        const ban = await this.client.rest.post(link, {
          body: JSON.stringify({ reason: reason || 'No Reason' })
        });

        const serverBan = new MemberBan(ban, { user: user });

        resolve(serverBan);
      } catch (err: any) {
        throw new GuildedApiError(err);
      }
    });
  }

  remove(user: User, reason?: string) {
    const link = Routes.serverBan(this.serverId, user.id);
    return new Promise(async (resolve, reject) => {
      try {
        await this.client.rest.delete(link);

        resolve({
          user: user,
          unban: true,
          reason: reason
        });
      } catch (err: any) {
        resolve(false);
        throw new GuildedApiError(err);
      }
    });
  }
}
