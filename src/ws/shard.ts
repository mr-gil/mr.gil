import ws from 'ws';
import { Client } from '../Client';
import { GuildedApiError } from '../errors/apiError';

const version = '0.0.1';
const userAgent = `Mr.Gil (guilded, ${version})`;

/**
 * The Shard class that is just used for Websocket connection
 *
 * No real use for `end-user`
 * @extends {ws}
 */

export class shard extends ws {
  client: Client;
  lastMessageId?: string;
  options: any;
  readyAt: number;
  reconnects = 0;
  session_id: string;
  shard_id: number;
  socket?: WebSocket;
  token: string;

  /**
   * Constructor to create a new Shard instance
   * @example
   * const shard = new shard(`wss://...`, 0, client, "session-id");
   * @param {string} url URL of the websocket
   * @param {number} shardid The ID of the shard that gets created
   * @param {Client} client Client instance
   * @param {any} options Options to be provided to the shard
   */

  constructor(
    url: string,
    shardid: number,
    client: Client,
    options: any = {},
    ...argument: any[]
  ) {
    super(
      url,
      ...[
        {
          headers: {
            Authorization: `Bearer ${options.token}`,
            'User-Agent': userAgent,
            'guilded-last-message-id': options.lastMessageId ?? ''
          }
        },
        ...argument
      ]
    );

    this.shard_id = shardid;
    Object.defineProperty(this, 'client', {
      enumerable: false,
      value: client,
      writable: false
    });
    if (options.sessionId) {
      this.session_id = options.sessionId;
    }

    this.on('open', () => {
      this.client.readyTimestamp = Date.now();
    });
    this.on('message', (data) => {
      const { t: eventType, d: eventData } = this.client.processData(
        data.toString()
      );

      const jsondata = { eventType, eventData };
      this.client.interact(jsondata);
    });

    this.on('close', () => {
      this.onSocketDisconnect.bind(this);
    });
    this.on('error', (e) => {
      this.client.emit('apiError', e);
      throw new GuildedApiError(e);
    });
  }

  /**
   * The Reconnection process to keep the connection alive.
   * Done in
   * @example
   * client.reconnect(shard)
   */
  private onSocketDisconnect() {
    this.socket = undefined;
    this.readyAt = undefined;
    if (
      !this.options.reconnect ||
      this.reconnects >= (this.options.maxReconnects ?? Infinity)
    )
      return this.emit('disconnect', this);
    this.reconnects++;
    this.client.reconnect(this);
    this.emit('reconnect', this);
  }

  /**
   * Status of the websocket if its connected
   * @returns {boolean} `boolean`
   */
  get connected() {
    return this.readyState == ws.OPEN;
  }

  /**
   * Formats a JSON data to string and sends the stream to the websocket
   * @param data
   * @param type
   * @returns {void} void
   */
  format(data: object, type = 'json') {
    return this.send(type == 'json' ? JSON.stringify(data) : data);
  }

  /**
   * Returns the time of the shard getting online `(READY state)`
   * @returns {number} `millisecond`
   */
  readyTimestamp(): any {
    return this.readyTimestamp;
  }

  /**
   * Stop the shard and close the handshake connection
   */
  stop() {
    this.removeAllListeners();
    this.close();
    this.terminate();
    this.client.shards.splice(this.shard_id, 1);
  }
}
