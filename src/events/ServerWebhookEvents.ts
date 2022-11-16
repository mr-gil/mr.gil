import { APIWebhook } from 'guilded-api-typings';
import { Client } from '../Client';
import { Webhook } from '../components';

export async function ServerWebhookEvents(
  type: string,
  data: { serverId: string; webhook: APIWebhook },
  client: Client
) {
  const channel = await client.channels.fetch(data.webhook.channelId);

  if (type === 'ServerWebhookCreated') {
    const webhook = new Webhook(channel, data.webhook);

    client.emit('webhookCreate', webhook);
    client.emit('ServerWebhookCreated', webhook);
  } else if (type === 'ServerWebhookUpdated') {
    const oldWebhook = await channel.webhooks.fetch(data.webhook.id);

    const webhook = new Webhook(channel, data.webhook);
    client.emit('webhookUpdate', oldWebhook, webhook);
    client.emit('ServerWebhookUpdated', oldWebhook, webhook);
  }
}
