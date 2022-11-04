import {
  APIDoc,
  APIDocFetchManyOptions,
  APIForumTopic,
  APIForumTopicFetchManyOptions,
  Routes
} from 'guilded-api-typings';
import { Collection } from '../components';
import { ForumChannel } from '../components/Channel';
import { Doc } from '../components/Doc';
import { ForumTopic } from '../components/ForumTopic';
import { BaseManager, FetchOptions } from './BaseManager';

export class ForumTopicManager extends BaseManager {
  readonly cache: Collection<number, ForumTopic>;
  channel: ForumChannel;

  constructor(fc: ForumChannel, maxCache = Infinity) {
    super(fc.client);
    this.channel = fc;
    this.cache = new Collection([], {
      maxSize: super.client.cacheSize || maxCache
    });
  }

  setMaxCache(num: number) {
    this.cache.setMaxSize(num);
    return this;
  }

  async fetch(id: number, options?: FetchOptions): Promise<ForumTopic>;
  async fetch(
    options?: APIForumTopicFetchManyOptions
  ): Promise<Collection<number, ForumTopic>>;

  async fetch(
    idOrOptions: number | APIDocFetchManyOptions,
    options?: FetchOptions
  ): Promise<Collection<number, ForumTopic> | ForumTopic> {
    return new Promise(async (resolve, reject) => {
      if (typeof idOrOptions === 'number') {
        const cached = this.cache.get(idOrOptions);
        if (cached && !options?.force) return resolve(cached);

        const { forumTopic }: { forumTopic: APIForumTopic } =
          await this.client.rest.get(
            Routes.forumTopic(this.channel.id, idOrOptions)
          );

        const forum = new ForumTopic(forumTopic, {
          channel: this.channel,
          member: await this.channel.server.members.fetch(
            forumTopic.createdBy,
            forumTopic.serverId
          )
        });
        this.cache.set(forum.id, forum);
        resolve(forum);
      } else {
        const { forumTopic }: { forumTopic: APIForumTopic[] } =
          await this.client.rest.get(Routes.forumTopics(this.channel.id));

        const col: Collection<number, ForumTopic> = new Collection([], {
          client: this.client
        });

        forumTopic.forEach(async (f: APIForumTopic) => {
          const cac = this.cache.get(f.id);
          if (cac) {
            col.set(cac.id, cac);
          } else {
            const fr = new ForumTopic(f, {
              channel: this.channel,
              member: await this.channel.server.members.fetch(
                f.createdBy,
                f.serverId
              )
            });

            col.set(fr.id, fr);
          }
        });
        resolve(col);
      }
    });
  }
}
