import { Client } from '../Client';
import { MessageEvents } from './MessageEvents';
import { TeamMemberEvents } from './TeamMemberEvents';
import { DocEvents } from './DocEvents';
import { BotMemberEvent } from './BotMemberEvent';
import { TeamRolesEvent } from './TeamRolesEvent';
import { MessageReactionEvents } from './MessageReactionEvents';
import { TeamWebhookEvents } from './TeamWebhookEvents';

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
}
