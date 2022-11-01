import { APIEmote, APIServer, Routes } from "guilded-api-typings";
import { BaseChannel } from "./Channel";
import { Client } from "../Client";
import { MemberCollection } from "./Collection";

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
  id: string;
  name: string;
  icon: string;
  avatar: string;
  about: string;
  isVerified: boolean;
  banner: string;
  ownerId: string;
  createdAt: Date;
  defaultChannelId: string;
  timezone: string;
  members: MemberCollection;
  url: string;
  type:
    | "team"
    | "organization"
    | "community"
    | "clan"
    | "guild"
    | "friends"
    | "streaming"
    | "other";
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

    this.members = new MemberCollection([], {
      type: "members",
      client: client,
    });
  }
}
