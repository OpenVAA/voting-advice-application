/**
 * Specification for the analytics configuration resolver: the defaults with nothing set, normalisation, each vocabulary, the PostHog key and host, the fail-safe to provider `none` on any problem, the projection, and the start-up rule that names variables and never a key.
 *
 * @vitest-environment node
 */

import { describe, expect, it } from 'vitest';
import { analyticsStartupProblems, DEFAULT_POSTHOG_HOST, resolveAnalyticsConfig, toProjection } from './config';

/** A key value planted to prove it never reaches a problem or a start-up line. */
const PLANTED_KEY = 'phc_planted_zz9';

describe('resolveAnalyticsConfig', () => {
  it('resolves an empty environment to provider `none`, the gated consent mode and the memory visit-id mode', () => {
    expect(resolveAnalyticsConfig({})).toEqual({
      config: { provider: 'none', consentMode: 'gated', visitIdMode: 'memory' },
      problems: []
    });
  });

  it('normalises case and surrounding whitespace before the vocabulary check', () => {
    expect(resolveAnalyticsConfig({ ANALYTICS_PROVIDER: '  LOG  ' })).toEqual({
      config: { provider: 'log', consentMode: 'gated', visitIdMode: 'memory' },
      problems: []
    });
  });

  it('treats a whitespace-only value as unset', () => {
    expect(
      resolveAnalyticsConfig({ ANALYTICS_PROVIDER: '   ', ANALYTICS_CONSENT_MODE: ' ', ANALYTICS_VISIT_ID_MODE: '\t' })
    ).toEqual({
      config: { provider: 'none', consentMode: 'gated', visitIdMode: 'memory' },
      problems: []
    });
  });

  it('reports a provider outside the vocabulary and resolves to `none`', () => {
    expect(resolveAnalyticsConfig({ ANALYTICS_PROVIDER: 'umbrella' })).toEqual({
      config: { provider: 'none', consentMode: 'gated', visitIdMode: 'memory' },
      problems: [{ variable: 'ANALYTICS_PROVIDER', reason: 'invalid', provided: 'umbrella' }]
    });
  });

  it('reports `posthog` with no key as a missing key, without a provided value, and resolves to `none`', () => {
    expect(resolveAnalyticsConfig({ ANALYTICS_PROVIDER: 'posthog' })).toEqual({
      config: { provider: 'none', consentMode: 'gated', visitIdMode: 'memory' },
      problems: [{ variable: 'ANALYTICS_POSTHOG_KEY', reason: 'missing' }]
    });
  });

  it('resolves `posthog` with a key and no host to the default host', () => {
    expect(resolveAnalyticsConfig({ ANALYTICS_PROVIDER: 'posthog', ANALYTICS_POSTHOG_KEY: PLANTED_KEY })).toEqual({
      config: {
        provider: 'posthog',
        consentMode: 'gated',
        visitIdMode: 'memory',
        posthog: { host: DEFAULT_POSTHOG_HOST, key: PLANTED_KEY }
      },
      problems: []
    });
    expect(DEFAULT_POSTHOG_HOST).toBe('https://eu.i.posthog.com');
  });

  it('reduces an `https:` host to its origin, so a path or trailing slash cannot change the destination', () => {
    expect(
      resolveAnalyticsConfig({
        ANALYTICS_PROVIDER: 'posthog',
        ANALYTICS_POSTHOG_KEY: ` ${PLANTED_KEY} `,
        ANALYTICS_POSTHOG_HOST: ' https://PostHog.Example.org:8443/ingest/path/?q=1#x '
      })
    ).toEqual({
      config: {
        provider: 'posthog',
        consentMode: 'gated',
        visitIdMode: 'memory',
        posthog: { host: 'https://posthog.example.org:8443', key: PLANTED_KEY }
      },
      problems: []
    });
  });

  it('accepts an `http:` host on `localhost` and on `127.0.0.1`', () => {
    for (const [raw, origin] of [
      ['http://localhost:8010/', 'http://localhost:8010'],
      ['http://127.0.0.1:8010/capture', 'http://127.0.0.1:8010']
    ]) {
      expect(
        resolveAnalyticsConfig({
          ANALYTICS_PROVIDER: 'posthog',
          ANALYTICS_POSTHOG_KEY: PLANTED_KEY,
          ANALYTICS_POSTHOG_HOST: raw
        })
      ).toEqual({
        config: {
          provider: 'posthog',
          consentMode: 'gated',
          visitIdMode: 'memory',
          posthog: { host: origin, key: PLANTED_KEY }
        },
        problems: []
      });
    }
  });

  it('reports a host that is not `https:` or loopback `http:` as invalid, without a provided value, and resolves to `none`', () => {
    for (const host of [
      'http://eu.i.posthog.com',
      'ftp://eu.i.posthog.com',
      'not a url',
      'eu.i.posthog.com',
      'http://10.0.0.1'
    ]) {
      expect(
        resolveAnalyticsConfig({
          ANALYTICS_PROVIDER: 'posthog',
          ANALYTICS_POSTHOG_KEY: PLANTED_KEY,
          ANALYTICS_POSTHOG_HOST: host
        })
      ).toEqual({
        config: { provider: 'none', consentMode: 'gated', visitIdMode: 'memory' },
        problems: [{ variable: 'ANALYTICS_POSTHOG_HOST', reason: 'invalid' }]
      });
    }
  });

  it('resolves the non-default consent and visit-id modes', () => {
    expect(
      resolveAnalyticsConfig({
        ANALYTICS_PROVIDER: 'log',
        ANALYTICS_CONSENT_MODE: 'FREE',
        ANALYTICS_VISIT_ID_MODE: 'none'
      })
    ).toEqual({
      config: { provider: 'log', consentMode: 'free', visitIdMode: 'none' },
      problems: []
    });
  });

  it('reports a consent mode outside its vocabulary and resolves the provider to `none`', () => {
    expect(resolveAnalyticsConfig({ ANALYTICS_PROVIDER: 'log', ANALYTICS_CONSENT_MODE: 'always' })).toEqual({
      config: { provider: 'none', consentMode: 'gated', visitIdMode: 'memory' },
      problems: [{ variable: 'ANALYTICS_CONSENT_MODE', reason: 'invalid', provided: 'always' }]
    });
  });

  it('reports a visit-id mode outside its vocabulary and resolves the provider to `none`, keeping the valid consent mode', () => {
    expect(
      resolveAnalyticsConfig({
        ANALYTICS_PROVIDER: 'log',
        ANALYTICS_CONSENT_MODE: 'free',
        ANALYTICS_VISIT_ID_MODE: 'cookie'
      })
    ).toEqual({
      config: { provider: 'none', consentMode: 'free', visitIdMode: 'memory' },
      problems: [{ variable: 'ANALYTICS_VISIT_ID_MODE', reason: 'invalid', provided: 'cookie' }]
    });
  });

  it('ignores the PostHog variables for providers `log` and `none`', () => {
    for (const provider of ['log', 'none'] as const) {
      expect(
        resolveAnalyticsConfig({
          ANALYTICS_PROVIDER: provider,
          ANALYTICS_POSTHOG_KEY: '',
          ANALYTICS_POSTHOG_HOST: 'not a url'
        })
      ).toEqual({
        config: { provider, consentMode: 'gated', visitIdMode: 'memory' },
        problems: []
      });
    }
  });

  it('never throws and resolves to defaults for a non-string value', () => {
    const hostile: ReadonlyArray<unknown> = [null, 0, true, {}, [], () => 'log'];
    for (const value of hostile) {
      const env = { ANALYTICS_PROVIDER: value, ANALYTICS_CONSENT_MODE: value } as unknown as Record<
        string,
        string | undefined
      >;
      expect(resolveAnalyticsConfig(env)).toEqual({
        config: { provider: 'none', consentMode: 'gated', visitIdMode: 'memory' },
        problems: []
      });
    }
  });

  it('never puts the key into a problem', () => {
    const { problems } = resolveAnalyticsConfig({
      ANALYTICS_PROVIDER: 'posthog',
      ANALYTICS_POSTHOG_KEY: PLANTED_KEY,
      ANALYTICS_POSTHOG_HOST: `https://${PLANTED_KEY}@:bad`
    });
    expect(problems).toEqual([{ variable: 'ANALYTICS_POSTHOG_HOST', reason: 'invalid' }]);
    expect(JSON.stringify(problems)).not.toContain(PLANTED_KEY);
  });
});

