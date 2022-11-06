import { Client } from '../Client';
import { MessageEvents } from './MessageEvents';
import { TeamMemberEvents } from './TeamMemberEvents';
import { DocEvents } from './DocEvents';
import { botCreate, BotMemberEvent } from './BotMemberEvent';
import { roleUpdate, TeamRolesEvent } from './TeamRolesEvent';
import { MessageReactionEvents } from './MessageReactionEvents';
import { TeamWebhookEvents } from './TeamWebhookEvents';
import { ForumTopicEvents } from './ForumTopicEvents';
import { TopicReactionEvents } from './TopicReactionEvents';
import {
  Doc,
  Member,
  MemberBan,
  Message,
  MessageReaction,
  User,
  Webhook
} from '../components';
import { APIServerBan } from 'guilded-api-typings/typings';
import { ForumTopic, ForumTopicReaction } from '../components/ForumTopic';

export default function eventHandler(type: string, data: any, client: Client) {
  if (type.includes('ChatMessage')) MessageEvents(type, data, client);
  else if (type.includes('TeamMember')) TeamMemberEvents(type, data, client);
  else if (type.includes('Doc')) DocEvents(type, data, client);
  else if (type == 'BotTeamMembershipCreated')
    BotMemberEvent(type, data, client);
  else if (type == 'teamRolesUpdated') TeamRolesEvent(type, data, client);
  else if (type.includes('ChannelMessageReaction'))
    MessageReactionEvents(type, data, client);
  else if (type.includes('TeamWebhook')) TeamWebhookEvents(type, data, client);
  else if (type.includes('ForumTopicReaction'))
    TopicReactionEvents(type, data, client);
  else if (type.includes('ForumTopic')) ForumTopicEvents(type, data, client);
}

type gilEvents = {
  ready: () => void;
  raw: (data: any) => void;
  error: (err: Error) => void;
  // ----------------------
  // MR.GIL EVENTS
  // ----------------------

  // message events
  myMessage: (message: Message) => void;

  messageCreate: (message: Message) => void;
  messageUpdate: (newMessage: Message, oldMessage: Message) => void;
  messageDelete: (message: Message) => void;
  // message reaction events
  messageReact: (reaction: MessageReaction) => void;
  messageUnreact: (reaction: MessageReaction) => void;

  // team roles event
  roleUpdate: (update: roleUpdate) => void;
  // team member events
  memberJoin: (member: Member) => void;
  memberKick: (user: User) => void;
  memberRemove: (user: User) => void;
  memberBan: (ban: MemberBan | APIServerBan) => void;
  memberUnban: (ban: MemberBan | APIServerBan) => void;
  memberUpdate: (oldMember: Member, newMember: Member) => void;

  // webhook events
  webhookCreate: (webhook: Webhook) => void;
  webhookUpdate: (oldwebhook: Webhook, webhook: Webhook) => void;

  // bot create events
  botCreate: (bot: botCreate) => void;
  // doc events
  docCreate: (doc: Doc) => void;
  docUpdate: (olddoc: Doc | {}, newDoc: Doc) => void;
  docDelete: (doc: Doc) => void;
  // topic reaction events
  topicReact: (reaction: ForumTopicReaction) => void;
  topicUnreact: (reaction: ForumTopicReaction) => void;
  // forum events
  topicCreate: (forum: ForumTopic) => void;
  topicUpdate: (oldForum: ForumTopic, newForum: ForumTopic) => void;
  topicDelete: (forum: ForumTopic) => void;
  topicPin: (forum: ForumTopic) => void;
  topicUnpin: (forum: ForumTopic) => void;
  topicLock: (forum: ForumTopic) => void;
  topicUnlock: (forum: ForumTopic) => void;
};

type apiEvents = {
  // ----------------------
  // GUILDED API EVENTS
  // ----------------------

  // message events
  ChatMessageCreated: (message: Message) => void;
  ChatMessageUpdated: (newMessage: Message, oldMessage: Message) => void;
  ChatMessageDeleted: (message: Message) => void;

  // message reaction events
  ChannelMessageReactionDeleted: (reaction: MessageReaction) => void;
  ChannelMessageReactionCreated: (reaction: MessageReaction) => void;

  // team roles event
  teamRolesUpdated: (update: roleUpdate) => void;

  // team member events
  TeamMemberJoined: (member: Member) => void;
  TeamMemberRemoved: (user: User) => void;
  TeamMemberBanned: (ban: MemberBan | APIServerBan) => void;
  TeamMemberUnbanned: (ban: MemberBan | APIServerBan) => void;
  TeamMemberUpdated: (oldMember: Member, newMember: Member) => void;

  // webhook events
  TeamWebhookCreated: (webhook: Webhook) => void;
  TeamWebhookUpdated: (oldwebhook: Webhook, webhook: Webhook) => void;
  // bot create events
  BotTeamMembershipCreated: (bot: botCreate) => void;

  // doc events
  DocCreated: (doc: Doc) => void;
  DocUpdated: (olddoc: Doc | {}, newDoc: Doc) => void;
  DocDeleted: (doc: Doc) => void;

  // topic reaction events
  ForumTopicReactionCreated: (reaction: ForumTopicReaction) => void;
  ForumTopicReactionDeleted: (reaction: ForumTopicReaction) => void;
  // forum events
  ForumTopicCreated: (forum: ForumTopic) => void;
  ForumTopicUpdated: (oldForum: ForumTopic, newForum: ForumTopic) => void;
  ForumTopicDeleted: (forum: ForumTopic) => void;
  ForumTopicPinned: (forum: ForumTopic) => void;
  ForumTopicUnpinned: (forum: ForumTopic) => void;
  ForumTopicLocked: (forum: ForumTopic) => void;
  ForumTopicUnlocked: (forum: ForumTopic) => void;
};

export type clientEvents = apiEvents & gilEvents;
