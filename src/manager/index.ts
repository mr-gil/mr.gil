export interface FetchOptions extends FetchManyOptions {
  /** The whether to force fetch the data. */
  force?: boolean;
}

/** The options for fetching multiple data from Guilded. */
export interface FetchManyOptions {
  /** The whether to cache the fetched data. */
  cache?: boolean;
}
