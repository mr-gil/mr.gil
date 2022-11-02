import { Client } from "../Client";
import { MessageEvents } from "./MessageEvents";
import { TeamMemberEvents } from "./TeamMemberEvents";
import { DocEvents } from "./DocEvents"

export default function eventHandler(type: string, data: any, client: Client) {
  if (type.includes("ChatMessage"))
    MessageEvents(type, data, client)
  else if (type.includes("TeamMember"))
    TeamMemberEvents(type, data, client)
    else if(type.includes("Doc"))
      DocEvents(type, data, client)
}