import { APIMessage } from 'guilded-api-typings';
import { Client } from '../Client';
import { Message } from '../components';

export async function MessageEvents(
  type: string,
  data: { serverId: string; message: APIMessage & { deletedAt: Date } },
  client: Client
) {
  const channel = await client.channels.fetch(data.message.channelId);
  if (type === 'ChatMessageUpdated') {
    const oldMessage = channel.messages.cache.get(data.message.id);
    const newMessage = new Message(data.message, {
      channel: channel,
      member: data.message.createdByWebhookId
        ? await channel.webhooks.fetch(data.message.createdByWebhookId)
        : await channel.server.members.fetch(
            data.message.createdBy,
            data.serverId
          )
    });

    client.emit('messageUpdate', newMessage, oldMessage);

    client.emit('ChatMessageUpdated', newMessage, oldMessage);
  } else if (type === 'ChatMessageCreated') {
    const message: Message = new Message(data.message, {
      channel: channel,
      member: await channel.server.members.fetch(
        data.message.createdBy,
        data.serverId
      )
    });
    if (data.message.createdBy == client.user.id)
      return client.emit('myMessage', message);

    client.emit('messageCreate', message);
    client.emit('ChatMessageCreated', message);
  } else if (type === 'ChatMessageDeleted') {
    // messageDelete
    const delMsg = channel.messages.cache.get(data.message.id);

    if (!delMsg) return;

    delMsg.deletedAt = new Date(data.message.deletedAt);

    client.emit('messageDelete', delMsg);
    client.emit('ChatMessageDeleted', delMsg);
  }
}
