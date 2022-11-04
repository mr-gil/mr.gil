import { ChatChannel, Message } from '../components';
import { BaseCollector, collectorOptions } from './BaseCollector';

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
