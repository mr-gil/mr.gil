import { APIDoc } from 'guilded-api-typings';
import { Client } from '../Client';
import { Doc } from '../components/Doc';

export async function DocEvents(
  type: string,
  data: { serverId: string; doc: APIDoc },
  client: Client
) {
  const channel = await client.channels.fetch(data.doc.channelId);

  if (type == 'DocCreated') {
    const doc = new Doc(data.doc, {
      channel: channel,
      member: await channel.server.members.fetch(
        data.doc.createdBy,
        data.serverId
      )
    });

    client.emit('docCreate', doc);
    client.emit('DocCreated', doc);
  } else if (type == 'DocUpdated') {
    const oldDoc = channel.docs.cache.get(data.doc.id) || {};
    const doc = new Doc(data.doc, {
      channel: channel,
      member: await channel.server.members.fetch(
        data.doc.createdBy,
        channel.serverId
      )
    });

    client.emit('docUpdate', oldDoc, doc);
    client.emit('DocUpdated', oldDoc, doc);
  } else if (type == 'DocDeleted') {
    const oldDoc = channel.docs.cache.get(data.doc.id);

    if (!oldDoc) {
      const doc = new Doc(data.doc, {
        channel: channel,
        member: await channel.server.members.fetch(
          data.doc.createdBy,
          channel.serverId
        )
      });

      doc.deleted = true;

      client.emit('docDelete', doc);
      client.emit('DocDeleted', doc);
      return;
    }

    oldDoc.deleted = true;
    client.emit('docDelete', oldDoc);
    client.emit('DocDeleted', oldDoc);
  }
}
