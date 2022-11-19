export type channelType =
  | 'announcements'
  | 'chat'
  | 'calendar'
  | 'forums'
  | 'media'
  | 'docs'
  | 'voice'
  | 'list'
  | 'scheduling'
  | 'stream';

export class ChannelBuilder {
  name: string;
  topic?: string;
  type?: channelType;
  serverId?: string;
  groupId?: string;
  categoryId?: number;
  isPrivate?: boolean;

  constructor(data?: channelBuilderOptions) {
    this.name = data?.name || 'New Channel';
    this.topic = data?.topic;
    this.type = data?.type;
    this.serverId = data?.serverId;
    this.groupId = data?.groupId;
    this.categoryId = data?.categoryId;
    this.isPrivate = data?.isPrivate;
  }

  setName(name?: string) {
    this.name = name;
    return this;
  }

  setTopic(text?: string) {
    this.topic = text;
    return this;
  }

  setType(text?: channelType) {
    this.type = text;
    return this;
  }

  setServer(id: string) {
    this.serverId = id;
    return this;
  }

  setGroup(id?: string) {
    this.groupId = id;
    return this;
  }

  setCategory(id?: number) {
    this.categoryId = id;
    return this;
  }

  setPrivate(privateBool: boolean) {
    this.isPrivate = privateBool;
  }
}

export type channelBuilderOptions = {
  name?: string;
  topic?: string;
  type?: channelType;
  serverId?: string;
  groupId?: string;
  categoryId?: number;
  isPrivate?: boolean;
};
