import { Client } from '../Client';
import { Webhook } from '../components';

export async function TeamWebhookEvents(
  type: string,
  data: any,
  client: Client
) {
  const channel = await client.channels.fetch(data.webhook.channelId);

  const webhook = new Webhook(channel, data.webhook);

  if (type === 'TeamWebhookCreated') {
    client.emit('webhookCreate', webhook);
    client.emit('TeamWebhookCreated', webhook);
  } else if (type === 'TeamWebhookUpdated') {
    client.emit('webhookUpdate', webhook);
    client.emit('TeamWebhookUpdated', webhook);
  }
}
