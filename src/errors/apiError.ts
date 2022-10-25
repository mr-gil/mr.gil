import { APIError } from "guilded-api-typings";

export class GuildedApiError extends Error {
  /**
   * Emit errors
   * @param {any | APIError} name
   */

  constructor(err: APIError | any) {
    const msg =
      err.code +
      ": " +
      err.message +
      (err.meta ? " - " + err.meta[Object.keys(err.meta)[0]][0] : "");
    super(
      err.code === "ENOTFOUND"
        ? "You don't have access to the Guilded api.\n\nThis may due to the hosting server\n\t(or)\nBot secret is invalid\n"
        : msg
    );
  }
}

Object.defineProperty(GuildedApiError.prototype, "name", {
  value: "GuildedApiError",
});
