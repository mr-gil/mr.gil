import { APIError } from "guilded-api-typings";
import EventEmitter from "events";
import { GuildedApiError } from "../errors/apiError";
import { request } from "https";
import { GilError } from "../errors/error";
import { Client } from "../Client";

const version = "0.0.1";
const userAgent = `Mr.Gil (guilded, ${version})`;

export class RESTManager extends EventEmitter {
  token?: string;
  readonly version?: number;
  readonly proxyUrl?: string;
  client: Client;

  constructor(public readonly options: RESTOptions) {
    super();
    this.token = options.token;
    this.proxyUrl = options.proxyUrl;
    if (!this.proxyUrl) this.version = options.version;
  }

  get baseUrl() {
    return this.proxyUrl
      ? this.proxyUrl
      : `https://www.guilded.gg/api/v${this.version}`;
  }

  parse(json: string) {
    try {
      return JSON.parse(json);
    } catch (e) {
      return json;
    }
  }

  setSecret(token?: string) {
    this.token = token;
    return this;
  }

  async https<
    R = any,
    B = any,
    P extends Record<string, any> = Record<string, any>
  >(
    path: string,
    method: string,
    options?: FetchOptions<B, P>,
    retries = 0
  ): Promise<R> {
    return new Promise(async (resolve, reject) => {
      const searchParams = new URLSearchParams();
      if (options?.params)
        for (const [key, value] of Object.entries(options.params))
          searchParams.append(key, value.toString());
      const req = request(
        {
          hostname: `www.guilded.gg`,
          path: `/api/v${this.version}` + path + searchParams,
          method,
          headers: {
            "Content-Type": "application/json",
            "User-Agent": userAgent,
            Authorization: `Bearer ${this.token}`,
          },
        },
        async (response) => {
          var body = "";
          response.on("error", (error: APIError) => {
            throw new GuildedApiError(error);
          });

          response.on("data", (chunk) => {
            body = body + chunk;

            if (response.complete) {
              this.emit("raw", body, response);
              return body;
            }
          });

          if (
            response.statusCode === 429 &&
            retries <= (this.options?.maxRetries ?? 3)
          ) {
            const retryAfter =
              Number(response.headers["retry-after"]) ??
              this.options.retryInterval ??
              30000 / 1000;
            await new Promise((resolve) =>
              setTimeout(resolve, retryAfter * 1000)
            );
            return this.https(path, method, options, retries++);
          }

          response.on("end", () => {
            try {
              resolve(JSON.parse(body));
            } catch (e: any) {
              throw new GilError(e);
            }
          });
        }
      );

      req.on("error", reject);
      if (options?.body) req.write(options.body);

      req.end(JSON.stringify);
    });
  }

  get<R = any, P extends Record<string, any> = Record<string, any>>(
    path: string,
    params?: P
  ) {
    return this.https<R, any, P>(path, "GET", { params });
  }

  post<R = any, B = any>(path: string, body?: B) {
    return this.https<R, B>(path, "POST", body);
  }

  patch<R = any, B = any>(path: string, body?: B) {
    return this.https<R, B>(path, "PATCH", body);
  }

  put<R = any, B = any>(path: string, body?: B) {
    return this.https<R, B>(path, "PUT", body);
  }

  delete<R>(path: string) {
    return this.https<R>(path, "DELETE");
  }
}

export interface RESTOptions {
  headers?: any;
  token?: string;
  version?: number;
  proxyUrl?: string;
  retryInterval?: number;
  maxRetries?: number;
}

export interface FetchOptions<
  B = any,
  P extends Record<string, any> = Record<string, any>
> {
  port?: any;
  params?: P;
  body?: B;
}
