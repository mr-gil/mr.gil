import {
  APIServerMember,
  APIUser,
  APIUserSummary,
  Routes
} from 'guilded-api-typings';
import { resolve } from 'path';
import { Client } from '../Client';
import { GuildedApiError } from '../errors/apiError';
import { MemberBan } from './MemberBan';
import { BaseServer } from './Server';

export class User extends String {
  name: string;
  id: string;
  bot: boolean;
  avatar: string;
  createdAt: Date;
  banner: string;

  constructor(user: APIUser | APIUserSummary) {
    super(user.name);
    this.name = user.name;
    this.id = user.id; // @ts-ignore
    this.bot = user.botId ? true : user.type == 'bot';
    this.avatar = user.avatar;
    this.banner = 'banner' in user ? user.banner : undefined;
    this.createdAt = 'createdAt' in user ? new Date(user.createdAt) : undefined;
  }

  get mention() {
    return `<@${this.id}>`;
  }

  avatarURL() {
    return this.avatar;
  }

  toString() {
    return `<@${this.id}>`;
  }
}

export class Member extends String {
  nickname: Nickname;
  id: string;
  roles: number[];
  isOwner: boolean;
  joinedAt: Date;
  user: User;
  private _client: Client;

  constructor(
    member: APIServerMember,
    private obj: { server: BaseServer; user: User }
  ) {
    super();

    this.user = obj.user;
    this.id = member.user.id;

    this.roles = member.roleIds;
    this.isOwner = member.isOwner;
    this.joinedAt = new Date(member.joinedAt);

    this.nickname = new Nickname(member.nickname, this);
  }

  get server() {
    return this.obj.server;
  }

  toString() {
    return `<@${this.id}>`;
  }

  kick(reason: string) {
    const link = Routes.serverMember(this.server.id, this.id);

    return new Promise(async (resolve) => {
      try {
        await this._client.rest.delete(link);

        resolve({
          user: this.user,
          kick: true,
          reason: reason || 'No Reason'
        });
      } catch (err) {
        resolve(false);
        throw new GuildedApiError(err);
      }
    });
  }

  ban(reason: string): Promise<MemberBan> {
    const link = Routes.serverBan(this.server.id, this.id);
    return new Promise(async (resolve, reject) => {
      try {
        const ban = await this._client.rest.post(link, {
          body: JSON.stringify({ reason: reason || 'No Reason' })
        });

        const serverBan = new MemberBan(ban, { user: this.user });

        resolve(serverBan);
      } catch (err: any) {
        throw new GuildedApiError(err);
      }
    });
  }
}

class Nickname extends String {
  name: string;
  private member: Member;

  constructor(string: string, member: Member) {
    super(string);
    this.name = string;

    Object.defineProperty(this, 'member', {
      enumerable: false,
      writable: false,
      value: member
    });
  }

  async set(client: Client, name: string) {
    const link = Routes.serverNickname(this.member.server.id, this.member.id);

    let response: { nickname: string } = await client.rest.put(link, {
      body: JSON.stringify({ nickname: name })
    });

    return response;
  }

  reset(client: Client) {
    const link = Routes.serverNickname(this.member.server.id, this.member.id);

    return new Promise(async (resolve) => {
      try {
        await client.rest.delete(link);

        resolve(true);
      } catch (err) {
        resolve(false);
        throw new GuildedApiError(err);
      }
    });
  }
}
