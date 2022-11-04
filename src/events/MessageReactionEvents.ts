import { Client } from '../Client';
import { MessageReaction } from '../components';

export async function MessageReactionEvents(
  type: string,
  data: any,
  client: Client
) {
  const channel = await client.channels.fetch(data.reaction.channelId);
  const message = await channel.messages.fetch(data.reaction.messageId);
  const server = message.server;
  const member = await server.members.fetch(data.reaction.createdBy, server.id);

  const reaction = new MessageReaction(data.reaction, { message, member });
  if (type == 'ChannelMessageReactionCreated') {
    client.emit('reactionCreate', reaction);
    client.emit('messageReactionAdd', reaction);
    client.emit('ChannelMessageReactionCreated', reaction);
  } else if (type == 'ChannelMessageReactionDeleted') {
    client.emit('reactionDelete', reaction);
    client.emit('messageReactionRemove', reaction);
    client.emit('ChannelMessageReactionDeleted', reaction);
  }
}
