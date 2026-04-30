/**
 * Shared lazy-sync utility for ensuring entities exist in the database.
 *
 * Eliminates duplicated "if not in DB, create from filesystem" logic
 * across server functions.
 */

interface EnsureEntityInDbOptions<TEntity, TContent> {
  /** The unique slug to look up */
  slug: string;
  /** Query the DB for an existing entity by slug */
  findExisting: (slug: string) => Promise<TEntity | undefined>;
  /** Fetch content from filesystem; returns null if not found */
  fetchContent: (slug: string) => Promise<TContent | null>;
  /** Insert the entity (and any related records) into DB, return the created entity */
  insert: (content: TContent) => Promise<TEntity>;
  /** Optional logger for sync events */
  logger?: { info: (msg: string) => void };
}

/**
 * Ensures an entity exists in the database by:
 * 1. Checking the DB first
 * 2. If not found, fetching from filesystem via `fetchContent`
 * 3. If found on filesystem, inserting via `insert`
 * 4. Handling race conditions (duplicate insert attempts)
 *
 * @returns The existing or newly created entity, or null if not found on filesystem
 */
export async function ensureEntityInDb<TEntity, TContent>({
  slug,
  findExisting,
  fetchContent,
  insert,
  logger,
}: EnsureEntityInDbOptions<TEntity, TContent>): Promise<TEntity | null> {
  // Step 1: Check DB
  const existing = await findExisting(slug);
  if (existing) {
    return existing;
  }

  // Step 2: Fetch from filesystem
  const content = await fetchContent(slug);
  if (!content) {
    return null;
  }

  // Step 3: Insert into DB
  logger?.info(`[ensureEntityInDb] Lazy syncing entity: ${slug}`);

  try {
    const created = await insert(content);
    return created;
  } catch {
    // Step 4: Race condition — another request may have inserted it
    const retry = await findExisting(slug);
    if (retry) {
      return retry;
    }
    // Re-throw if it's a legitimate error (not a race condition)
    throw new Error(
      `Failed to insert entity "${slug}" and it was not found on retry.`,
    );
  }
}
