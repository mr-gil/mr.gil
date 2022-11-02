// Inspired by Guilded.JS' {@link https://github.com/guildedjs/guilded.js/blob/main/packages/webhook-client/lib/util.ts#L8 color resolver}.

/**
 * Resolves the color string to a valid hex number of the color
 * @param color 
 * @returns {number} `enum number`
 */
export function resolveColor(color: ColorResolvable): number {
  if (color === "RANDOM") color = Math.floor(Math.random() * (0xffffff + 1));
  else if (typeof color === `string`)
    // @ts-ignore
    color = Colors[color] ?? parseInt(color.replace("#", ""), 16);
  else if (Array.isArray(color))
    color = (color[0] << 16) + (color[1] << 8) + color[2];
  return color as number;
}

export type ColorResolvable =
  | `#${string}`
  | keyof typeof Colors
  | "RANDOM"
  | number
  | [r: number, g: number, b: number];

export enum Colors {
  DEFAULT = 0x000000,
  WHITE = 0xffffff,
  BLACK = 0x000000,
  GUILDED = 0xf5c400,
  GREY = 0x36363d,
  RED = 0xe03131,
  PINK = 0xc2255c,
  GRAPE = 0x9c36b5,
  VIOLET = 0x6741d9,
  INDIGO = 0x3b5bdb,
  BLUE = 0x1971c2,
  CYAN = 0x0c8599,
  TEAL = 0x099268,
  GREEN = 0x2f9e44,
  LIME = 0x66a80f,
  YELLOW = 0xfcc419,
  ORANGE = 0xe8590c,
}
