import { Message, MessageReaction } from '../components';
import { BaseCollector, collectorOptions } from './BaseCollector';

export class MessageReactionCollector extends BaseCollector<MessageReaction> {
  constructor(
    public message: Message,
    options?: collectorOptions<MessageReaction>
  ) {
    super(message.client, options);
    this.client.on('messageReactionAdd', (r: MessageReaction) =>
      this.reactionCollect(r)
    );
    this.client.on('messageReactionRemove', (r: MessageReaction) =>
      this.dispose(r.id)
    );
  }

  protected reactionCollect(reaction: MessageReaction) {
    if (reaction.message.id !== this.message.id) return;
    this.collect(reaction);
  }
}
