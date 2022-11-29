import { APIChannel } from 'guilded-api-typings';
import { Client } from '../Client';
import { AnyChannel } from '../components';

export async function ChannelEvents(
  type: string,
  data: { serverId: string; channel: APIChannel },
  client: Client
) {
  if (type === 'ServerChannelCreated') {
    const channel: AnyChannel = await client.channels.generate(data.channel);

    client.emit('channelCreate', channel);
    client.emit('ServerChannelCreated', channel);
  } else if (type === 'ServerChannelUpdated') {
    const oldChannel = await client.channels.fetch(data.channel.id);
    const channel: AnyChannel = await client.channels.generate(data.channel);

    client.emit('channelUpdate', oldChannel, channel);
    client.emit('ServerChannelUpdated', channel, oldChannel);
  } else if (type === 'ServerChannelDeleted') {
    const channel: AnyChannel = await client.channels.generate(data.channel);

    client.emit('channelDelete', channel);
    client.emit('ServerChannelDeleted', channel);
  }
}
