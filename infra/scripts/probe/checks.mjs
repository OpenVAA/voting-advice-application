/**
 * The probe's check registry. Each check has a stable name, names the one source it reads, and compares what that source
 * served with the expected values read from tracked files. `run` returns `{ pass: true }` or `{ pass: false, finding }`.
 *
 * A finding is one line of prose an operator can paste into a tracked record, so it passes `pasteSafe`: no `=`, no
 * `@`, no run of 32 or more hexadecimal digits and no secret word directly followed by `:` or `=`. A finding names a
 * number or a boolean as it is, a string in quotes when it is short, is written in a plain alphabet of letters, digits,
 * spaces and `._:/*,+-` and passes the screen, and any other value by its JSON type alone. Of a field that holds an
 * address, a user name or a credential a finding names the field and never a value. Every comparison is aware of the
 * JSON type: a string `"true"` served for the boolean `true` is a finding.
 *
 * The checks run, and their lines print, in the order of `CHECKS`. `keyModelNote` formats the key model the
 * management source reads; that note is not a check and never changes a verdict.
 *
 * This module has no side effect on import.
 */

const SECRET_WORD_LABEL =
  /(?:^|[^A-Za-z])(?:secrets?|password|passwd|pass|pwd|tokens?|keys?|credentials?|bearer|authorization)[:=]/i;

/**
 * Whether one output line may be pasted into a tracked record.
 *
 * @param line - A line the probe prints.
 */
export function pasteSafe(line) {
  return !/[=@]/.test(line) && !/[0-9A-Fa-f]{32,}/.test(line) && !SECRET_WORD_LABEL.test(line);
}

/** The JSON type of a served value, for a finding that must not print the value itself. */
function jsonType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'an array';
  if (typeof value === 'object') return 'an object';
  if (typeof value === 'string') return 'a string';
  if (typeof value === 'boolean') return 'a boolean';
  return typeof value;
}

