import { APIListItem, Routes } from 'guilded-api-typings';
import { BaseManager, FetchManyOptions, FetchOptions } from './BaseManager';
import { Collection } from '../components';
import { ListChannel } from '../components/Channel';
import { ListItem } from '../components/ListItem';

export class ListItemManager extends BaseManager {
  readonly cache: Collection<string, ListItem>;
  channel: ListChannel;

  constructor(doc: ListChannel, maxCache = Infinity) {
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

  async fetch(item: string, options?: FetchOptions): Promise<ListItem>;

  async fetch(
    idOrOptions: string | FetchManyOptions,
    options?: FetchOptions
  ): Promise<Collection<string, ListItem> | ListItem> {
    return new Promise(async (resolve, reject) => {
      if (typeof idOrOptions == 'string') {
        const cached = this.cache.get(idOrOptions);
        if (cached && !options?.force) return resolve(cached);

        const { listItem }: { listItem: APIListItem } =
          await this.client.rest.get(
            Routes.listItem(this.channel.id, idOrOptions)
          );

        const list = new ListItem(listItem, {
          channel: this.channel,
          member: await this.channel.server.members.fetch(
            listItem.createdBy,
            listItem.serverId
          )
        });
        this.cache.set(listItem.id, list);
        resolve(list);
      } else {
        const col = new Collection<string, ListItem>([], {
          client: this.client
        });

        const { listItems }: { listItems: APIListItem[] } =
          await this.client.rest.get(Routes.listItems(this.channel.id));

        listItems.forEach(async (listItem) => {
          const cached = this.cache.get(listItem.id);
          if (cached && !options?.force) {
            col.set(cached.id, cached);
          } else {
            const list = new ListItem(listItem, {
              channel: this.channel,
              member: await this.channel.server.members.fetch(
                listItem.createdBy,
                listItem.serverId
              )
            });
            this.cache.set(listItem.id, list);
            col.set(listItem.id, list);
          }
        });

        resolve(col);
      }
    });
  }
}
