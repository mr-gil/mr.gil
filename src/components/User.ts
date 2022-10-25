import {
  APIServer,
  APIServerMember,
  APIUser,
  APIUserSummary,
  Routes,
} from "guilded-api-typings";
import { Client } from "../Client";
import { BaseServer } from "./Server";

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
    this.bot = (user.botId ? true : user.type == "bot");
    this.avatar = user.avatar;
    this.banner = "banner" in user ? user.banner : undefined;
    this.createdAt = "createdAt" in user ? new Date(user.createdAt) : undefined;
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
  nickname: string;
  id: string;
  roles: number[];
  isOwner: boolean;
  joinedAt: Date;
  user: User;
  server: BaseServer;

  constructor(
    member?: APIServerMember,
    obj?: { server: BaseServer, user: User }
  ) {
    super();
        this.user = obj.user
        this.id = member.user.id;
        this.nickname = member.nickname;
        this.roles = member.roleIds;
        this.isOwner = member.isOwner;
        this.joinedAt = new Date(member.joinedAt);
        this.server = obj.server
  }

  toString() {
    return `<@${this.id}>`;
  }
}
