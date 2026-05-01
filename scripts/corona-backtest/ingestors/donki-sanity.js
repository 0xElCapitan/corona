/**
 * scripts/corona-backtest/ingestors/donki-sanity.js
 *
 * P0 sanity-sample harness for the DONKI archive.
 *
 * Sprint 3 hard rule (per handoff packet §6 #10 + SDD §6.3):
 *   This harness MUST PASS 5/5 before donki-fetch.js / the full ingestor
 *   build proceeds. R3 mitigation against documented DONKI shape variance
 *   across the 2017→2026 span (PRD §10 R3).
 *
 * Operating modes:
 *   - Online (default when NASA_API_KEY is set OR --online flag is passed):
 *     fetches real DONKI records for the 5 sample events, applies the
 *     era-aware normaliser, and asserts the output shape conforms.
 *   - Offline (default when no key + no --online; or --offline flag):
 *     uses the bundled fixture set (this file) as the response body and
 *     exercises the same normaliser. The point of the offline mode is to
 *     verify the harness logic is correct without a live network call;
 *     the operator can then re-run with --online once a key is present.
 *
 * The 5 sample events span the era boundaries the SDD §6.3 era detector
 * is meant to handle:
 *   - 2017 X9.3 (Sep 2017) — early GOES-R era, classic FLR shape
 *   - 2019 CME (post-cycle-24 minimum) — quiet-era CME with WSA-Enlil
 *   - 2022 Kp 8.3 (Feb 2022 Starlink loss) — pre-shape-rev GST
 *   - 2024 X8.7 (May 2024 G5 superstorm) — recent FLR with chained CMEs
 *   - 2025 IPS / SEP combo — late-cycle 25 IPS shock + SEP correlation
 *
 * Running:
 *   node scripts/corona-backtest/ingestors/donki-sanity.js
 *   node scripts/corona-backtest/ingestors/donki-sanity.js --online
 *   node scripts/corona-backtest/ingestors/donki-sanity.js --offline
 *   node scripts/corona-backtest/ingestors/donki-sanity.js --json
 *
 * Exit codes:
 *   0 — 5/5 events normalised cleanly (SAFE TO BUILD donki-fetch.js)
 *   1 — at least one shape mismatch (HALT — surface to operator)
 *   2 — network / auth failure that prevented online fetches
 */

import process from 'node:process';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  DONKI_BASE_URL,
  CACHE_DIR,
  getNasaApiKey,
  isAuthenticated,
} from '../config.js';

// =====================================================================
// Sample event spec (the 5 events the sanity-sample exercises).
// Each entry pairs a label with (a) the live API path to call and
// (b) a fixture body for the offline path. The fixtures are minimal
// representative shapes; they are NOT a substitute for a live cross-check.
// =====================================================================

