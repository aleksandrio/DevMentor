/** Port: checks that the database answers. Implemented in @devmentor/db. */
export interface DatabaseHealthProbe {
  /** Resolves when the database answers a trivial query; rejects otherwise. */
  ping(): Promise<void>;
}
