import { BaseCollector, collectorOptions } from './BaseCollector';

import { ChatChannel, Message, MessageReaction } from '../components';

export class MessageCollector extends BaseCollector<Message> {
  constructor(
    public channel: ChatChannel,
    options?: collectorOptions<Message>
  ) {
    super(channel.client, options);
    this.client.on('messageCreate', (msg: Message) => this.messageCollect(msg));
    this.client.on('messageUpdate', (msg: Message) => this.messageCollect(msg));
    this.client.on('messageDelete', (msg: Message) => this.dispose(msg.id));
  }

  protected messageCollect(message: Message) {
    if (message.channel.id !== this.channel.id) return;
    this.collect(message);
  }
}

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
