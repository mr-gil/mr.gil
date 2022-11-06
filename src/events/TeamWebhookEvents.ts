import { APIWebhook } from 'guilded-api-typings';
import { Client } from '../Client';
import { Webhook } from '../components';

export async function TeamWebhookEvents(
  type: string,
  data: { serverId: string; webhook: APIWebhook },
  client: Client
) {
  const channel = await client.channels.fetch(data.webhook.channelId);

  if (type === 'TeamWebhookCreated') {
    const webhook = new Webhook(channel, data.webhook);

    client.emit('webhookCreate', webhook);
    client.emit('TeamWebhookCreated', webhook);
  } else if (type === 'TeamWebhookUpdated') {
    const oldWebhook = await channel.webhooks.fetch(data.webhook.id);

    const webhook = new Webhook(channel, data.webhook);
    client.emit('webhookUpdate', oldWebhook, webhook);
    client.emit('TeamWebhookUpdated', oldWebhook, webhook);
  }
}
