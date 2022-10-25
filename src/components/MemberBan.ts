import { APIServerBan } from "guilded-api-typings/typings";
import { User } from "./User";

export class MemberBan {
  user: User;
  reason: string;
  bannedBy: string;
  createdBy: string;
  createdAt: Date;
  bannedAt: Date;

  constructor(data: APIServerBan, obj: { user: User }) {
    this.user = obj.user;
    this.reason = data.reason;
    this.createdAt = this.bannedAt = new Date(data.createdAt)
    this.createdBy = this.bannedBy = data.createdBy;
  }
}