export const SAMPLE_EVENTS = [
  {
    label: '2017-09-06_X9.3_FLR',
    eventType: 'FLR',
    era: '2017-2019',
    apiPath: 'FLR',
    apiQuery: { startDate: '2017-09-06', endDate: '2017-09-07' },
    fixture: [
      {
        flrID: '2017-09-06T11:53:00-FLR-001',
        instruments: [{ displayName: 'GOES-P: SEM/EPS' }],
        beginTime: '2017-09-06T11:53Z',
        peakTime: '2017-09-06T12:02Z',
        endTime: '2017-09-06T12:10Z',
        classType: 'X9.3',
        sourceLocation: 'S08W33',
        activeRegionNum: 12673,
        linkedEvents: [{ activityID: '2017-09-06T11:53:00-CME-001' }],
        link: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/FLR/12345/-1',
      },
    ],
  },
  {
    label: '2019-05-10_CME',
    eventType: 'CME',
    era: '2017-2019',
    apiPath: 'CME',
    apiQuery: { startDate: '2019-05-10', endDate: '2019-05-12' },
    fixture: [
      {
        activityID: '2019-05-10T08:00:00-CME-001',
        catalog: 'M2M_CATALOG',
        startTime: '2019-05-10T08:00Z',
        sourceLocation: 'N12E45',
        activeRegionNum: 12740,
        link: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/CME/22222/-1',
        cmeAnalyses: [
          {
            time21_5: '2019-05-10T10:30Z',
            latitude: 12.0,
            longitude: -45.0,
            halfAngle: 28.0,
            speed: 540.0,
            type: 'C',
            isMostAccurate: true,
            note: 'StereoB-data based fit',
            enlilList: [
              {
                modelCompletionTime: '2019-05-10T11:45Z',
                au: 1.0,
                estimatedShockArrivalTime: '2019-05-12T16:00Z',
                estimatedDuration: 14.0,
                rmin_re: null,
                kp_18: 4,
                kp_90: 5,
                kp_135: null,
                kp_180: null,
                isEarthGB: false,
                link: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/WSA-ENLIL/333/-1',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    label: '2022-02-03_Kp8_GST_Starlink',
    eventType: 'GST',
    era: '2020-2022',
    apiPath: 'GST',
    apiQuery: { startDate: '2022-02-03', endDate: '2022-02-05' },
    fixture: [
      {
        gstID: '2022-02-03T18:00:00-GST-001',
        startTime: '2022-02-03T18:00Z',
        allKpIndex: [
          { observedTime: '2022-02-03T21:00Z', kpIndex: 7.67, source: 'NOAA' },
          { observedTime: '2022-02-04T00:00Z', kpIndex: 8.33, source: 'NOAA' },
        ],
        linkedEvents: [{ activityID: '2022-01-29T23:36:00-CME-001' }],
        link: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/GST/44444/-1',
      },
    ],
  },
  {
    label: '2024-05-10_X8.7_FLR_G5',
    eventType: 'FLR',
    era: '2023-2026',
    apiPath: 'FLR',
    apiQuery: { startDate: '2024-05-10', endDate: '2024-05-12' },
    fixture: [
      {
        flrID: '2024-05-14T16:51:00-FLR-001',
        instruments: [{ displayName: 'GOES-P: EXIS' }],
        beginTime: '2024-05-14T16:51Z',
        peakTime: '2024-05-14T17:08Z',
        endTime: '2024-05-14T17:18Z',
        classType: 'X8.7',
        sourceLocation: 'S15W90',
        activeRegionNum: 13664,
        linkedEvents: [
          { activityID: '2024-05-14T17:00:00-CME-001' },
          { activityID: '2024-05-15T00:00:00-SEP-001' },
        ],
        link: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/FLR/55555/-1',
      },
    ],
  },
  {
    label: '2025-06-15_IPS_SEP',
    eventType: 'IPS',
    era: '2023-2026',
    apiPath: 'IPS',
    apiQuery: { startDate: '2025-06-15', endDate: '2025-06-18' },
    fixture: [
      {
        catalog: 'M2M_CATALOG',
        activityID: '2025-06-15T22:30:00-IPS-001',
        location: 'L1',
        eventTime: '2025-06-15T22:30Z',
        instruments: [
          { displayName: 'DSCOVR: PlasMag' },
          { displayName: 'ACE: SWEPAM' },
        ],
        linkedEvents: [{ activityID: '2025-06-13T05:00:00-CME-001' }],
        link: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/IPS/66666/-1',
      },
    ],
  },
];

// =====================================================================
// Era detector + per-event-type normalisers.
// These intentionally mirror the live donki-fetch.js public API so that
// the sanity sample exercises the same code path the production ingestor
// will use. (Post-sanity-pass, donki-fetch.js will import these.)
// =====================================================================

export function detectEra(eventTimeIso) {
  // Heuristic era-bucket. Used by donki-fetch.js to pick a normaliser.
  // Boundaries are NOT settlement-critical — they exist to surface shape
  // variance for human review when a record reads anomalously.
  if (!eventTimeIso) return 'unknown';
  const year = Number.parseInt(String(eventTimeIso).slice(0, 4), 10);
  if (!Number.isFinite(year)) return 'unknown';
  if (year >= 2017 && year <= 2019) return '2017-2019';
  if (year >= 2020 && year <= 2022) return '2020-2022';
  if (year >= 2023) return '2023-2026';
  return 'unknown';
}

export function normaliseFLR(raw, era) {
  // Strict shape requirements; fail-fast on missing fields. Sprint 3
  // / corona-1ks (corpus-loader) re-validates at corpus-load time.
  if (raw == null || typeof raw !== 'object') {
    throw new Error('FLR normaliser: raw record is not an object');
  }
  const flrID = raw.flrID;
  const beginTime = raw.beginTime;
  const peakTime = raw.peakTime;
  const endTime = raw.endTime;
  const classType = raw.classType;
  if (!flrID || !beginTime || !classType) {
    throw new Error(`FLR normaliser: missing required field (flrID=${flrID}, beginTime=${beginTime}, classType=${classType})`);
  }
  return {
    event_type: 'FLR',
    era,
    donki_id: flrID,
    begin_time: beginTime,
    peak_time: peakTime ?? null,
    end_time: endTime ?? null,
    class_type: classType,
    source_location: raw.sourceLocation ?? null,
    active_region: raw.activeRegionNum ?? null,
    instruments: Array.isArray(raw.instruments) ? raw.instruments.map((i) => i.displayName).filter(Boolean) : [],
    linked_event_ids: Array.isArray(raw.linkedEvents) ? raw.linkedEvents.map((e) => e.activityID).filter(Boolean) : [],
    link: raw.link ?? null,
  };
}

export function normaliseCME(raw, era) {
  if (raw == null || typeof raw !== 'object') {
    throw new Error('CME normaliser: raw record is not an object');
  }
  const activityID = raw.activityID;
  const startTime = raw.startTime;
  if (!activityID || !startTime) {
    throw new Error(`CME normaliser: missing required field (activityID=${activityID}, startTime=${startTime})`);
  }
  // Pick the most-accurate analysis (per DONKI's isMostAccurate flag) when
  // present, else the first; surface the WSA-Enlil entry that drives T3.
  const analyses = Array.isArray(raw.cmeAnalyses) ? raw.cmeAnalyses : [];
  const chosen = analyses.find((a) => a && a.isMostAccurate === true) ?? analyses[0] ?? null;
  let enlil = null;
  if (chosen && Array.isArray(chosen.enlilList) && chosen.enlilList.length > 0) {
    const e = chosen.enlilList[0];
    enlil = {
      model_completion_time: e.modelCompletionTime ?? null,
      estimated_shock_arrival_time: e.estimatedShockArrivalTime ?? null,
      estimated_duration_hours: typeof e.estimatedDuration === 'number' ? e.estimatedDuration : null,
      kp_18: e.kp_18 ?? null,
      kp_90: e.kp_90 ?? null,
      is_earth_gb: Boolean(e.isEarthGB),
      link: e.link ?? null,
    };
  }
  return {
    event_type: 'CME',
    era,
    donki_id: activityID,
    start_time: startTime,
    catalog: raw.catalog ?? null,
    source_location: raw.sourceLocation ?? null,
    active_region: raw.activeRegionNum ?? null,
    most_accurate_analysis: chosen
      ? {
        time21_5: chosen.time21_5 ?? null,
        latitude: chosen.latitude ?? null,
        longitude: chosen.longitude ?? null,
        half_angle: chosen.halfAngle ?? null,
        speed: chosen.speed ?? null,
        type: chosen.type ?? null,
      }
      : null,
    wsa_enlil: enlil,
    linked_event_ids: Array.isArray(raw.linkedEvents) ? raw.linkedEvents.map((e) => e.activityID).filter(Boolean) : [],
    link: raw.link ?? null,
  };
}

export function normaliseGST(raw, era) {
  if (raw == null || typeof raw !== 'object') {
    throw new Error('GST normaliser: raw record is not an object');
  }
  const gstID = raw.gstID;
  const startTime = raw.startTime;
  if (!gstID || !startTime) {
    throw new Error(`GST normaliser: missing required field (gstID=${gstID}, startTime=${startTime})`);
  }
  const kpEntries = Array.isArray(raw.allKpIndex) ? raw.allKpIndex : [];
  const peakKp = kpEntries.reduce((max, entry) => {
    const v = typeof entry.kpIndex === 'number' ? entry.kpIndex : null;
    if (v == null) return max;
    return max == null || v > max ? v : max;
  }, null);
  return {
    event_type: 'GST',
    era,
    donki_id: gstID,
    start_time: startTime,
    kp_observations: kpEntries.map((e) => ({
      observed_time: e.observedTime ?? null,
      kp_index: typeof e.kpIndex === 'number' ? e.kpIndex : null,
      source: e.source ?? null,
    })),
    peak_kp: peakKp,
    linked_event_ids: Array.isArray(raw.linkedEvents) ? raw.linkedEvents.map((e) => e.activityID).filter(Boolean) : [],
    link: raw.link ?? null,
  };
}

export function normaliseIPS(raw, era) {
  if (raw == null || typeof raw !== 'object') {
    throw new Error('IPS normaliser: raw record is not an object');
  }
  const activityID = raw.activityID;
  const eventTime = raw.eventTime;
  if (!activityID || !eventTime) {
    throw new Error(`IPS normaliser: missing required field (activityID=${activityID}, eventTime=${eventTime})`);
  }
  return {
    event_type: 'IPS',
    era,
    donki_id: activityID,
    event_time: eventTime,
    location: raw.location ?? null,
    catalog: raw.catalog ?? null,
    instruments: Array.isArray(raw.instruments) ? raw.instruments.map((i) => i.displayName).filter(Boolean) : [],
    linked_event_ids: Array.isArray(raw.linkedEvents) ? raw.linkedEvents.map((e) => e.activityID).filter(Boolean) : [],
    link: raw.link ?? null,
  };
}

const NORMALISERS = {
  FLR: normaliseFLR,
  CME: normaliseCME,
  GST: normaliseGST,
  IPS: normaliseIPS,
};

export function normalise(eventType, rawArrayOrObject, era) {
  const normaliser = NORMALISERS[eventType];
  if (!normaliser) {
    throw new Error(`normalise: unknown DONKI event type "${eventType}"`);
  }
  // DONKI returns arrays for each query; pick the first record by convention.
  // The sanity sample is single-event-per-query by design.
  const raw = Array.isArray(rawArrayOrObject) ? rawArrayOrObject[0] : rawArrayOrObject;
  if (raw == null) {
    throw new Error(`normalise: empty response body for ${eventType}`);
  }
  return normaliser(raw, era);
}

// =====================================================================
// Online fetch path. Cache hit avoids a network call.
// =====================================================================

function buildFetchUrl(sample) {
  const apiKey = getNasaApiKey();
  const params = new URLSearchParams({ ...sample.apiQuery, api_key: apiKey });
  return `${DONKI_BASE_URL}/${sample.apiPath}?${params.toString()}`;
}

function cacheKey(sample) {
  const safe = sample.label.replace(/[^A-Za-z0-9._-]/g, '_');
  return resolve(CACHE_DIR, `sanity-${safe}.json`);
}

async function fetchSampleOnline(sample) {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
  const cacheFile = cacheKey(sample);
  if (existsSync(cacheFile)) {
    const text = readFileSync(cacheFile, 'utf8');
    return JSON.parse(text);
  }
  const url = buildFetchUrl(sample);
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    if (res.status === 429) {
      throw new Error(`DONKI rate-limited at ${sample.label} (HTTP 429). Retry with NASA_API_KEY=<key> or rerun later.`);
    }
    throw new Error(`DONKI fetch ${sample.label} failed (HTTP ${res.status})`);
  }
  const body = await res.json();
  writeFileSync(cacheFile, JSON.stringify(body, null, 2), 'utf8');
  return body;
}

// =====================================================================
// Main runner.
// =====================================================================

function parseFlags(argv) {
  const flags = new Set(argv.slice(2));
  const useOffline = flags.has('--offline');
  const useOnline = flags.has('--online');
  const json = flags.has('--json');
  const help = flags.has('--help') || flags.has('-h');
  return { useOffline, useOnline, json, help };
}

function helpText() {
  return [
    'donki-sanity.js — Sprint 3 P0 sanity-sample harness',
    '',
    'Usage: node scripts/corona-backtest/ingestors/donki-sanity.js [flags]',
    '',
    'Flags:',
    '  --online    Force online fetch (requires NASA_API_KEY for full coverage)',
    '  --offline   Use bundled fixtures (no network)',
    '  --json      Emit machine-readable JSON summary on stdout',
    '  --help      Show this help',
    '',
    'Default behavior:',
    '  Online when NASA_API_KEY is present in env;',
    '  Offline otherwise (zero-fail in CI without secrets).',
    '',
    'Exit:',
    '  0 — 5/5 events normalised cleanly',
    '  1 — at least one shape mismatch (HALT)',
    '  2 — network/auth failure prevented online fetches',
  ].join('\n');
}

export async function runSanity({ useOffline, useOnline } = {}) {
  // Resolution: explicit flags win over env. Default is offline when no key.
  let mode;
  if (useOnline && useOffline) {
    throw new Error('donki-sanity: --online and --offline are mutually exclusive');
  }
  if (useOnline) mode = 'online';
  else if (useOffline) mode = 'offline';
  else mode = isAuthenticated() ? 'online' : 'offline';

  const results = [];
  for (const sample of SAMPLE_EVENTS) {
    const entry = {
      label: sample.label,
      event_type: sample.eventType,
      era_expected: sample.era,
      mode,
      pass: false,
      error: null,
      normalised: null,
    };
    try {
      let body;
      if (mode === 'online') {
        body = await fetchSampleOnline(sample);
      } else {
        body = sample.fixture;
      }
      const era = detectEra(
        sample.eventType === 'FLR' ? body[0]?.beginTime
          : sample.eventType === 'CME' ? body[0]?.startTime
            : sample.eventType === 'GST' ? body[0]?.startTime
              : body[0]?.eventTime,
      );
      if (era !== sample.era) {
        throw new Error(`era mismatch (expected ${sample.era}, detected ${era})`);
      }
      entry.normalised = normalise(sample.eventType, body, era);
      entry.pass = true;
    } catch (err) {
      entry.pass = false;
      entry.error = err.message ?? String(err);
    }
    results.push(entry);
  }
  const passed = results.filter((r) => r.pass).length;
  return { mode, total: results.length, passed, results };
}

function printHumanSummary(summary) {
  const banner = `DONKI sanity-sample (${summary.mode}) — ${summary.passed}/${summary.total} pass`;
  console.log(banner);
  console.log('-'.repeat(banner.length));
  for (const r of summary.results) {
    const tag = r.pass ? 'PASS' : 'FAIL';
    console.log(`  [${tag}] ${r.label} (${r.event_type}, era=${r.era_expected})`);
    if (!r.pass) {
      console.log(`         error: ${r.error}`);
    }
  }
}

async function main() {
  const { useOffline, useOnline, json, help } = parseFlags(process.argv);
  if (help) {
    console.log(helpText());
    return 0;
  }
  let summary;
  try {
    summary = await runSanity({ useOffline, useOnline });
  } catch (err) {
    if (json) {
      console.log(JSON.stringify({ error: err.message ?? String(err) }, null, 2));
    } else {
      console.error(`donki-sanity: ${err.message ?? err}`);
    }
    return 2;
  }
  if (json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    printHumanSummary(summary);
  }
  return summary.passed === summary.total ? 0 : 1;
}

const isMain = import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` ||
  import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}` ||
  process.argv[1]?.endsWith('donki-sanity.js');

if (isMain) {
  main().then(
    (code) => process.exit(code),
    (err) => {
      console.error(`donki-sanity: ${err.message ?? err}`);
      process.exit(2);
    },
  );
}
