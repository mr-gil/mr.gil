import { APIListItem } from 'guilded-api-typings';
import { Client } from '../Client';
import { ListChannel } from '../components';
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
  } else if (type === 'ListItemUpdated') {
    const oldList = channel.lists.cache.get(data.listItem.id);

    const list = new ListItem(data.listItem, {
      channel: channel,
      member: await channel.server.members.fetch(
        data.listItem.createdBy,
        data.serverId
      )
    });

    client.emit('listUpdate', list, oldList);
    client.emit('ListItemUpdated', list, oldList);
  } else if (type === 'ListItemDeleted') {
    const oldList = channel.lists.cache.get(data.listItem.id);

    if (!oldList) {
      const list = new ListItem(data.listItem, {
        channel: channel,
        member: await channel.server.members.fetch(
          data.listItem.createdBy,
          data.serverId
        )
      });

      client.emit('listDelete', list);
      client.emit('ListItemDeleted', list);
    } else {
      client.emit('listDelete', oldList);
      client.emit('ListItemDeleted', oldList);
    }
  } else if (type === 'ListItemCompleted') {
    const list = new ListItem(data.listItem, {
      channel: channel,
      member: await channel.server.members.fetch(
        data.listItem.createdBy,
        data.serverId
      ),
      completed: await channel.server.members.fetch(
        data.listItem.completedBy,
        data.serverId
      )
    });

    client.emit('listComplete', list);
    client.emit('ListItemCompleted', list);
  } else if (type === 'ListItemUncompleted') {
    const list = new ListItem(data.listItem, {
      channel: channel,
      member: await channel.server.members.fetch(
        data.listItem.createdBy,
        data.serverId
      )
    });

    client.emit('listUncomplete', list);
    client.emit('ListItemUncompleted', list);
  }
}
