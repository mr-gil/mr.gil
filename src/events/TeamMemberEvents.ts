import { APIServerBan, APIServerMember, Routes } from 'guilded-api-typings';
import { Client } from '../Client';
import { Member, MemberBan } from '../components';

export async function TeamMemberEvents(
  type: string,
  data: teamMemberPayload,
  client: Client
) {
  const server = await client.servers.fetch(data.serverId);
  if (type === 'TeamMemberJoined') {
    // memberJoin
    const member = await server.members.fetch(
      data.member.user.id,
      data.serverId
    );

    client.emit('memberJoin', member); // mr.gil event
    client.emit('TeamMemberJoined', member); // API WS event
  } else if (type === 'TeamMemberRemoved') {
    // memberRemove

    const member = await server.members.fetch(data.userId, data.serverId);
    const user = member.user;

    if (data.isKick) {
      client.emit('memberKick', user); // mr.gil event
      client.emit('TeamMemberRemoved', user); // API WS event
    } else if (!data.isBan) {
      client.emit('memberRemove', user); // mr.gil event
      client.emit('TeamMemberRemoved', user); // API WS event
    }
  } else if (type === 'TeamMemberBanned') {
    // memberBan
    try {
      const member = await server.members.fetch(
        data.serverMemberBan?.user?.id,
        data.serverId
      );

      const banObj = new MemberBan(data.serverMemberBan, { user: member.user });

      client.emit('memberBan', banObj); // mr.gil event
      client.emit('TeamMemberBanned', banObj); // API WS event
    } catch (err) {
      // Uncached User ;(

      client.emit('memberBan', data.serverMemberBan); // mr.gil event
      client.emit('TeamMemberBanned', data.serverMemberBan); // API WS event
    }
  } else if (type === 'TeamMemberUnbanned') {
    // memberUnban
    try {
      const member = await server.members.fetch(
        data.serverMemberBan?.user?.id,
        data.serverId
      );

      const banObj = new MemberBan(data.serverMemberBan, { user: member.user });

      client.emit('memberUnban', banObj); // mr.gil event
      client.emit('TeamMemberUnbanned', banObj); // API WS event
    } catch (err) {
      // Uncached User ;(
      client.emit('memberUnban', data.serverMemberBan); // mr.gil event
      client.emit('TeamMemberUnbanned', data.serverMemberBan); // API WS event
    }
  } else if (type === 'TeamMemberUpdated') {
    // memberUpdate
    const { member }: { member: APIServerMember } = await client.rest.get(
      Routes.serverMember(data.serverId, data.userInfo.id)
    );
    let oldMember = server.members.get(data.userInfo.id);
    if (!oldMember)
      oldMember = await server.members.fetch(data.userInfo.id, data.serverId);

    const newMember = new Member(member, {
      server: await client.servers.fetch(data.serverId),
      user: await client.users.fetch({}, member.user)
    });

    server.members.set(data.userInfo.id, newMember);

    client.emit('memberUpdate', oldMember, newMember); // mr.gil event
    client.emit('TeamMemberUpdated', oldMember, newMember); // API WS event
  }
}

export type teamMemberPayload = {
  serverId: string;
  userId?: string;
  member: APIServerMember;
  isKick?: boolean;
  isBan?: boolean;
  serverMemberBan?: APIServerBan;
  userInfo?: { id: string; nickname: string };
};
