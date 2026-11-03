import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import {
  completeSyntheticLesson,
  createSyntheticAccount,
  getPreviewStatus,
  getSyntheticSession,
  sampleResetPasswordHash,
  signInSyntheticAccount,
  signOutSyntheticAccount,
} from '../server/preview.fn';

export const Route = createFileRoute('/')({
  loader: () => getPreviewStatus({ data: {} }),
  component: PreviewPage,
});

function PreviewPage() {
  const status = Route.useLoaderData();
  const [syntheticId, setSyntheticId] = useState('');
  const [result, setResult] = useState('No scenarios executed.');
  const [pending, setPending] = useState(false);

  async function run(operation: () => Promise<unknown>) {
    setPending(true);
    try {
      setResult(JSON.stringify(await operation(), null, 2));
    } catch {
      setResult('The operation failed. For the failure scenario, check that XP remains unchanged.');
    } finally {
      setPending(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: '4rem auto', padding: '0 1rem', fontFamily: 'system-ui' }}>
      <h1>TWE migration preview</h1>
      <p>Isolated synthetic fixtures for issue #249. This does not serve the production app.</p>
      <pre>{JSON.stringify(status, null, 2)}</pre>
      <fieldset disabled={pending}>
        <legend>Deferred validation scenarios</legend>
        <p>These controls execute requests only when selected. CPU must be measured in Cloudflare, not inferred from browser timing.</p>
        <button onClick={() => void run(async () => {
          const created = await createSyntheticAccount({ data: {} });
          setSyntheticId(created.syntheticId);
          return created;
        })}>Create synthetic account</button>{' '}
        <button disabled={!syntheticId} onClick={() => void run(() => signInSyntheticAccount({ data: { syntheticId } }))}>Password login</button>{' '}
        <button onClick={() => void run(() => getSyntheticSession({ data: {} }))}>Read session and XP</button>{' '}
        <button onClick={() => void run(() => sampleResetPasswordHash({ data: {} }))}>Sample password hashing</button>{' '}
        <button onClick={() => void run(() => signOutSyntheticAccount({ data: {} }))}>Sign out</button>
        <p>
          <button onClick={() => void run(() => completeSyntheticLesson({ data: { lessonId: 'lesson-a', injectFailure: false } }))}>Complete lesson A</button>{' '}
          <button onClick={() => void run(() => completeSyntheticLesson({ data: { lessonId: 'lesson-b', injectFailure: false } }))}>Complete lesson B</button>{' '}
          <button onClick={() => void run(() => completeSyntheticLesson({ data: { lessonId: 'lesson-b', injectFailure: true } }))}>Inject batch failure</button>
        </p>
      </fieldset>
      <pre aria-live="polite">{result}</pre>
    </main>
  );
}
