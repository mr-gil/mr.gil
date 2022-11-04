import { APIDoc, APIDocFetchManyOptions, Routes } from 'guilded-api-typings';
import { BaseManager, FetchOptions } from './BaseManager';
import { Collection } from '../components';
import { DocChannel } from '../components/Channel';
import { Doc } from '../components/Doc';

export class DocManager extends BaseManager {
  readonly cache: Collection<number, Doc>;
  channel: DocChannel;

  constructor(doc: DocChannel, maxCache = Infinity) {
    super(doc.client);
    this.channel = doc;
    this.cache = new Collection([], {
      maxSize: super.client.cacheSize || maxCache
    });
  }

  setMaxCache(num: number) {
    this.cache.setMaxSize(num);
    return this;
  }

  async fetch(doc: number, options?: FetchOptions): Promise<Doc>;
  async fetch(
    options?: APIDocFetchManyOptions
  ): Promise<Collection<number, Doc>>;

  async fetch(
    docOrOptions: number | APIDocFetchManyOptions,
    options?: FetchOptions
  ): Promise<Collection<number, Doc> | Doc> {
    return new Promise(async (resolve, reject) => {
      if (typeof docOrOptions === 'number') {
        const cached = this.cache.get(docOrOptions);
        if (cached && !options?.force) return resolve(cached);

        const { doc }: { doc: APIDoc } = await this.client.rest.get(
          Routes.doc(this.channel.id, docOrOptions)
        );

        const server = await this.client.servers.fetch(doc.serverId);
        const docComp = new Doc(
          doc,
          {
            server: server,
            channel: (await this.client.channels.fetch(
              doc.channelId
            )) as DocChannel,
            member: await server.members.fetch(doc.createdBy, doc.serverId)
          },
          this.client
        );
        this.cache.set(docOrOptions, docComp);
        resolve(docComp);
      } else {
        const { docs }: { docs: APIDoc[] } = await this.client.rest.get(
          Routes.docs(this.channel.id),
          docOrOptions
        );

        const col: Collection<number, Doc> = new Collection([], {
          client: this.client
        });

        docs.forEach(async (d: APIDoc) => {
          const cac = this.cache.get(d.id);
          if (cac) {
            col.set(cac.id, cac);
          } else {
            const server = await this.client.servers.fetch(d.serverId);
            const dc = new Doc(
              d,
              {
                server: server,
                channel: await this.client.channels.fetch(d.channelId),
                member: await server.members.fetch(d.createdBy, d.serverId)
              },
              this.client
            );

            col.set(dc.id, dc);
          }
        });
        resolve(col);
      }
    });
  }
}
