import { Client } from '../Client';
import { Emote } from '../components';
import { ForumTopicReaction } from '../components/ForumTopic';

export async function TopicReactionEvents(
  type: string,
  data: {
    serverId: string;
    reaction: topicReaction;
  },
  client: Client
) {
  const channel = await client.channels.fetch(data.reaction.channelId);
  const topic = await channel.forums.fetch(data.reaction.forumTopicId);
  const member = await channel.server.members.fetch(
    data.reaction.createdBy,
    data.serverId
  );

  if (type == 'ForumTopicReactionCreated') {
    const reaction = new ForumTopicReaction(data.reaction, {
      //@ts-ignore
      topic: topic.first,
      member: member
    });

    client.emit('topicReact', reaction);
    client.emit('ForumTopicReactionCreated', reaction);
  } else if (type == 'ForumTopicReactionDeleted') {
    const reaction = new ForumTopicReaction(data.reaction, {
      //@ts-ignore
      topic: topic.first,
      member: member
    });

    client.emit('topicUnreact', reaction);
    client.emit('ForumTopicReactionDeleted', reaction);
  }
}

export type topicReaction = {
  channelId: string;
  createdBy: string;
  forumTopicId: number;
  emote: Emote;
};
