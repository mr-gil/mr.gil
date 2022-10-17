import { Routes } from "guilded-api-typings";
import { Client } from "../Client";


export async function dispatch(type: string, data: any, client: Client, shard: any) {
    if (
      type === "ChatMessageCreated" ||
      type === "ChatMessageUpdated"
    ) {
      const {
        message: { id: messageId, content, channelId },
      } = data;

      console.log({ messageId, content, channelId });

      if (content.indexOf("hi") >= 0) {
        console.log('gotcha')
        return client.rest.https(
          Routes.message(channelId, messageId), "DELETE"
        ).then(console.log)
      }
    }
}