import { Client } from "../Client";
import { BaseServer, Member } from "../components";

export async function BotMemberEvent(type: string, data: any, client: Client) {
  const server = new BaseServer(data.server, client);
  const member = await server.members.fetch(data.createdBy, server.id);

  const obj: botCreate = { server, member };
  client.emit("botCreate", obj);
  client.emit("BotTeamMembershipCreated", obj);
}

type botCreate = { server: BaseServer; member: Member };