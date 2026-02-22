import {
  getTutorialContent,
  clearContentCaches,
} from '@/server/content.server';

const SLUG = 'test-fixtures';
const LOCALE = 'en';
const ITERATIONS = 1000;

async function benchmark() {
  console.log(
    `Benchmarking getTutorialContent for slug: ${SLUG}, locale: ${LOCALE}`,
  );
  console.log(`Iterations: ${ITERATIONS}`);

  // Warmup (load registry etc)
  await getTutorialContent(SLUG, LOCALE);

  const start = performance.now();

  for (let i = 0; i < ITERATIONS; i++) {
    await getTutorialContent(SLUG, LOCALE);
  }

  const end = performance.now();
  const totalTime = end - start;
  const avgTime = totalTime / ITERATIONS;

  console.log(`Total time: ${totalTime.toFixed(2)}ms`);
  console.log(`Average time per call: ${avgTime.toFixed(4)}ms`);
}

// Ensure caches are cleared before starting (though we warmup)
clearContentCaches();

benchmark().catch(console.error);
