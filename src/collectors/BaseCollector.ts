import { EventEmitter } from 'stream';
import { Client } from '../Client';
import { Collection } from '../components';
import type TypedEmitter from 'typed-emitter';

export class BaseCollector<
  type extends collectorItem
> extends (EventEmitter as unknown as new () => TypedEmitter<
  collectorEvents<any>
>) {
  collected: Collection<type['id'], type>;
  createdAt: Date;
  ended: boolean;
  endedAt: Date;
  idleTimeout: any;

  constructor(public client: Client, public options?: collectorOptions<type>) {
    super();
    this.ended = false;
    this.createdAt = new Date();
    this.collected = new Collection([], { client: client });
    if (options.time) setTimeout(() => this.end(), options.time);
    if (options.idle)
      this.idleTimeout = setTimeout(() => this.end(), options.idle);
  }

  get createdTimestamp() {
    return this.createdAt.getTime();
  }

  get endedTimestamp() {
    if (this.ended) return this.endedAt?.getTime();
    else return null;
  }

  end() {
    if (this.ended) return;
    this.endedAt = new Date();
    this.emit('end', this.collected);
  }

  async collect(item: type) {
    const filter = this.options.filter ? await this.options.filter(item) : true;
    if (this.ended || !filter) return;

    this.collected.set(item.id, item);
    this.emit('collect', item);
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);

      this.idleTimeout = setTimeout(() => this.end(), this.options.idle);
    }
    if (this.collected.size >= (this.options.max ?? Infinity)) this.end();
    return item;
  }

  dispose(id: type['id']) {
    const item = this.collected.get(id);

    if (this.options.dispose === false || this.ended || !item) return;

    this.collected.delete(id);
    this.emit('dispose', item);
    return item;
  }
}

export type collectorEvents<type> = {
  collect: (item: type) => void;
  dispose: (item: type) => void;
  end: (collected: Collection<string | number, type>) => void;
};

export interface collectorOptions<type> {
  dispose?: boolean;
  filter?: Filter<type>;
  idle?: number;
  max?: number;
  time?: number;
}

export type Filter<type> = (item: type) => boolean | Promise<boolean>;

export type collectorItem = {
  id: string | number;
};
