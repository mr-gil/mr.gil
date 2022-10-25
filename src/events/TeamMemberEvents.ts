import { APIServerMember, Routes } from "guilded-api-typings";
import { Client } from "../Client";
import { Member, MemberBan } from "../components";

export async function TeamMemberEvents(
  type: string,
  data: any,
  client: Client
) {
  if (type === "TeamMemberJoined") {
    // memberJoin
    const member = await client.members.fetch(
      data.member.user.id,
      data.serverId
    );

    client.emit("guildMemberAdd", member); // discordjs v13 event
    client.emit("memberJoin", member); // mr.gil event
  } else if (type === "TeamMemberRemoved") {
    // memberRemove

    const member = await client.members.fetch(data.userId, data.serverId);
    const user = member.user;

    if (data.isKick) {
      client.emit("guildMemberKick", user); // discordjs v13 event
      client.emit("memberKick", user); // mr.gil event
    } else if (!data.isBan) {
      client.emit("guildMemberRemove", user); // discordjs v13 event
      client.emit("memberRemove", user); // mr.gil event
    }
  } else if (type === "TeamMemberBanned") {
    // memberBan
    try {
      const member = await client.members.fetch(
        data.serverMemberBan?.user?.id,
        data.serverId
      );

      const banObj = new MemberBan(data.serverMemberBan, { user: member.user });

      client.emit("guildBanAdd", banObj); // discordjs v13 event
      client.emit("memberBan", banObj); // mr.gil event
    } catch (err) {
      // Uncached User ;(
      client.emit("guildBanAdd", data.serverMemberBan); // discordjs v13 event
      client.emit("memberBan", data.serverMemberBan); // mr.gil event
    }
  } else if (type === "TeamMemberUnbanned") {
    // memberUnban
    try {
      const member = await client.members.fetch(
        data.serverMemberBan?.user?.id,
        data.serverId
      );

      const banObj = new MemberBan(data.serverMemberBan, { user: member.user });

      client.emit("guildBanRemove", banObj); // discordjs v13 event
      client.emit("memberUnban", banObj); // mr.gil event
    } catch (err) {
      // Uncached User ;(
      client.emit("guildBanRemove", data.serverMemberBan); // discordjs v13 event
      client.emit("memberUnban", data.serverMemberBan); // mr.gil event
    }
  } else if (type === "TeamMemberUpdated") {
    // memberUpdate
    const { member }: { member: APIServerMember } = await client.rest.get(
      Routes.serverMember(data.serverId, data.userInfo.id)
    );

    let oldMember = client.members.get(data.userInfo.id);
    if (!oldMember)
      oldMember = await client.members.fetch(data.userInfo.id, data.serverId);

    const newMember = new Member(member, {
      server: await client.servers.fetch(data.serverId),
      user: await client.users.fetch({}, member.user),
    });

    client.members.set(data.userInfo.id, newMember);

    client.emit("guildMemberUpdate", oldMember, newMember); // discordjs v13 event
    client.emit("memberUpdate", oldMember, newMember); // mr.gil event
  }
}
