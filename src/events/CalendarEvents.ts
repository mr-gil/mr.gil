import { APICalendarEvent } from 'guilded-api-typings';
import { Client } from '../Client';
import { Calendar } from '../components';

export async function CalendarEvents(
  type: string,
  data: { serverId: string; calendarEvent: APICalendarEvent },
  client: Client
) {
  const channel = await client.channels.fetch(data.calendarEvent.channelId);

  if (type === 'CalendarEventCreated') {
    const cal = new Calendar(data.calendarEvent, {
      channel: channel,
      member: await channel.server.members.fetch(
        data.calendarEvent.createdBy,
        data.serverId
      )
    });

    client.emit('calendarCreate', cal);
    client.emit('CalendarEventCreated', cal);
  } else if (type === 'CalendarEventUpdated') {
    const oldCal = channel.calendars.cache.get(data.calendarEvent.id);

    const cal = new Calendar(data.calendarEvent, {
      channel: channel,
      member: await channel.server.members.fetch(
        data.calendarEvent.createdBy,
        data.serverId
      )
    });

    client.emit('calendarUpdate', cal, oldCal);
    client.emit('CalendarEventUpdated', cal, oldCal);
  } else if (type === 'CalendarEventDeleted') {
    const cal = new Calendar(data.calendarEvent, {
      channel: channel,
      member: await channel.server.members.fetch(
        data.calendarEvent.createdBy,
        data.serverId
      )
    });

    client.emit('calendarDelete', cal);
    client.emit('CalendarEventDeleted', cal);
  }
}
