import {
  APIEmbedAuthor,
  APIEmbedField,
  APIEmbedFooter,
  APIEmbedMedia
} from 'guilded-api-typings';
import { ColorResolvable, resolveColor } from '../misc/util';

export class MessageEmbed {
  author?: APIEmbedAuthor;
  color?: ColorResolvable;
  description?: string;
  fields?: APIEmbedField[];
  footer?: APIEmbedFooter;
  image?: APIEmbedMedia;
  thumbnail?: APIEmbedMedia;
  timestamp?: Date;
  title?: string;
  url?: string;

  constructor(data?: embedBuilderOptions) {
    this.title = data?.title;
    this.description = data?.description;
    this.url = data?.url;
    this.color = data?.color;
    this.footer = data?.footer;
    this.timestamp = data?.timestamp ? new Date(data.timestamp) : undefined;
    this.thumbnail = data?.thumbnail;
    this.image = data?.image;
    this.author = data?.author;
    this.fields = data?.fields ?? [];
  }

  setTitle(title?: string) {
    this.title = title;
    return this;
  }

  setDescription(description?: string) {
    this.description = description;
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

  setFooter(text?: string, iconUrl?: string) {
    this.footer = text ? { text, icon_url: iconUrl } : undefined;
    return this;
  }

  setTimestamp(timestamp?: string | number | Date) {
    this.timestamp = new Date(timestamp ?? Date.now());
    return this;
  }

  setThumbnail(thumbnailUrl?: string) {
    this.thumbnail = { url: thumbnailUrl };
    return this;
  }

  setImage(imageUrl?: string) {
    this.image = { url: imageUrl };
    return this;
  }

  setAuthor(author?: string | APIEmbedAuthor) {
    this.author = typeof author === 'string' ? { name: author } : author;
    return this;
  }

  addField(name: string, value: string, inline?: boolean) {
    this.fields.push({ name, value, inline });
    return this;
  }

  setFields(fields: APIEmbedField[] = []) {
    this.fields = fields;
    return this;
  }
}

export type embedBuilderOptions = {
  author?: APIEmbedAuthor;
  color?: ColorResolvable;
  description?: string;
  fields?: APIEmbedField[];
  footer?: APIEmbedFooter;
  image?: APIEmbedMedia;
  thumbnail?: APIEmbedMedia;
  timestamp?: Date;
  title?: string;
  url?: string;
};
