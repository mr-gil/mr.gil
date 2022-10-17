export class GilError extends Error {
  /**
   * Emit errors
   * @param {String} name
   */

  constructor(name: string) {
    const msg = '"' + name + '"' + "\n";
    super(msg);
  }
}

Object.defineProperty(GilError.prototype, "name", {
  value: "GilError",
});
