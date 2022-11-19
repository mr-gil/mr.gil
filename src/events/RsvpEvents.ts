import { APICalendarEvent, APICalendarEventRsvp } from 'guilded-api-typings';
import { Client } from '../Client';
import { Calendar, CalendarRsvp } from '../components';

export async function RsvpEvents(
  type: string,
  data: { serverId: string; calendarEventRsvp: APICalendarEventRsvp | any },
  client: Client
) {
  if (type === 'CalendarEventRsvpUpdated') {
    const channel = await client.channels.fetch(
      data.calendarEventRsvp.channelId
    );
    const cal = new CalendarRsvp(data.calendarEventRsvp, {
      channel: channel,
      cal: channel.calendars.cache.get(data.calendarEventRsvp.calendarEventId),
      member: await channel.server.members.fetch(
        data.calendarEventRsvp.createdBy,
        data.serverId
      )
    });

    client.emit('rsvpUpdate', cal);
    client.emit('CalendarEventRsvpUpdated', cal);
  } else if (type === 'CalendarEventRsvpManyUpdated') {
    const channel = await client.channels.fetch(
      data.calendarEventRsvp[0].channelId
    );

    const arr: CalendarRsvp[] = [];

    data.calendarEventRsvp.forEach(async (rsvp: APICalendarEventRsvp) => {
      const cal = new CalendarRsvp(rsvp, {
        channel: channel,
        cal: channel.calendars.cache.get(rsvp.calendarEventId),
        member: await channel.server.members.fetch(
          rsvp.createdBy,
          data.serverId
        )
      });

      arr.push(cal);
    });

    client.emit('rsvpBulkUpdate', arr);
    client.emit('CalendarEventRsvpManyUpdated', arr);
  } else if (type === 'CalendarEventRsvpDeleted') {
    const channel = await client.channels.fetch(
      data.calendarEventRsvp.channelId
    );
    const cal = new CalendarRsvp(data.calendarEventRsvp, {
      channel: channel,
      cal: channel.calendars.cache.get(data.calendarEventRsvp.calendarEventId),
      member: await channel.server.members.fetch(
        data.calendarEventRsvp.createdBy,
        data.serverId
      )
    });

    client.emit('rsvpDelete', cal);
    client.emit('CalendarEventRsvpDeleted', cal);
  }
}
