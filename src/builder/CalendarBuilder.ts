import { ColorResolvable, resolveColor } from '../misc/util';

export class CalendarBuilder {
  name: string;
  description?: string;
  location?: string;
  startsAt?: Date;
  url?: string;
  color?: ColorResolvable;
  rsvpLimit?: number;
  duration?: number;
  isPrivate?: boolean;

  constructor(data: calendarBuilderOptions) {
    this.name = data.name || 'New Event';
    this.description = data.description;
    this.location = data.location;
    this.startsAt = data.startsAt;
    this.url = data.url;
    this.color = data.color;
    this.rsvpLimit = data.limit;
    this.duration = data.duration;
    this.isPrivate = data.private;
  }

  setName(name?: string) {
    this.name = name;
    return this;
  }

  setDescription(text?: string) {
    this.description = text;
    return this;
  }

  setLocation(text?: string) {
    this.location = text;
    return this;
  }

  setTime(time: Date) {
    this.startsAt = time;
    return this;
  }

  setUrl(url?: string) {
    this.url = url;
    return this;
  }

  setColor(color?: ColorResolvable) {
    this.color = color ? resolveColor(color) : undefined;
    return this;
  }

  setLimit(num: number) {
    this.rsvpLimit = num;
    return this;
  }

  setDuration(num: number) {
    this.duration = num;
    return this;
  }

  setPrivate(privateBool: boolean) {
    this.isPrivate = privateBool;
  }
}

export type calendarBuilderOptions = {
  name?: string;
  description?: string;
  location?: string;
  startsAt?: Date;
  url?: string;
  color?: ColorResolvable;
  limit?: number;
  duration?: number;
  private?: boolean;
};
