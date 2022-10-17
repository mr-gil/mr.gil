import { EventEmitter } from "stream";
import ws from "ws";
import { GilError } from "./errors/error";
import { RESTManager } from "./manager/RESTManager";
import { dispatch } from "./misc/dispatch";
import { shard } from "./ws/shard";

type clientOptions = {
  restAPIRetryInterval?: number;
  maxRestAPIRetries?: number;
  platform?: "desktop" | "web" | "mobile";
  intents?: number;
  token?: string;
  versionGateway?: number;
};

export class Client extends EventEmitter {
  private token: string;
  protected gateway: number;
  shards: any[];
  platform: any;
  readyTimestamp: any;
  readonly rest: RESTManager;
  proxyUrl: any;
  resumeTimes: any;

  constructor(options: clientOptions = { versionGateway: 1 }) {
    super();
    Object.defineProperty(this, "token", {
      enumerable: false,
      writable: true,
      value: options.token,
    });
    Object.defineProperty(this, "gateway", {
      enumerable: false,
      writable: false,
      value: options.versionGateway ?? 1,
    });

    this.rest = new RESTManager({
      token: this.token,
      version: 1,
      maxRetries: options.maxRestAPIRetries,
      retryInterval: options.restAPIRetryInterval,
    });
    this.shards = [];

    this.platform = options.platform;
  }

  get url(): string {
    return this.proxyUrl
      ? this.proxyUrl
      : `wss://www.guilded.gg/websocket/v${this.gateway}`;
  }

  public ping() {
    return (
      this.shards.reduce((a, b) => a.ping + b.ping, 0) / this.shards.length
    );
  }

  public uptime() {
    return this.readyTimestamp && Date.now() - this.readyTimestamp;
  }

  login(token: string) {
    if (!token)
      throw new GilError("Please provide an token to start your Discord bot.");

    if (typeof token == "string")
      this.token = token = token.replace(/^(Bot|Bearer)\s*/i, "");

    
    try {

      this.rest.setSecret(this.token)
      
      let socket = new shard(
        this.url,
        this.shards.length,
        this,
        {
          token: this.token,
        }
      );
      this.readyTimestamp = socket.readyTimestamp();

      this.shards.push(socket);
    } catch {}
  }

  processData(data: string) {
    try {
      return JSON.parse(data);
    } catch (e) {
      return data;
    }
  }

  interact(data: any, shard: any) {
    const { eventType, eventData } = data;

    dispatch(eventType, eventData, this, shard)
  }

  reconnect(shardy: any) {
    const shardlamaID = shardy.shard_id,
      sessionID = shardy.session_id;
    this.shards.splice(shardlamaID, 1);
    const nshard = new shard(
      this.url,
      this.shards.length,
      this,
      { sessionID }
    );

    this.resumeTimes++;

    nshard.once("open", () => {
      nshard.format({
        op: 6,
        d: {
          token: this.token,
          session_id: sessionID,
          seq: 1337,
        },
      });
    });
    this.shards[shardlamaID] = nshard;
  }
}
