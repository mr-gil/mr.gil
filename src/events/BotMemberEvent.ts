import { APIServer } from 'guilded-api-typings';
import { Client } from '../Client';
import { BaseServer, Member } from '../components';

export async function BotMemberEvent(
  type: string,
  data: { createdBy: string; server: APIServer },
  client: Client
) {
  const server = new BaseServer(data.server, client);
  const member = await server.members.fetch(data.createdBy, server.id);

  if (type == 'BotServerMembershipCreated') {
    const obj: botCreate = { server, createdBy: member };
    client.emit('botCreate', obj);
    client.emit('BotServerMembershipCreated', obj);
  } else if (type == 'BotServerMembershipDeleted') {
    const obj: botDelete = { server, deletedBy: member };
    client.emit('botDelete', obj);
    client.emit('BotServerMembershipDeleted', obj);
  }
}

export type botCreate = { server: BaseServer; createdBy: Member };
export type botDelete = { server: BaseServer; deletedBy: Member };
