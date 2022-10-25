import { Client } from "../Client";
import { Message } from "../components";

export async function MessageEvents(type: string, data: any, client: Client) {
  if (type === "ChatMessageUpdated") {
    // messageUpdate
    const channel = await client.channels.fetch(data.message.channelId);
    const oldMessage = channel.messages.cache.get(data.message.id);
    const newMessage = new Message(
      data.message,
      {
        server: await client.servers.fetch(data.serverId),
        channel: await client.channels.fetch(data.message.channelId),
        member: await client.members.fetch(
          data.message.createdBy,
          data.serverId
        ),
      },
      client
    );

    client.emit("messageUpdate", newMessage, oldMessage);
  } else if (type === "ChatMessageCreated") {
    // messageCreate
    const message: Message = new Message(
      data.message,
      {
        server: await client.servers.fetch(data.serverId),
        channel: await client.channels.fetch(data.message.channelId),
        member: await client.members.fetch(
          data.message.createdBy,
          data.serverId
        ),
      },
      client
    );
    if (data.message.createdBy == client.user.id)
      return client.emit("myMessage", message);

    client.emit("messageCreate", message);
  } else if (type === "ChatMessageDeleted") {
    // messageDelete
    const channel = await client.channels.fetch(data.message.channelId);
    const delMsg = channel.messages.cache.get(data.message.id);
    
    if (!delMsg) return;

    delMsg.deletedAt = new Date(data.message.deletedAt);

    client.emit("messageDelete", delMsg);
  }
}
