import { APIForumTopic } from 'guilded-api-typings';
import { Client } from '../Client';
import { ForumTopic } from '../components/ForumTopic';

export async function ForumTopicEvents(
  type: string,
  data: { serverId: string; forumTopic: APIForumTopic },
  client: Client
) {
  if (type.includes('ForumTopicReaction')) return;

  const channel = await client.channels.fetch(data.forumTopic?.channelId);
  const fr = new ForumTopic(data.forumTopic, {
    channel,
    member: data.forumTopic.createdByWebhookId
      ? await channel.webhooks.fetch(data.forumTopic.createdByWebhookId)
      : await channel.server.members.fetch(
          data.forumTopic.createdBy,
          data.serverId
        )
  });

  if (type == 'ForumTopicCreated') {
    client.emit('topicCreate', fr);
    client.emit('ForumTopicCreated', fr);
  } else if (type == 'ForumTopicUpdated') {
    const oldFr = await channel.forums.cache.get(data.forumTopic.id);

    client.emit('topicUpdate', fr, oldFr);
    client.emit('ForumTopicUpdated', fr, oldFr);
  } else if (type == 'ForumTopicDeleted') {
    client.emit('topicDelete', fr);
    client.emit('ForumTopicDeleted', fr);
  } else if (type == 'ForumTopicPinned') {
    client.emit('topicPin', fr);
    client.emit('ForumTopicPinned', fr);
  } else if (type == 'ForumTopicUnpinned') {
    client.emit('topicUnpin', fr);
    client.emit('ForumTopicUnpinned', fr);
  } else if (type == 'ForumTopicLocked') {
    client.emit('topicLock', fr);
    client.emit('ForumTopicLocked', fr);
  } else if (type == 'ForumTopicUnlocked') {
    client.emit('topicUnlock', fr);
    client.emit('ForumTopicUnlocked', fr);
  }
}
