import { APIServerBan } from 'guilded-api-typings/typings';
import { User } from './User';

export class MemberBan {
  bannedAt: Date;
  bannedBy: string;
  createdAt: Date;
  createdBy: string;
  reason: string;

  constructor(data: APIServerBan, private obj: { user: User }) {
    this.reason = data.reason;
    this.createdAt = this.bannedAt = new Date(data.createdAt);
    this.createdBy = this.bannedBy = data.createdBy;
  }

  get user() {
    return this.obj.user;
  }
}
