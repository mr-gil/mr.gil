import { Client } from "../Client";
import { Doc } from "../components/Doc";

export async function DocEvents(type: string, data: any, client: Client) {
  const server = await client.servers.fetch(data.serverId);
  const channel = await client.channels.fetch(data.doc.channelId);

  if (type == "DocCreated") {
    const doc = new Doc(
      data.doc,
      {
        server: server,
        channel: channel,
        member: await server.members.fetch(data.doc.createdBy, server.id),
      },
      client
    );

    client.emit("docCreate", doc);
    client.emit("DocCreated", doc);
  } else if (type == "DocUpdated") {
    const oldDoc = channel.docs.cache.get(data.doc.id) || {};
    const doc = new Doc(
      data.doc,
      {
        server: server,
        channel: channel,
        member: await server.members.fetch(data.doc.createdBy, server.id),
      },
      client
    );

    client.emit("docUpdate", oldDoc, doc);
    client.emit("DocUpdated", oldDoc, doc);
  } else if (type == "DocDeleted") {
    const oldDoc = channel.docs.cache.get(data.doc.id);

    if (!oldDoc) {
      const doc = new Doc(
        data.doc,
        {
          server: server,
          channel: channel,
          member: await server.members.fetch(data.doc.createdBy, server.id),
        },
        client
      );

      doc.deleted = true;

      client.emit("docDelete", doc);
      client.emit("DocDeleted", doc);
      return;
    } 

    oldDoc.deleted = true;
    client.emit("docDelete", oldDoc);
    client.emit("DocDeleted", oldDoc);
  }
}
