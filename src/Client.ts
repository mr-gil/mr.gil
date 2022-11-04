import { EventEmitter } from 'stream';
import { User } from './components';
import {
  ChannelCollection,
  ServerCollection,
  UserCollection
} from './components/Collection';
import { GuildedApiError } from './errors/apiError';
import { RESTManager } from './manager/RESTManager';
import { dispatch } from './misc/dispatch';
import { shard } from './ws/shard';

/**
 * The Client options to create a instance of the core (optional)
 * @example
 * const client = new Client({ token: "secret shush", cacheSize: 50 });
 */

type clientOptions = {
  cacheDocs?: boolean;
  restRetryInterval?: number;
  restRetries?: number;
  intents?: number;
  token?: string;
  versionGateway?: number;
  cacheSize?: number;
  cacheMessage?: boolean;
};

/**
 * The main core to interact with the Guilded API.
 * @example
 * const client = new Client();
 * client.once('ready', () => console.log(`Logged in as ${client.user.id}!`));
 * client.login("secret shush");
 * @extends {EventEmitter}
 */

export class Client extends EventEmitter {
  cacheDocs?: boolean;
  cacheForumTopics: boolean;
  cacheMessage: boolean;
  cacheSize: number;
  channels: ChannelCollection;
  gateway: number;
  private token: string;
  proxyUrl: string;
  readonly rest: RESTManager;
  readyTimestamp: number;
  resumeTimes: number;
  servers: ServerCollection;
  shards: any[];
  user: User;
  users: UserCollection;

  /**
   * Constructor to create a new Client instance
   * @example
   * const client = new Client();
   * @param {clientOptions} options Options for the client core
   */
  constructor(options: clientOptions = { versionGateway: 1 }) {
    super();
    Object.defineProperty(this, 'token', {
      enumerable: false,
      writable: true,
      value: options?.token
    });
    Object.defineProperty(this, 'gateway', {
      enumerable: false,
      writable: false,
      value: options?.versionGateway ?? 1
    });

    /**
     * The REST manager of the client. `This interacts with the Guilded API`
     * @type {RESTManager}
     */
    this.rest = new RESTManager({
      token: this.token,
      version: 1,
      maxRetries: options?.restRetries,
      retryInterval: options?.restRetryInterval
    });
    this.shards = [];
    this.cacheSize = options?.cacheSize;
    this.cacheMessage = options?.cacheMessage;
    this.cacheDocs = options?.cacheDocs;
  }

  /**
   * The Websocket URL to handshake with Guilded API
   * @returns `wss://www.guilded.gg/websocket/v1`
   * @readonly
   */
  get url(): string {
    return this.proxyUrl
      ? this.proxyUrl
      : `wss://www.guilded.gg/websocket/v${this.gateway}`;
  }

  /**
   * Returns the time of how long the client core went to READY state `(in milliseconds)`
   * @type {?number}
   * @readonly
   */
  get uptime(): number {
    return this.readyTimestamp && Date.now() - this.readyTimestamp;
  }

  /**
   * Logs the bot in, Establishes a handshake with Guilded API
   * @param {string} [token] Token of the bot to log in with
   * @returns {void} void
   * @example
   * client.login('secret shush');
   */
  login(token: string) {
    if (!token)
      throw new GuildedApiError(
        'Please provide an token to start your Guilded bot.'
      );

    if (typeof token == 'string')
      this.token = token = token.replace(/^(Bot|Bearer)\s*/i, '');

    try {
      this.rest.setSecret(this.token);

      const socket = new shard(this.url, this.shards.length, this, {
        token: this.token
      });
      this.readyTimestamp = socket.readyTimestamp();

      this.shards.push(socket);
    } catch {}
  }

  /**
   * Processes the data string to JSON Object `(not useful for end-user)`
   * @param {string} [data]
   * @returns {any} Objext/String
   * @example
   * client.processData('{"hello": "world"}')
   * @ignore
   */
  processData(data: string): any {
    try {
      return JSON.parse(data);
    } catch (e) {
      return data;
    }
  }

  /**
   * Fires an event based on the data. `(DO NOT USE IT)`
   * @returns {void} void
   * @param data
   * @example
   * client.interact(jsonData)
   * @ignore
   */
  interact(data: any): void {
    const { eventType, eventData } = data;

    dispatch(eventType, eventData, this);
  }

  /**
   * Reconnects to the websocket using Keep_Alive protocol `(DO NOT USE IT | THIS IS A AUTOMATED PROCESS)`
   * @param shardy
   * @ignore
   */
  reconnect(shardy: any) {
    const shardlamaID = shardy.shard_id,
      sessionID = shardy.session_id;
    this.shards.splice(shardlamaID, 1);
    const nshard = new shard(this.url, this.shards.length, this, { sessionID });

    this.resumeTimes++;

    nshard.once('open', () => {
      nshard.format({
        op: 6,
        d: {
          token: this.token,
          session_id: sessionID,
          seq: 1337
        }
      });
    });
    this.shards[shardlamaID] = nshard;
  }
}
