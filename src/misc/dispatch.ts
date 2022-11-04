import { Client } from '../Client';

import {
  ChannelCollection,
  ServerCollection,
  UserCollection
} from '../components/Collection';

import eventHandler from '../events';

/**
 * Emitting events based on the API Event type `(NOT INTENDED FOR END-USER)`
 * @param type
 * @param data
 * @param client
 * @ignore
 */
export async function dispatch(type: string, data: any, client: Client) {
  if (!type) {
    client.users = new UserCollection([], { type: 'users', client: client });
    client.servers = new ServerCollection([], {
      type: 'servers',
      client: client
    });

    client.channels = new ChannelCollection([], {
      type: 'channels',
      client: client
    });

    client.user = await client.users.fetch({}, data?.user);

    client.emit('ready', client);
  } else eventHandler(type, data, client);
}
