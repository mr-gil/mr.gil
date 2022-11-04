import { APIWebhook } from 'guilded-api-typings/typings';
import { Client } from '../Client';
import { Webhook } from '../components';

export async function TeamWebhookEvents(
  type: string,
  data: { serverId: string; webhook: APIWebhook },
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