const PLAIN_TEXT = /^[A-Za-z0-9 ._:/*,+-]{0,160}$/;

/** A value as a finding may name it. */
function show(value) {
  if (value === undefined) return 'absent';
  if (value === null || typeof value === 'boolean' || typeof value === 'number') return String(value);
  if (typeof value === 'string')
    return PLAIN_TEXT.test(value) && pasteSafe(value) ? `"${value}"` : `a string of ${value.length} characters`;
  return jsonType(value);
}

/** A value as a finding may name it, with its JSON type in front. */
function typed(value) {
  if (value === undefined || value === null) return show(value);
  if (typeof value === 'object') return jsonType(value);
  return `the ${typeof value} ${show(value)}`;
}

/** Equality of two JSON values that holds only when their JSON types agree. */
function sameJson(a, b) {
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return a === b;
  return Array.isArray(a) === Array.isArray(b) && JSON.stringify(a) === JSON.stringify(b);
}

function sameType(a, b) {
  return a === undefined || b === undefined ? a === b : jsonType(a) === jsonType(b);
}

/**
 * One served field compared with its expected value.
 *
 * @param field - The served field's name.
 * @param origin - Where the expected value is set, as the finding says it.
 * @returns `null` when the values agree, else one clause of a finding.
 */
function compare(field, served, expected, origin) {
  if (sameJson(served, expected)) return null;
  return sameType(served, expected)
    ? `${field} is ${show(served)}, expected ${show(expected)} from ${origin}`
    : `${field} is ${typed(served)}, expected ${typed(expected)} from ${origin}`;
}

/** As `compare`, for a field whose values a finding must not name. */
function compareHidden(field, served, expected, origin) {
  if (sameJson(served, expected)) return null;
  return sameType(served, expected)
    ? `${field} differs from ${origin}`
    : `${field} is ${jsonType(served)}, expected ${jsonType(expected)} from ${origin}`;
}

/** The verdict of a check from its clauses, of which each non-null one is a fault. */
function verdict(clauses) {
  const faults = clauses.filter((c) => c !== null);
  return faults.length === 0 ? { pass: true } : { pass: false, finding: faults.join('; ') };
}

const JSON_FILE = 'hosted-settings.json';

/** The served state of one hook against the root's switch and the JSON group the module sends while it is on. */
function hookCheck(switchedOn, switchName, enabledField, group, served) {
  if (!switchedOn) return verdict([compare(enabledField, served[enabledField], false, `the root's ${switchName}`)]);
  return verdict(Object.keys(group).map((key) => compare(key, served[key], group[key], JSON_FILE)));
}

/** The served redirect allow list against the exact string the module builds from the origin and the paths. */
function redirectCheck(expected, served) {
  const built = expected.redirectPaths.map((p) => `${expected.publicOrigin}${p}`);
  const want = built.join(',');
  if (served === want) return { pass: true };
  const list = 'the list the module builds from public_origin and redirect_callback_paths';
  if (typeof served !== 'string')
    return { pass: false, finding: `uri_allow_list is ${typed(served)}, expected ${list}` };
  const entries = served.split(',');
  if (entries.length !== built.length) {
    const count = `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`;
    return { pass: false, finding: `uri_allow_list holds ${count}, expected the ${built.length} of ${list}` };
  }
  const trimmed = entries.map((e) => e.trim());
  if (trimmed.join(',') === want) return { pass: false, finding: `uri_allow_list differs in spacing from ${list}` };
  if ([...trimmed].sort().join(',') === [...built].sort().join(','))
    return { pass: false, finding: `uri_allow_list holds the entries of ${list} in another order` };
  const index = built.findIndex((entry, i) => entry !== trimmed[i]);
  return {
    pass: false,
    finding: `entry ${index + 1} of uri_allow_list is ${show(trimmed[index])}, expected ${show(built[index])} from ${list}`
  };
}

/** The served SMTP settings against the root's smtp object; the sender address and name are compared unnamed. */
function smtpCheck(expected, served) {
  if (expected.smtp === null)
    return {
      pass: false,
      finding:
        "the root declares no smtp object, so the module sends no SMTP settings and the auth service's own mail has no sender"
    };
  function origin(attribute) {
    return `the root's smtp.${attribute}`;
  }
  return verdict([
    compare('smtp_host', served.smtp_host, expected.smtp.host, origin('host')),
    compare('smtp_port', served.smtp_port, expected.smtp.port, origin('port')),
    compareHidden('smtp_admin_email', served.smtp_admin_email, expected.smtp.admin_email, origin('admin_email')),
    compareHidden('smtp_sender_name', served.smtp_sender_name, expected.smtp.sender_name, origin('sender_name')),
    served.smtp_user_present === true
      ? null
      : 'smtp_user is not set, so the auth service cannot sign in to the SMTP server'
  ]);
}

/** A function slug as a finding may name it. */
function showSlug(slug) {
  return typeof slug === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(slug) ? slug : `a slug that is ${show(slug)}`;
}

/** The served functions against the directories of the repository: the same set of slugs, each one ACTIVE. */
function deployedCheck(expected, served) {
  if (!Array.isArray(served))
    return { pass: false, finding: `the functions list is ${jsonType(served)}, not an array` };
  const want = expected.functions.map((f) => f.slug);
  const servedSlugs = served.map((entry) => entry.slug);
  const missing = want.filter((slug) => !servedSlugs.includes(slug));
  const unexpected = [...new Set(servedSlugs.filter((slug) => !want.includes(slug)).map(showSlug))].sort();
  const inactive = want.flatMap((slug) => {
    const entry = served.find((e) => e.slug === slug);
    return entry === undefined || entry.status === 'ACTIVE' ? [] : [`${slug} is ${show(entry.status)}, not ACTIVE`];
  });
  return verdict([
    missing.length === 0 ? null : `not deployed: ${missing.join(', ')}`,
    unexpected.length === 0 ? null : `deployed but without a directory in the repository: ${unexpected.join(', ')}`,
    ...inactive
  ]);
}

/** The served `verify_jwt` of each function of the repository that is served, against what config.toml declares. */
function verifyJwtCheck(expected, served) {
  if (!Array.isArray(served))
    return { pass: false, finding: `the functions list is ${jsonType(served)}, not an array` };
  return verdict(
    expected.functions.map(({ slug, verifyJwt }) => {
      const entry = served.find((e) => e.slug === slug);
      return entry === undefined ? null : compare(`verify_jwt of ${slug}`, entry.verify_jwt, verifyJwt, 'config.toml');
    })
  );
}

/** The keys of the JSON `auth` group that a check of their own compares. */
const AUTH_KEYS_CHECKED_ALONE = ['disable_signup', 'mailer_autoconfirm'];

/** @type {Array<{ name: string, source: string, run: (expected: object, responses: object) => { pass: true } | { pass: false, finding: string } }>} */
export const CHECKS = [
  {
    name: 'api.max-rows',
    source: 'management',
    run(expected, responses) {
      const { json, pageSize } = expected.maxRows;
      if (json !== pageSize)
        return {
          pass: false,
          finding: `hosted-settings.json sets max_rows ${json} but staticSettings.ts sets pageSize ${pageSize}, so no served value can agree with both`
        };
      const served = responses.management.postgrest.max_rows;
      if (typeof served !== 'number')
        return {
          pass: false,
          finding: `the served max_rows is ${jsonType(served)}, not the number ${json} that hosted-settings.json and pageSize give`
        };
      if (served !== json)
        return {
          pass: false,
          finding: `the served max_rows is ${served}, not the ${json} that hosted-settings.json and pageSize give`
        };
      return { pass: true };
    }
  },
  {
    name: 'auth.access-token-hook',
    source: 'management',
    run(expected, responses) {
      return hookCheck(
        expected.hooks.accessToken,
        'enable_access_token_hook',
        'hook_custom_access_token_enabled',
        expected.authHook,
        responses.management.auth
      );
    }
  },
  {
    name: 'auth.send-email-hook',
    source: 'management',
    run(expected, responses) {
      return hookCheck(
        expected.hooks.sendEmail,
        'enable_send_email_hook',
        'hook_send_email_enabled',
        expected.authSendEmailHook,
        responses.management.auth
      );
    }
  },
  {
    name: 'auth.site-url',
    source: 'management',
    run(expected, responses) {
      return verdict([
        compare('site_url', responses.management.auth.site_url, expected.publicOrigin, "the root's public_origin")
      ]);
    }
  },
  {
    name: 'auth.redirects',
    source: 'management',
    run(expected, responses) {
      return redirectCheck(expected, responses.management.auth.uri_allow_list);
    }
  },
  {
    name: 'auth.signup-closed',
    source: 'management',
    run(expected, responses) {
      const served = responses.management.auth.disable_signup;
      return verdict([compare('disable_signup', served, expected.auth.disable_signup, JSON_FILE)]);
    }
  },
  {
    name: 'auth.email-confirm',
    source: 'management',
    run(expected, responses) {
      const served = responses.management.auth.mailer_autoconfirm;
      return verdict([compare('mailer_autoconfirm', served, expected.auth.mailer_autoconfirm, JSON_FILE)]);
    }
  },
  {
    name: 'auth.smtp',
    source: 'management',
    run(expected, responses) {
      return smtpCheck(expected, responses.management.auth);
    }
  },
  {
    name: 'auth.oauth-server',
    source: 'management',
    run(expected, responses) {
      const served = responses.management.auth;
      function origin(key) {
        return `config.toml [auth.oauth_server] ${key}`;
      }
      return verdict([
        compare('oauth_server_enabled', served.oauth_server_enabled, expected.oauthServer.enabled, origin('enabled')),
        compare(
          'oauth_server_allow_dynamic_registration',
          served.oauth_server_allow_dynamic_registration,
          expected.oauthServer.allow_dynamic_registration,
          origin('allow_dynamic_registration')
        )
      ]);
    }
  },
  {
    name: 'auth.other-settings',
    source: 'management',
    run(expected, responses) {
      const served = responses.management.auth;
      return verdict(
        Object.keys(expected.auth)
          .filter((key) => !AUTH_KEYS_CHECKED_ALONE.includes(key))
          .map((key) => compare(key, served[key], expected.auth[key], JSON_FILE))
      );
    }
  },
  {
    name: 'api.schemas',
    source: 'management',
    run(expected, responses) {
      const served = responses.management.postgrest;
      return verdict(
        ['db_schema', 'db_extra_search_path'].map((key) => compare(key, served[key], expected.api[key], JSON_FILE))
      );
    }
  },
  {
    name: 'functions.deployed',
    source: 'management',
    run(expected, responses) {
      return deployedCheck(expected, responses.management.functions);
    }
  },
  {
    name: 'functions.verify-jwt',
    source: 'management',
    run(expected, responses) {
      return verifyJwtCheck(expected, responses.management.functions);
    }
  }
];

/** A key's type or name as the note names it, in a plain alphabet. */
function plainLabel(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_.-]{1,64}$/.test(value) ? value : '(unnamed)';
}

