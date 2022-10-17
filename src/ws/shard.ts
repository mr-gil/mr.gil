import ws from "ws";
import { GuildedApiError } from "../errors/apiError";

const version = "0.0.1"
const userAgent = `Mr.Gil (guilded, ${version})`;

export class shard extends ws {
  shard_id: string;
  session_id: any;
  client: any;
  socket?: WebSocket;
  reconnects = 0;
  lastMessageId?: string;
  readyAt: any;
  token: any;
  options: any;

  constructor(
    url: string,
    shardid: any,
    client: any,
    options: any = {},
    ...argument: any[]
  ) {
    super(
      url,
      ...[
        {
          headers: {
            Authorization: `Bearer ${options.token}`,
            "User-Agent": userAgent,
            "guilded-last-message-id": options.lastMessageId ?? "",
          },
        },
        ...argument,
      ]
    );

    this.shard_id = shardid;
    Object.defineProperty(this, "client", {
      enumerable: false,
      value: client,
      writable: false,
    });
    if (options.sessionId) {
      this.session_id = options.sessionId;
    }

    this.on("open", () => {
      this.client.emit("ready");
      this.client.readyTimestamp = Date.now();
    });
    this.on("message", (data) => {
      const { t: eventType, d: eventData } = this.client.processData(
        data.toString()
      );

      let jsondata = { eventType, eventData };
      this.client.interact(jsondata, this);
    });

    this.on("close", () => {
      this.onSocketDisconnect.bind(this);
    });
    this.on("error", (e) => {
      this.client.emit("error", e);
      throw new GuildedApiError(e);
    });
  }

  private onSocketDisconnect() {
    this.socket = undefined;
    this.readyAt = undefined;
    if (
      !this.options.reconnect ||
      this.reconnects >= (this.options.maxReconnects ?? Infinity)
    )
      return this.emit("disconnect", this);
    this.reconnects++;
    this.client.reconnect(this)
    this.emit("reconnect", this);
  }
  
  get connected() {
    return this.readyState == ws.OPEN;
  }

  format(data: object, type = "json") {
    return this.send(type == "json" ? JSON.stringify(data) : data);
  }

  readyTimestamp(): any {
    return this.readyTimestamp;
  }

  stop() {
    this.removeAllListeners();
    this.close();
    this.terminate();
    this.client.shards.splice(this.shard_id, 1);
  }
}
