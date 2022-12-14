import {
  APICalendarEvent,
  APICalendarEventCancellation,
  APICalendarEventRsvp,
  CalendarEventRsvpStatus,
  Routes
} from 'guilded-api-typings';
import { CalendarBuilder } from '../builder';
import { GuildedApiError } from '../errors/apiError';
import { RsvpManager } from '../manager/RsvpManager';
import { ColorResolvable, resolveColor } from '../misc/util';
import { CalendarChannel } from './Channel';
import { Mentions } from './Message';
import { Member } from './User';

export class Calendar {
  cancellation?: Cancellation;
  channelId: string;
  color?: ColorResolvable;
  createdAt: Date;
  description?: string;
  duration?: number;
  id: number;
  location?: string;
  mentions?: Mentions;
  name: string;
  private _obj: {
    channel: CalendarChannel;
    member?: Member;
  };
  private?: boolean;
  rsvpLimit?: number;
  rsvps: RsvpManager;
  serverId: string;
  startsAt: Date;
  url?: string;

  constructor(
    cal: APICalendarEvent,
    obj: {
      channel: CalendarChannel;
      member?: Member;
    },
    cache = obj.channel.client.cacheCalendar ?? true
  ) {
    Object.defineProperty(this, '_obj', {
      enumerable: false,
      writable: true,
      value: obj
    });

    if (cal.cancellation)
      this.cancellation = new Cancellation(cal.cancellation);
    this.channelId = cal.channelId;
    this.color = cal.color ? resolveColor(cal.color) : undefined;
    this.createdAt = new Date(cal.createdAt);
    this.description = cal.description;
    this.duration = cal.duration;
    this.id = cal.id;
    this.location = cal.location;
    this.mentions = new Mentions(cal.mentions);
    this.name = cal.name;
    this.private = cal.isPrivate;
    this.rsvpLimit = cal.rsvpLimit;
    this.rsvps = new RsvpManager(this._obj.channel, this);
    this.serverId = cal.serverId;
    this.startsAt = new Date(cal.startsAt);
    this.url = cal.url;

    if (cache) this.channel.calendars.cache.set(this.id, this);
  }

  get channel() {
    return this._obj.channel;
  }

  get author() {
    return this._obj.member;
  }

  rsvp(
    status:
      | 'going'
      | 'maybe'
      | 'declined'
      | 'invited'
      | 'waitlisted'
      | 'responded',
    userId?: string
  ) {
    const link = Routes.calendarEventRsvp(
      this.channelId,
      this.id,
      userId || this.channel.client.user.id
    );

    return new Promise(async (resolve) => {
      try {
        const {
          calendarEventRsvp
        }: { calendarEventRsvp: APICalendarEventRsvp } =
          await this.channel.client.rest.post(link, {
            body: JSON.stringify({ status: status || 'maybe' })
          });

        resolve(
          new CalendarRsvp(calendarEventRsvp, {
            channel: this.channel,
            cal: this,
            member: await this.channel.server.members.fetch(
              calendarEventRsvp.createdBy,
              calendarEventRsvp.serverId
            )
          })
        );
      } catch (err: any) {
        throw new GuildedApiError(err);
      }
    });
  }

  delete() {
    const link = Routes.calendarEvent(this.channel.id, this.id);

    return new Promise(async (resolve) => {
      try {
        await this.channel.client.rest.delete(link);

        resolve(true);
      } catch (err) {
        resolve(false);
        throw new GuildedApiError(err);
      }
    });
  }

  edit(cal: CalendarBuilder) {
    const link = Routes.calendarEvent(this.channel.id, this.id);

    return new Promise(async (resolve) => {
      try {
        if (!cal)
          throw new GuildedApiError(
            'You have not provided a CalendarBuilder as the argument.'
          );

        const { calendarEvent }: { calendarEvent: APICalendarEvent } =
          await this.channel.client.rest.patch(link, {
            body: JSON.stringify(cal)
          });

        resolve(
          new Calendar(calendarEvent, {
            channel: this.channel,
            member: await this.channel.server.members.fetch(
              calendarEvent.createdBy,
              calendarEvent.serverId
            )
          })
        );
      } catch (err: any) {
        throw new GuildedApiError(err);
      }
    });
  }
}

export class CalendarRsvp {
  calendarEventId: number;
  channelId: string;
  createdAt: Date;
  createdBy: string;
  private _obj: { channel: CalendarChannel; cal: Calendar; member: Member };
  serverId: string;
  status: CalendarEventRsvpStatus;
  updatedAt?: Date;
  updatedBy?: string;

  constructor(
    rsvp: APICalendarEventRsvp,
    obj: { channel: CalendarChannel; cal: Calendar; member: Member }
  ) {
    Object.defineProperty(this, '_obj', {
      enumerable: false,
      writable: true,
      value: obj
    });

    this.calendarEventId = rsvp.calendarEventId;
    this.channelId = rsvp.channelId;
    this.createdAt = new Date(rsvp.createdAt);
    this.createdBy = rsvp.createdBy;
    this.serverId = rsvp.serverId;
    this.status = rsvp.status;
    this.updatedAt = new Date(rsvp.updatedAt);
    this.updatedBy = rsvp.updatedBy;
  }

  get calendar() {
    return this._obj.cal;
  }

  delete() {
    const link = Routes.calendarEventRsvp(
      this.channelId,
      this.calendarEventId,
      this.createdBy
    );

    return new Promise(async (resolve) => {
      try {
        await this.calendar.channel.client.rest.delete(link);

        resolve(true);
      } catch (err) {
        resolve(false);
        throw new GuildedApiError(err);
      }
    });
  }

  edit(
    status:
      | 'going'
      | 'maybe'
      | 'declined'
      | 'invited'
      | 'waitlisted'
      | 'responded',
    userId?: string
  ) {
    const link = Routes.calendarEventRsvp(
      this.channelId,
      this.calendar.id,
      userId || this.calendar.channel.client.user.id
    );

    return new Promise(async (resolve) => {
      try {
        const {
          calendarEventRsvp
        }: { calendarEventRsvp: APICalendarEventRsvp } =
          await this.calendar.channel.client.rest.post(link, {
            body: JSON.stringify({ status: status || 'maybe' })
          });

        resolve(
          new CalendarRsvp(calendarEventRsvp, {
            channel: this.calendar.channel,
            cal: this.calendar,
            member: await this.calendar.channel.server.members.fetch(
              calendarEventRsvp.createdBy,
              calendarEventRsvp.serverId
            )
          })
        );
      } catch (err: any) {
        resolve(false);
        throw new GuildedApiError(err);
      }
    });
  }
}

class Cancellation {
  description?: string;
  createdBy?: string;

  constructor(data: APICalendarEventCancellation) {
    this.createdBy = data.createdBy;
    this.description = data.description;
  }
}
