import { APIListItem } from 'guilded-api-typings/typings';
import { Client } from '../Client';
import { BaseServer } from '../components';
import { ListItem } from '../components/ListItem';

export async function ListItemEvents(
  type: string,
  data: { serverId: string; listItem: APIListItem },
  client: Client
) {
  const channel = await client.channels.fetch(data.listItem.channelId);

  if (type === 'ListItemCreated') {
    const list = new ListItem(data.listItem, {
      channel: channel,
      member: await channel.server.members.fetch(
        data.listItem.createdBy,
        data.serverId
      )
    });

    client.emit('listCreate', list);
    client.emit('ListItemCreated', list);
  }
}
