import {
  APIChannel,
  APIServer,
  APIServerMember,
  APIUser,
  Routes,
} from "guilded-api-typings";
import { Client } from "../Client";
import { GilError } from "../errors/error";
import { AnyChannel } from "./Channel";
import { BaseServer, User, Member, ChatChannel } from "./index";

type collectionObj = {
  type?: "users" | "members" | "servers" | "channels" | "emotes";
  client?: Client;
  maxSize?: number;
};

export class Collection extends Map {
  fetchLinkType: string;
  private _client: Client;
  public maxSize?: number;

  constructor(arr: any[], options: collectionObj) {
    super();
    this.maxSize = options.maxSize || this._client?.cacheSize || 25;
    if (this.maxSize && this.maxSize <= 1)
      throw new GilError("Max cache size must be greater than 1.");

    this.fetchLinkType = options.type;

    Object.defineProperty(this, "_client", {
      enumerable: false,
      writable: false,
      value: options.client,
    });
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

  set(key: any, value: any) {
    if (this.maxSize && this.size >= this.maxSize) this.delete(this.first()!);

    return super.set(key, value);
  }

  map(fn = () => {}) {
    return this.array().map(fn);
  }

  fetch(id: string, {}, {}): Promise<any> {
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

export class ChannelCollection extends Collection {
  fetch(id: string): Promise<AnyChannel> {
    return new Promise(async (resolve, reject) => {
      let f: AnyChannel = this.get(id);
      if (!f) {
        const { channel }: { channel: APIChannel } = await this.client.rest.get(
          Routes.channel(id)
        );
        if (!channel || !channel.id) return reject("Unknown Channel");

        const newObj = new ChatChannel(
          channel,
          { server: await this.client.servers.fetch(channel.serverId) },
          this.client
        ) as AnyChannel;

        if (!newObj || !newObj.id) return reject("Unknown Channel");

        this.set(id.toString(), newObj);
        f = this.get(id);
      }
      return resolve(f);
    });
  }
}

export class EmoteCollection extends Collection {}

export class ServerCollection extends Collection {
  fetch(id: string): Promise<BaseServer> {
    return new Promise(async (resolve, reject) => {
      let f: BaseServer = this.get(id);
      if (!f) {
        const { server }: { server: APIServer } = await this.client.rest.get(
          Routes.server(id)
        );
        if (!server || !server.id) return reject("Unknown Server");

        const newObj = new BaseServer(server);

        if (!newObj || !newObj.id) return reject("Unknown Server");

        this.set(id.toString(), newObj);
        f = this.get(id);
      }

      return resolve(f);
    });
  }
}

export class MemberCollection extends Collection {
  fetch(id: string, serverId: string): Promise<Member> {
    return new Promise(async (resolve, reject) => {
      let f = this.get(id);
      if (!f) {
        const { member }: { member: APIServerMember } =
          await this.client.rest.get(Routes.serverMember(serverId, id));

        if (!member || !member.user) return reject("Unknown User/Member");
        const newObj = new Member(member, {
          server: await this.client.servers.fetch(serverId),
          user: await this.client.users.fetch({}, member.user),
        });

        if (!newObj || !newObj.id) return reject("Unknown User/Member");

        this.set(id.toString(), newObj);
        f = this.get(id);
      }

      return resolve(f);
    });
  }
}

export class UserCollection extends Collection {
  fetch({}, user: APIUser): Promise<User> {
    return new Promise(async (resolve, reject) => {
      let f = this.get(user.id);
      if (!f) {
        const newObj = new User(user);

        if (!newObj || !newObj.id) return reject("Unknown User");

        this.set(user.id.toString(), newObj);
        f = this.get(user.id);
      }

      return resolve(f);
    });
  }
}
