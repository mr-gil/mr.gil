import { Routes, APICalendarEventRsvp } from 'guilded-api-typings';
import { BaseManager, FetchManyOptions, FetchOptions } from './BaseManager';

import {
  Collection,
  CalendarChannel,
  Calendar,
  CalendarRsvp
} from '../components';

export class RsvpManager extends BaseManager {
  readonly cache: Collection<string, CalendarRsvp>;
  channel: CalendarChannel;
  calendar: Calendar;

  constructor(ch: CalendarChannel, cal: Calendar, maxCache = Infinity) {
    super(ch.client);
    this.channel = ch;
    this.calendar = cal;
    this.cache = new Collection([], {
      maxSize: super.client.cacheSize || maxCache
    });
  }

  setMaxCache(num: number) {
    this.cache.setMaxSize(num);
    return this;
  }

  async fetch(
    cal: number,
    user: string,
    options?: FetchOptions
  ): Promise<CalendarRsvp>;
  async fetch(
    cal: number,
    options?: FetchManyOptions
  ): Promise<Collection<string, CalendarRsvp>>;

  async fetch(
    calOrOptions: number,
    user?: string | FetchManyOptions,
    options?: FetchOptions
  ): Promise<Collection<string, CalendarRsvp> | CalendarRsvp> {
    return new Promise(async (resolve, reject) => {
      if (typeof user === 'string') {
        const cached = this.cache.get(user);
        if (cached && !options?.force) return resolve(cached);

        const {
          calendarEventRsvp
        }: { calendarEventRsvp: APICalendarEventRsvp } =
          await this.client.rest.get(
            Routes.calendarEventRsvp(this.channel.id, calOrOptions, user)
          );

        const calComp = new CalendarRsvp(calendarEventRsvp, {
          channel: this.channel,
          cal: this.channel.calendars.cache.get(
            calendarEventRsvp.calendarEventId
          ),
          member: await this.channel.server.members.fetch(
            calendarEventRsvp.createdBy,
            calendarEventRsvp.serverId
          )
        });
        this.cache.set(user, calComp);
        resolve(calComp);
      } else {
        const {
          calendarEventRsvps
        }: { calendarEventRsvps: APICalendarEventRsvp[] } =
          await this.client.rest.get(
            Routes.calendarEventRsvps(this.channel.id, calOrOptions)
          );

        const col: Collection<string, CalendarRsvp> = new Collection([], {
          client: this.client
        });

        calendarEventRsvps.forEach(async (d: APICalendarEventRsvp) => {
          const cac = this.cache.get(d.createdBy);
          if (cac) {
            col.set(cac.createdBy, cac);
          } else {
            const c = new CalendarRsvp(d, {
              channel: this.channel,
              cal: this.channel.calendars.cache.get(d.calendarEventId),
              member: await this.channel.server.members.fetch(
                d.createdBy,
                d.serverId
              )
            });

            col.set(c.createdBy, c);
          }
        });
        resolve(col);
      }
    });
  }
}
