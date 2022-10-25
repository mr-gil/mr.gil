import { Client } from "../Client";
import { Message } from "../components";
import {
  ChannelCollection,
  MemberCollection,
  ServerCollection,
  UserCollection,
} from "../components/Collection";

export async function dispatch(
  type: string,
  data: any,
  client: Client
) {
  if (!type) {
    client.users = new UserCollection([], { type: "users", client: client });
    client.servers = new ServerCollection([], {
      type: "servers",
      client: client,
    });

    client.channels = new ChannelCollection([], {
      type: "channels",
      client: client,
    });
    client.members = new MemberCollection([], {
      type: "members",
      client: client,
    });

    client.user = await client.users.fetch({}, data?.user);
  }

  if (type === "ChatMessageCreated") {
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
  }
}
