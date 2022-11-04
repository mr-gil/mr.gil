import { Mentions } from './Message';
import { Webhook } from './Webhook';

export class ForumTopic {
  bumpedAt?: Date;
  channelId: string;
  content: string;
  createdAt: Date;
  createdBy: string;
  id: number;
  locked?: boolean;
  mentions?: Mentions;
  pinned?: boolean;
  serverId: string;
  title: string;
  updatedAt?: Date;
  webhook?: Webhook;
}
