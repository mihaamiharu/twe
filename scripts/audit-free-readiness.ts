/* eslint-disable security/detect-non-literal-fs-filename -- Operator auth and private output stay outside the checkout. */
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';
import { readJsonConfig } from './json-config';
import { writePrivate, assertPrivatePath } from './migration/model';

const [outputArgument, windowStartArgument, windowEndArgument] =
  process.argv.slice(2);
if (!outputArgument)
  throw new Error('Specify an absolute private audit report path.');
const outputPath = assertPrivatePath(outputArgument);

async function main() {
  const window =
    windowStartArgument || windowEndArgument
      ? z
          .object({
            start: z.string().datetime(),
            end: z.string().datetime(),
          })
          .parse({ start: windowStartArgument, end: windowEndArgument })
      : undefined;
  if (
    window &&
    (Date.parse(window.end) <= Date.parse(window.start) ||
      Date.parse(window.end) - Date.parse(window.start) > 3_600_000)
  )
    throw new Error(
      'The optional audit window must be positive and at most one hour.',
    );
  const config = z
    .object({ account_id: z.string().regex(/^[a-f0-9]{32}$/) })
    .parse(await readJsonConfig('wrangler.jsonc'));
  // Operator-only: never copy this broader CLI credential into CI or a report.
  const auth = z
    .object({ oauth_token: z.string().min(20) })
    .parse(
      Bun.TOML.parse(
        await readFile(
          join(homedir(), 'Library/Preferences/.wrangler/config/default.toml'),
          'utf8',
        ),
      ),
    );
  const request = async (path: string, body?: object) => {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4${path}`,
      {
        method: body ? 'POST' : 'GET',
        headers: {
          Authorization: `Bearer ${auth.oauth_token}`,
          'Content-Type': 'application/json',
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(30_000),
      },
    );
    if (!response.ok)
      throw new Error('Cloudflare read-only audit request failed.');
    return (await response.json()) as unknown;
  };
  const today = new Date().toISOString().slice(0, 10);
  const previousDay = new Date(Date.parse(`${today}T00:00:00Z`) - 86_400_000)
    .toISOString()
    .slice(0, 10);
  const query = `{viewer{accounts(filter:{accountTag:"${config.account_id}"}){
    workersInvocationsAdaptive(limit:1000,filter:{date_gt:"${previousDay}"}){dimensions{scriptName status} sum{requests errors subrequests} max{cpuTime memoryUsageBytes} quantiles{cpuTimeP99} avg{sampleInterval}}
    durableObjectsInvocationsAdaptiveGroups(limit:1000,filter:{date_gt:"${previousDay}"}){dimensions{scriptName namespaceId status name} sum{requests errors} quantiles{cpuTimeP99} avg{sampleInterval}}
    durableObjectsPeriodicGroups(limit:1000,filter:{date_gt:"${previousDay}"}){dimensions{namespaceId name} sum{duration activeTime cpuTime exceededMemoryErrors exceededCpuErrors rowsRead rowsWritten} max{memoryUsageBytes} avg{sampleInterval}}
    d1AnalyticsAdaptiveGroups(limit:1000,filter:{date_gt:"${previousDay}"}){dimensions{databaseId} sum{rowsRead rowsWritten readQueries writeQueries}}
  }}}`;
  const [analytics, databases, namespaces] = await Promise.all([
    request('/graphql', { query }),
    request(`/accounts/${config.account_id}/d1/database?per_page=100`),
    request(
      `/accounts/${config.account_id}/workers/durable_objects/namespaces?per_page=100`,
    ),
  ]);
  const numericMap = z.record(z.string(), z.number());
  const dimensions = z.record(z.string(), z.string());
  const metric = z.object({
    dimensions,
    sum: numericMap,
    max: numericMap.optional(),
    avg: numericMap.optional(),
    quantiles: numericMap.optional(),
  });
  const analyticsSchema = z.object({
    errors: z.unknown().nullable().optional(),
    data: z.object({
      viewer: z.object({
        accounts: z.array(
          z.object({
            workersInvocationsAdaptive: z.array(metric),
            durableObjectsInvocationsAdaptiveGroups: z.array(metric),
            durableObjectsPeriodicGroups: z.array(metric),
            d1AnalyticsAdaptiveGroups: z.array(metric),
          }),
        ),
      }),
    }),
  });
  const parsed = analyticsSchema.parse(analytics);
  if (parsed.errors)
    throw new Error('Cloudflare analytics returned incomplete evidence.');
  const account = parsed.data.viewer.accounts[0];
  if (!account || parsed.data.viewer.accounts.length !== 1)
    throw new Error('Unexpected audit account selection.');
  const databaseList = z
    .object({
      success: z.literal(true),
      result: z.array(
        z.object({
          uuid: z.string(),
          name: z.string(),
          file_size: z.number().optional(),
        }),
      ),
      result_info: z.object({ total_count: z.number().optional() }).optional(),
    })
    .parse(databases);
  const namespaceList = z
    .object({
      success: z.literal(true),
      result: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          script: z.string().optional(),
          use_sqlite: z.boolean().optional(),
        }),
      ),
    })
    .parse(namespaces);
  if (
    (databaseList.result_info?.total_count ?? databaseList.result.length) >
      databaseList.result.length ||
    databaseList.result.length >= 100 ||
    namespaceList.result.length >= 100
  )
    throw new Error('Inventory pagination requires a complete account audit.');
  for (const rows of Object.values(account))
    if (rows.length >= 1000)
      throw new Error(
        'Analytics row limit reached; narrow the evidence window.',
      );
  const sum = (rows: z.infer<typeof metric>[], name: string) =>
    // eslint-disable-next-line security/detect-object-injection -- Fixed audit metric names and schema-validated numeric records.
    rows.reduce((total, row) => total + (row.sum[name] ?? 0), 0);
  const maximum = (rows: z.infer<typeof metric>[], name: string) =>
    // eslint-disable-next-line security/detect-object-injection -- Fixed audit metric names and schema-validated numeric records.
    Math.max(0, ...rows.map((row) => row.max?.[name] ?? 0));
  const requests = sum(account.workersInvocationsAdaptive, 'requests');
  const objectRequests = sum(
    account.durableObjectsInvocationsAdaptiveGroups,
    'requests',
  );
  const objectDuration = sum(account.durableObjectsPeriodicGroups, 'duration');
  const rowsRead = sum(account.d1AnalyticsAdaptiveGroups, 'rowsRead');
  const rowsWritten = sum(account.d1AnalyticsAdaptiveGroups, 'rowsWritten');
  const peakMemory = maximum(
    account.durableObjectsPeriodicGroups,
    'memoryUsageBytes',
  );
  const previewNamespaces = new Set(
    namespaceList.result
      .filter((namespace) => namespace.script === 'twe-preview')
      .map((namespace) => namespace.id),
  );
  const previewPeriods = account.durableObjectsPeriodicGroups.filter((row) =>
    previewNamespaces.has(row.dimensions['namespaceId'] ?? ''),
  );
  let studyWindow;
  if (window) {
    const queryInWindow = query.replaceAll(
      `date_gt:"${previousDay}"`,
      `datetime_geq:"${window.start}",datetime_leq:"${window.end}"`,
    );
    const result = analyticsSchema.parse(
      await request('/graphql', { query: queryInWindow }),
    );
    const measured = result.data.viewer.accounts[0];
    if (
      result.errors ||
      !measured ||
      result.data.viewer.accounts.length !== 1 ||
      Object.values(measured).some((rows) => rows.length >= 1000)
    )
      throw new Error('Incomplete bounded-window analytics.');
    const periods = measured.durableObjectsPeriodicGroups.filter((row) =>
      previewNamespaces.has(row.dimensions['namespaceId'] ?? ''),
    );
    const invocations = measured.durableObjectsInvocationsAdaptiveGroups.filter(
      (row) => row.dimensions['scriptName'] === 'twe-preview',
    );
    const gateway = measured.workersInvocationsAdaptive.filter(
      (row) => row.dimensions['scriptName'] === 'twe-preview',
    );
    studyWindow = {
      ...window,
      gatewayRequests: sum(gateway, 'requests'),
      gatewayErrors: sum(gateway, 'errors'),
      gatewayMaxCpuMs: maximum(gateway, 'cpuTime') / 1000,
      objectRequests: sum(invocations, 'requests'),
      objectInvocationErrors: sum(invocations, 'errors'),
      objectDurationGbSeconds: sum(periods, 'duration'),
      objectPeriodicGroups: periods.length,
      objectPeriodicPeakMemoryBytes: periods.length
        ? maximum(periods, 'memoryUsageBytes')
        : null,
      objectExceededMemoryErrors: sum(periods, 'exceededMemoryErrors'),
      objectExceededCpuErrors: sum(periods, 'exceededCpuErrors'),
      limitation:
        'Provider sampling/lag and periodic memory can miss peaks; this window can include other preview activity. Empty periodic groups are not zero memory.',
    };
  }
  const report = {
    capturedAt: new Date().toISOString(),
    utcDay: today,
    target: 'TWE account; all returned resources',
    billingPlanVerifiedByThisApi: false,
    ...(studyWindow ? { studyWindow } : {}),
    accountWorkers: {
      requests,
      errors: sum(account.workersInvocationsAdaptive, 'errors'),
      remainingDailyRequests: 100_000 - requests,
    },
    previewGateway: account.workersInvocationsAdaptive
      .filter((row) => row.dimensions['scriptName'] === 'twe-preview')
      .map((row) => ({
        status: row.dimensions['status'],
        requests: row.sum['requests'],
        errors: row.sum['errors'],
        maxCpuMs: (row.max?.['cpuTime'] ?? 0) / 1000,
        estimatedP99CpuMs: (row.quantiles?.['cpuTimeP99'] ?? 0) / 1000,
        sampling: row.avg?.['sampleInterval'],
      })),
    accountObjects: {
      requests: objectRequests,
      remainingDailyRequests: 100_000 - objectRequests,
      durationGbSeconds: objectDuration,
      remainingDailyGbSeconds: 13_000 - objectDuration,
      exceededCpuErrors: sum(
        account.durableObjectsPeriodicGroups,
        'exceededCpuErrors',
      ),
      exceededMemoryErrors: sum(
        account.durableObjectsPeriodicGroups,
        'exceededMemoryErrors',
      ),
      periodicPeakMemoryBytes: peakMemory,
      conservativeMemoryHeadroomBytes: 128_000_000 - peakMemory,
    },
    previewObjects: {
      requests: sum(
        account.durableObjectsInvocationsAdaptiveGroups.filter(
          (row) => row.dimensions['scriptName'] === 'twe-preview',
        ),
        'requests',
      ),
      durationGbSeconds: sum(previewPeriods, 'duration'),
      periodicPeakMemoryBytes: maximum(previewPeriods, 'memoryUsageBytes'),
      exceededCpuErrors: sum(previewPeriods, 'exceededCpuErrors'),
      exceededMemoryErrors: sum(previewPeriods, 'exceededMemoryErrors'),
    },
    accountD1: {
      rowsRead,
      rowsWritten,
      remainingDailyRowsRead: 5_000_000 - rowsRead,
      remainingDailyRowsWritten: 100_000 - rowsWritten,
    },
    inventory: {
      databases: databaseList.result.map((db) => ({
        id: db.uuid,
        name: db.name,
        reportedFileSizeBytes: db.file_size ?? null,
      })),
      namespaces: namespaceList.result,
    },
    limitations: [
      'Partial UTC day with provider sampling/lag, not traffic forecast or production p99.',
      'Periodic memory can miss transient peaks; sum all active namespaces when forecasting duration.',
      'API metric allowances do not establish plan/billing state; verify the dashboard separately.',
      'Listed database file sizes can be absent; missing sizes are not zero storage.',
    ],
  };
  await writePrivate(outputPath, report);
  console.log(
    'Read-only account quota/resource evidence written privately; no credentials or user rows were logged.',
  );
}
try {
  await main();
} catch {
  console.error(
    'Readiness audit failed. Refresh operator CLI authentication and inspect target/schema/coverage; no tokens or API payloads are logged.',
  );
  process.exitCode = 1;
}
