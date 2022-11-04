import {
  APIMessageFetchManyOptions,
  APIWebhook,
  Routes
} from 'guilded-api-typings';
import { BaseChannel, Collection, Message } from '../components';
import { Webhook } from '../components/Webhook';
import { GuildedApiError } from '../errors/apiError';
import { BaseManager, FetchManyOptions, FetchOptions } from './BaseManager';

export class WebhookManager extends BaseManager {
  readonly cache: Collection<string, Webhook>;
  channel: BaseChannel;

  constructor(channel: BaseChannel, maxCache = Infinity) {
    super(channel.client);
    this.channel = channel;
    this.cache = new Collection([], {
      client: this.client,
      maxSize: super.client.cacheSize || maxCache
    });
  }

  setMaxCache(num: number) {
    this.cache.setMaxSize(num);
    return this;
  }

  async fetch(id: string, options?: FetchOptions): Promise<Webhook>;
  async fetch(
    options?: FetchManyOptions | APIMessageFetchManyOptions
  ): Promise<Collection<string, Webhook>>;

  async fetch(
    webhookId?: string | FetchManyOptions | APIMessageFetchManyOptions,
    options?: FetchOptions
  ): Promise<Collection<string, Webhook> | Webhook> {
    return new Promise(async (resolve) => {
      if (typeof webhookId === 'string') {
        const cached = this.cache.get(webhookId);
        if (cached && !options?.force) return resolve(cached);

        const { webhook } = await this.client.rest.get(
          Routes.webhook(this.channel.server.id, webhookId)
        );

        const wb = new Webhook(this.channel, webhook);
        this.cache.set(wb.id, wb);
        resolve(wb);
      } else {
        const { webhooks } = await this.client.rest.get(
          Routes.webhooks(this.channel.server.id)
        );

        const w: Collection<string, Webhook> = new Collection<string, Webhook>(
          [],
          { client: this.client }
        );

        webhooks.forEach(async (m: APIWebhook) => {
          const cac = this.cache.get(m.id);
          if (cac) {
            w.set(cac.id, cac);
          } else {
            const webhk = new Webhook(this.channel, m);
            w.set(webhk.id, webhk);
          }
        });
        resolve(w);
      }
    });
  }

  create(name: string): Promise<Webhook> {
    const link = Routes.webhooks(this.channel.server.id);

    return new Promise(async (resolve) => {
      try {
        const { webhook } = await this.client.rest.post(link, {
          body: JSON.stringify({ name: name, channelId: this.channel.id })
        });

        const webhk = new Webhook(this.channel, webhook);
        this.cache.set(webhk.id, webhk);
        resolve(webhk);
      } catch (err) {
        throw new GuildedApiError(err);
      }
    });
  }

  edit(webhookId: string, name: string, channelId?: string): Promise<Webhook> {
    const link = Routes.webhook(this.channel.server.id, webhookId);

    return new Promise(async (resolve) => {
      try {
        const { webhook } = await this.client.rest.put(link, {
          body: JSON.stringify({
            name: name,
            channelId: channelId || this.channel.id
          })
        });

        const webhk = new Webhook(this.channel, webhook);
        this.cache.set(webhk.id, webhk);
        resolve(webhk);
      } catch (err) {
        throw new GuildedApiError(err);
      }
    });
  }

  delete(webhookId: string): Promise<boolean> {
    const link = Routes.webhook(this.channel.serverId, webhookId);

    return new Promise(async (resolve) => {
      try {
        await this.client.rest.delete(link);
        resolve(true);
      } catch (err) {
        resolve(false);
        throw new GuildedApiError(err);
      }
    });
  }
}
