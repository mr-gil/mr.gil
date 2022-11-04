import { APIServerBan } from 'guilded-api-typings/typings';
import { User } from './User';

export class MemberBan {
  reason: string;
  bannedBy: string;
  createdBy: string;
  createdAt: Date;
  bannedAt: Date;

  constructor(data: APIServerBan, private obj: { user: User }) {
    this.reason = data.reason;
    this.createdAt = this.bannedAt = new Date(data.createdAt);
    this.createdBy = this.bannedBy = data.createdBy;
  }

  get user() {
    return this.obj.user;
  }
}