describe('toProjection', () => {
  it('projects exactly three members, inactive only for provider `none`', () => {
    expect(toProjection({ provider: 'none', consentMode: 'gated', visitIdMode: 'memory' })).toEqual({
      active: false,
      consentMode: 'gated',
      visitIdMode: 'memory'
    });
    expect(toProjection({ provider: 'log', consentMode: 'free', visitIdMode: 'none' })).toEqual({
      active: true,
      consentMode: 'free',
      visitIdMode: 'none'
    });
    expect(
      toProjection({
        provider: 'posthog',
        consentMode: 'gated',
        visitIdMode: 'memory',
        posthog: { host: DEFAULT_POSTHOG_HOST, key: PLANTED_KEY }
      })
    ).toEqual({ active: true, consentMode: 'gated', visitIdMode: 'memory' });
  });

  it('carries neither the provider nor the key', () => {
    const projection = toProjection({
      provider: 'posthog',
      consentMode: 'gated',
      visitIdMode: 'memory',
      posthog: { host: DEFAULT_POSTHOG_HOST, key: PLANTED_KEY }
    });
    expect(Object.keys(projection).sort()).toEqual(['active', 'consentMode', 'visitIdMode']);
    expect(JSON.stringify(projection)).not.toContain('posthog');
    expect(JSON.stringify(projection)).not.toContain(PLANTED_KEY);
  });
});

describe('analyticsStartupProblems', () => {
  it('returns nothing for a clean environment', () => {
    expect(analyticsStartupProblems({})).toEqual([]);
  });

  it('names the missing key for `posthog` with no key', () => {
    expect(analyticsStartupProblems({ ANALYTICS_PROVIDER: 'posthog' })).toEqual(['ANALYTICS_POSTHOG_KEY']);
  });

  it('names each variable with a problem once, in resolution order', () => {
    expect(
      analyticsStartupProblems({
        ANALYTICS_PROVIDER: 'posthog',
        ANALYTICS_CONSENT_MODE: 'sometimes',
        ANALYTICS_VISIT_ID_MODE: 'cookie',
        ANALYTICS_POSTHOG_HOST: 'http://example.org'
      })
    ).toEqual(['ANALYTICS_CONSENT_MODE', 'ANALYTICS_VISIT_ID_MODE', 'ANALYTICS_POSTHOG_KEY', 'ANALYTICS_POSTHOG_HOST']);
  });

  it('returns no string that holds the key value', () => {
    const lines = analyticsStartupProblems({
      ANALYTICS_PROVIDER: 'posthog',
      ANALYTICS_POSTHOG_KEY: PLANTED_KEY,
      ANALYTICS_POSTHOG_HOST: `http://${PLANTED_KEY}.example.org`
    });
    expect(lines).toEqual(['ANALYTICS_POSTHOG_HOST']);
    for (const line of lines) expect(line).not.toContain(PLANTED_KEY);
  });
});
