import {
  APICalendarEventFetchManyOptions,
  Routes,
  APICalendarEvent
} from 'guilded-api-typings';
import { BaseManager, FetchOptions } from './BaseManager';

import { Collection, CalendarChannel, Calendar } from '../components';

export class CalendarManager extends BaseManager {
  readonly cache: Collection<number, Calendar>;
  channel: CalendarChannel;

  constructor(cal: CalendarChannel, maxCache = Infinity) {
    super(cal.client);
    this.channel = cal;
    this.cache = new Collection([], {
      maxSize: super.client.cacheSize || maxCache
    });
  }

  setMaxCache(num: number) {
    this.cache.setMaxSize(num);
    return this;
  }

  async fetch(cal: number, options?: FetchOptions): Promise<Calendar>;
  async fetch(
    options?: APICalendarEventFetchManyOptions
  ): Promise<Collection<number, Calendar>>;

  async fetch(
    calOrOptions: number | APICalendarEventFetchManyOptions,
    options?: FetchOptions
  ): Promise<Collection<number, Calendar> | Calendar> {
    return new Promise(async (resolve, reject) => {
      if (typeof calOrOptions === 'number') {
        const cached = this.cache.get(calOrOptions);
        if (cached && !options?.force) return resolve(cached);

        const { calendarEvent }: { calendarEvent: APICalendarEvent } =
          await this.client.rest.get(
            Routes.calendarEvent(this.channel.id, calOrOptions)
          );

        const calComp = new Calendar(calendarEvent, {
          channel: this.channel,
          member: await this.channel.server.members.fetch(
            calendarEvent.createdBy,
            calendarEvent.serverId
          )
        });
        this.cache.set(calOrOptions, calComp);
        resolve(calComp);
      } else {
        const { calendarEvents }: { calendarEvents: APICalendarEvent[] } =
          await this.client.rest.get(Routes.calendarEvents(this.channel.id));

        const col: Collection<number, Calendar> = new Collection([], {
          client: this.client
        });

        calendarEvents.forEach(async (d: APICalendarEvent) => {
          const cac = this.cache.get(d.id);
          if (cac) {
            col.set(cac.id, cac);
          } else {
            const c = new Calendar(d, {
              channel: this.channel,
              member: await this.channel.server.members.fetch(
                d.createdBy,
                d.serverId
              )
            });

            col.set(c.id, c);
          }
        });
        resolve(col);
      }
    });
  }
}
