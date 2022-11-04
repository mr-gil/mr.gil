import { APIServerBan } from 'guilded-api-typings/typings';
import { User } from './User';

export class MemberBan {
  bannedAt: Date;
  bannedBy: string;
  createdAt: Date;
  createdBy: string;
  obj: { user: User };
  reason: string;

  constructor(data: APIServerBan, obj: { user: User }) {
    this.reason = data.reason;
    this.createdAt = this.bannedAt = new Date(data.createdAt);
    this.createdBy = this.bannedBy = data.createdBy;

    Object.defineProperty(this, 'obj', {
      enumerable: false,
      writable: true,
      value: obj
    });
  }

  get user() {
    return this.obj.user;
  }
}
