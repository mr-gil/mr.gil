import { Client } from "../Client";
import { BaseServer, Member } from "../components";

export async function TeamRolesEvent(type: string, data: any, client: Client) {
  const server = await client.servers.fetch(data.serverId);
  const updates: updates[] = [];

  var format = new Promise<void>((resolve) => {
    data.memberRoleIds.forEach(
      async (m: { userId: string; roleIds: number[] }, index: number, array: string | any[]) => {
        const member = await server.members.fetch(m.userId, server.id);

        updates.push({
          userId: m.userId,
          member,
          roleIds: m.roleIds,
        });
        if (index === array.length - 1) resolve();
      }
    );
  });

  format.then(() => {
    const obj: roleUpdate = { server, updates };

    client.emit("roleUpdate", obj);
    client.emit("teamRolesUpdated", obj);
  });
}

type updates = {
  userId: string;
  member: Member;
  roleIds: number[];
};

type roleUpdate = {
  server?: BaseServer;
  updates?: updates[];
};
