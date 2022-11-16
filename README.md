# Mr.Gil

```
This is a work-in-progress project.
```

### The future of Guilded wrapper..

---

# Coming soon.

---

## Update

- Absorbing all Event name changes. now API Event names are changed. See the API Docs.
- Many many events are here
- 6 events pending
- Everythings tested ! Fixed many bugs

---

# What's Implemented ?

- !!! **34/40 Events** !!!

### BotMember

- BotServerMembershipCreated (botCreate event)

### CalendarEvent

- CalendarEventCreated (calendarCreate event)
- CalendarEventUpdated (calendarUpdate event)
- CalendarEventDeleted(calendarDelete event)

### ChannelMessageReaction

- ChannelMessageReactionCreated (messageReact event)
- ChannelMessageReactionDeleted (messageUnreact event)

### ChatMessage

- ChatMessageCreated (messageCreate event)
- ChatMessageDeleted (messageDelete event)
- ChatMessageUpdated (messageUpdate event)

### Doc

- DocCreated (docCreate event)
- DocUpdated (docUpdate event)
- DocDeleted (docDelete event)

### ForumTopic

- ForumTopicCreated (topicCreate event)
- ForumTopicUpdated (topicUpdate event)
- ForumTopicDeleted (topicDelete event)
- ForumTopicPinned (topicPin event)
- ForumTopicUnpinned (topicUnpin event)
- ForumTopicLocked (topicLock event)
- ForumTopicUnlocked (topicUnlock event)

### ForumTopicReaction

- ForumTopicReactionCreated (topicReact event)
- ForumTopicReactionDeleted (topicUnreact event)

### ListItem

- ListItemCreated (listCreate event)
- ListItemUpdated (listUpdate event)
- ListItemDeleted (listDelete event)
- ListItemCompleted (listComplete event)
- ListItemUncompleted (listUncomplete event)

### ServerMember

- ServerMemberJoined (memberJoin event)
- ServerMemberRemoved (memberRemove event)
- ServerMemberBanned (memberBan event)
- ServerMemberUnbanned (memberUnban event)
- ServerMemberUpdated (memberUpdate event)

### ServerRoles

- ServerRolesUpdated (roleUpdate event)

### ServerWebhook

- ServerWebhookCreated (webhookCreate event)
- ServerWebhookUpdated (webhookUpdate event)

---

# What's left

- ### CalenderEventRsvp `(3 events)`
- ### TeamChannel `(3 events)`

---

We do also support [Guilded API Websocket events](https://www.guilded.gg/docs/api/websockets) (like `ChatMessageCreated`)

```
These events are hard to memorize ?
You have experience developing bots in discord.js ?

Don't worry,
Its very similar to the discord.js v13 event names. We do provide better typings for event names. So no need of scrubbing the docs
```

## We will finish this marvellous project soon ;)
