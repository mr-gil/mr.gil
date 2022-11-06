import { APIMessageReaction } from 'guilded-api-typings';
import { Client } from '../Client';
import { MessageReaction } from '../components';

export async function MessageReactionEvents(
  type: string,
  data: { serverId: string; reaction: APIMessageReaction },
  client: Client
) {
  const channel = await client.channels.fetch(data.reaction.channelId);
  const message = await channel.messages.fetch(data.reaction.messageId);
  const server = message.server;
  const member = await server.members.fetch(data.reaction.createdBy, server.id);

  const reaction = new MessageReaction(data.reaction, { message, member });
  if (type == 'ChannelMessageReactionCreated') {
    client.emit('messageReact', reaction);
    client.emit('ChannelMessageReactionCreated', reaction);
  } else if (type == 'ChannelMessageReactionDeleted') {
    client.emit('messageUnreact', reaction);
    client.emit('ChannelMessageReactionDeleted', reaction);
  }
}