/** An issued key as the note names it: its type and its name. */
function keyLabel({ type, name }) {
  return `${plainLabel(type)}/${plainLabel(name)}`;
}

const NOTE_WITHHELD = 'NOTE key-model: withheld because it fails the paste screen';

/**
 * The one line that reports the key model, printed after the check lines.
 *
 * @param keys - The key model the management source read: `{ issued, issuedError?, legacy, legacyError? }`.
 * @returns `NOTE key-model: issued <type/name, ...>; legacy keys <enabled|disabled|endpoint gone>`, with `not read
 *   (<reason>)` in place of a part whose read failed. A line that fails `pasteSafe` is replaced by a fixed line.
 */
export function keyModelNote(keys) {
  const issued =
    keys.issued === null
      ? `issued not read (${keys.issuedError})`
      : `issued ${keys.issued.length === 0 ? 'none' : keys.issued.map(keyLabel).sort().join(', ')}`;
  const legacy =
    keys.legacy === null
      ? `legacy keys not read (${keys.legacyError})`
      : `legacy keys ${keys.legacy === 'gone' ? 'endpoint gone' : keys.legacy}`;
  const line = `NOTE key-model: ${issued}; ${legacy}`;
  return pasteSafe(line) ? line : NOTE_WITHHELD;
}

const WITHHELD = 'the finding was withheld because it fails the paste screen';

/**
 * Runs every registered check.
 *
 * @returns `[{ name, pass, finding }]` in registry order; `finding` is `null` for a check that passes. A finding that
 *   does not pass `pasteSafe` is replaced by a fixed line that does.
 */
export function runChecks(expected, responses) {
  return CHECKS.map(({ name, run }) => {
    const result = run(expected, responses);
    if (result.pass) return { name, pass: true, finding: null };
    const finding = typeof result.finding === 'string' && pasteSafe(result.finding) ? result.finding : WITHHELD;
    return { name, pass: false, finding };
  });
}
