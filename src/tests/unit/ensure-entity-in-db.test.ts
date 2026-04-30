import { describe, test, expect, mock } from 'bun:test';
import { ensureEntityInDb } from '../../server/ensure-entity-in-db';

describe('ensureEntityInDb', () => {
  test('returns existing entity when found in DB', async () => {
    const existing = { id: '1', slug: 'my-slug' };
    const findExisting = mock(() => Promise.resolve(existing));
    const fetchContent = mock(() => Promise.resolve(null));
    const insert = mock(() => Promise.resolve(null as any));

    const result = await ensureEntityInDb({
      slug: 'my-slug',
      findExisting,
      fetchContent,
      insert,
    });

    expect(result).toBe(existing);
    expect(findExisting).toHaveBeenCalledWith('my-slug');
    expect(fetchContent).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  test('creates entity from filesystem when not in DB', async () => {
    const content = { slug: 'new-slug', title: 'New', order: 1 };
    const created = { id: '2', slug: 'new-slug' };

    const findExisting = mock(() => Promise.resolve(undefined));
    const fetchContent = mock(() => Promise.resolve(content));
    const insert = mock(() => Promise.resolve(created));

    const result = await ensureEntityInDb({
      slug: 'new-slug',
      findExisting,
      fetchContent,
      insert,
    });

    expect(result).toBe(created);
    expect(findExisting).toHaveBeenCalledWith('new-slug');
    expect(fetchContent).toHaveBeenCalledWith('new-slug');
    expect(insert).toHaveBeenCalledWith(content);
  });

  test('returns null when content not found on filesystem', async () => {
    const findExisting = mock(() => Promise.resolve(undefined));
    const fetchContent = mock(() => Promise.resolve(null));
    const insert = mock(() => Promise.resolve(null as any));

    const result = await ensureEntityInDb({
      slug: 'missing-slug',
      findExisting,
      fetchContent,
      insert,
    });

    expect(result).toBeNull();
    expect(insert).not.toHaveBeenCalled();
  });

  test('retries findExisting on insert failure (race condition)', async () => {
    const existing = { id: '3', slug: 'race-slug' };

    const findExisting = mock(() => Promise.resolve(undefined));
    // On second call, return the entity (simulating another request inserted it)
    findExisting.mockImplementation(() => {
      if (findExisting.mock.calls.length > 1) {
        return Promise.resolve(existing);
      }
      return Promise.resolve(undefined);
    });

    const fetchContent = mock(() =>
      Promise.resolve({ slug: 'race-slug', title: 'Race' }),
    );
    const insert = mock(() =>
      Promise.reject(new Error('duplicate key violates unique constraint')),
    );

    const result = await ensureEntityInDb({
      slug: 'race-slug',
      findExisting,
      fetchContent,
      insert,
    });

    expect(result).toBe(existing);
    expect(insert).toHaveBeenCalledTimes(1);
    expect(findExisting).toHaveBeenCalledTimes(2);
  });

  test('throws when insert fails and entity still not found on retry', async () => {
    const findExisting = mock(() => Promise.resolve(undefined));
    const fetchContent = mock(() =>
      Promise.resolve({ slug: 'fail-slug', title: 'Fail' }),
    );
    const insert = mock(() =>
      Promise.reject(new Error('constraint violation')),
    );

    await expect(
      ensureEntityInDb({
        slug: 'fail-slug',
        findExisting,
        fetchContent,
        insert,
      }),
    ).rejects.toThrow(
      'Failed to insert entity "fail-slug" and it was not found on retry.',
    );
  });

  test('calls logger with sync message', async () => {
    const logInfo = mock(() => {});
    const findExisting = mock(() => Promise.resolve(undefined));
    const fetchContent = mock(() =>
      Promise.resolve({ slug: 'log-slug', title: 'Log' }),
    );
    const insert = mock(() => Promise.resolve({ id: '4', slug: 'log-slug' }));

    await ensureEntityInDb({
      slug: 'log-slug',
      findExisting,
      fetchContent,
      insert,
      logger: { info: logInfo },
    });

    expect(logInfo).toHaveBeenCalledWith(
      '[ensureEntityInDb] Lazy syncing entity: log-slug',
    );
  });

  test('does not call logger when entity already exists', async () => {
    const logInfo = mock(() => {});
    const findExisting = mock(() =>
      Promise.resolve({ id: '5', slug: 'existing' }),
    );
    const fetchContent = mock(() => Promise.resolve(null));
    const insert = mock(() => Promise.resolve(null as any));

    await ensureEntityInDb({
      slug: 'existing',
      findExisting,
      fetchContent,
      insert,
      logger: { info: logInfo },
    });

    expect(logInfo).not.toHaveBeenCalled();
  });
});
