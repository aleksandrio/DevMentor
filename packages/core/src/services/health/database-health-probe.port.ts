/** Port: checks that the database answers. */
export interface DatabaseHealthProbe {
  /** Resolves when the database answers a trivial query; rejects otherwise. */
  ping(): Promise<void>;
}
