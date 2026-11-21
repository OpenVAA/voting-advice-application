#!/usr/bin/env node
// 174.1-read.mjs — the read session of Phase 174.1, and its verdict.
//
// Usage:
//   node 174.1-read.mjs session --label <name> [--plan gate|views] [--port <number>] [--project-id <uuid>]
//   node 174.1-read.mjs judge <label>
//
// Never in the foreground: start `session` in the background and poll its marker, as the plan's <long_gates> block says.
//
// A session follows one of two plans. `gate`, the default, is described first; `views` is described after it, by what
// differs. session.json names the plan, and `judge` judges a session by the plan it names (a session.json that names
// none is a `gate` session).
//
//   session   three reads of the fixed tree in headless Chromium, on a dev server the session starts and stops itself.
//             Output lands in tests/e2e-runs/174.1-reads/<label>/ (gitignored): head, started, devserver.log, one log
//             per project step, geometry.json, focus-root.json, focus-entity.json, session.json and, last, ended.
//             Refusals (exit 2, before anything is started): a working tree with uncommitted changes outside
//             .planning/ other than the operator's untracked CAND-APP-PLAN.md; a label directory that already holds
//             a `head` file; a listener on the port.
//             Steps, in order, each with its status and duration in session.json. A step that fails ends the steps
//             and the later ones are recorded as not run:
//               data-setup-base    the suite's setup project, with --no-deps
//               auth-setup         the suite's setup project, with --no-deps
//               geometry           the view at 1280px with and without the wrap class (en, fi); every served locale
//                                  at 320, 390, 640, 740 and 1280px; the pre-registration nesting, a reconstruction
//               focus-root         the pending user accepts at the app root and is redirected
//               auth-setup-again   registers the pending user anew, without an acceptance
//               focus-entity       the pending user accepts at an entity URL, with no navigation
//             The Playwright invocations are a harness for the reads: they run setup and teardown projects only, and
//             nothing about the suite is concluded from them.
//             The teardown runs on every path out of the session once the server process was started — a server that
//             never listened, a failed step, the session's ceiling, an interrupt or a termination signal — from one
//             `finally` block and the two signal handlers: the project data-teardown-base when the port is listening;
//             the end of the server's whole process group and a bounded wait for a free port; the host's Sleep
//             entries inside the session's window; then session.json and `ended`.
//             A Sleep entry inside the window makes the session VOID (VOID-host-sleep.txt): it is made again under
//             the next -rN suffix of the same label. Nothing else voids it.
//   judge     resolves <label> as `resolveRun` in 174-verdict.mjs resolves it: to tests/e2e-runs/174.1-reads/<label>,
//             or to its newest re-run <label>-rN that holds a `head` file, and to no directory of another name. A void
//             session gets no verdict. Otherwise it requires session.json and `ended`, every step with status 0, the
//             teardown project with status 0, the record of a free port, the three read files with every relation
//             holding, and a head that is tree-equal to HEAD outside .planning/.
//
// The plan `views`: the two outcomes of accepting at the app root that are not an entity's page, each in headless
// Chromium at 1280px, accepted by keyboard. Output as above, with focus-select.json and focus-nothing.json in place of
// geometry.json and focus-entity.json, and the two stored sessions the plan makes under auth/.
//   Steps, in order:
//     data-setup-base    as above
//     auth-setup         as above
//     views-users-setup  the project views-users-register of 174.1-read-views.config.ts: registers two users who have
//                        not accepted the terms of use through the suite's own `registerAndStoreSession`, one as the
//                        editor of two candidates and an organization, one as the editor of an organization whose
//                        grant is removed once the session is stored, so that this user has nothing to edit
//     focus-root         the read of the plan `gate`, unchanged, as the control: the outcome already read
//     focus-select       the user who edits several entities accepts at the app root: the selection screen
//     focus-nothing      the user who has nothing to edit accepts at the app root: the "nothing to edit" view
//   The teardown, on every path out of the session once the server process was started, first runs the project
//   views-users-unregister of the same configuration, which removes the two users and asserts that no auth user holds
//   either address. That project opens no page and is run without the served-application preflight, so it runs
//   whether or not the server still listens. The rest of the teardown is as above.
//   `judge` requires the six steps above with status 0, both teardown projects with status 0, the record of a free
//   port, the three read files with every relation holding, and the same head relation.
//
// Every relation of a read is stated in the read's own file with what was observed. Two rectangles are equal when
// every edge differs by less than half a pixel, and an edge lies within another when it passes it by less than that.
//
// The session gives the dev server two variables in its environment, the frontend port and the public project id,
// and the Playwright steps the port alone; it reads no other configuration. The stored session of the pending user
// (the storage-state file `TERMS_PENDING_STORAGE_STATE` names) is written by auth-setup and read here.
//
// Exit codes. session: 0 every step and the teardown returned 0, the port is free and every relation holds;
// 1 otherwise; 2 usage or refusal; 3 VOID; 130 interrupted. judge: 0 pass; 1 fail; 2 usage; 3 VOID.

import { spawn, spawnSync } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, openSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const READS_ROOT = 'tests/e2e-runs/174.1-reads';
const DEFAULT_PORT = 5273;
/** `E2E_PROJECT_ID_DEFAULT` of tests/scripts/e2e-run.sh: the committed id of the project the suite creates and seeds. */
const DEFAULT_PROJECT_ID = '00000000-0000-0000-0000-0000000000e2';
const VOID_MARKER = 'VOID-host-sleep.txt';

/** The file `TERMS_PENDING_STORAGE_STATE` names, and the module that declares it. */
const STORAGE_STATE = 'tests/playwright/.auth/user-terms-pending.json';
const CREDENTIALS = 'tests/tests/utils/testCredentials.ts';
const PLAYWRIGHT_CONFIG = 'tests/playwright.config.ts';
const MESSAGES_DIR = 'apps/frontend/messages';
const INLANG_SETTINGS = 'apps/frontend/project.inlang/settings.json';
const PREREGISTER_PAGE = 'apps/frontend/src/routes/contestant/preregister/(authenticated)/email/+page.svelte';
const PREREGISTER_MESSAGES = 'apps/frontend/messages/en/contestantApp.preregister.json';

/** The class the fix puts on the consent label. */
const WRAP_CLASS = 'whitespace-normal';
const CHECKBOX = '[data-testid="terms-checkbox"]';
const SUBMIT = '[data-testid="terms-of-use-submit"]';
const APP_ROOT = '/contestant';
const ENTITY_HOME_SOURCE =
  '^(?:/[a-z]{2})?/contestant/(?:candidate|organization)/[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}/?$';

/** The plan `views`: its Playwright configuration, its two users, and what marks each of its two views in the page. */
const VIEWS_CONFIG = '.planning/phases/174.1-terms-of-use-gate-phone-width-focus/174.1-read-views.config.ts';
const VIEWS_MULTI_EMAIL = 'read-1741-pending-multi@test.openvaa.local';
const VIEWS_NONE_EMAIL = 'read-1741-pending-none@test.openvaa.local';
/** The entities the first user is registered as the editor of in 174.1-read-views.register.ts. */
const VIEWS_MULTI_ENTITIES = 3;
const SELECTION_MESSAGES = 'apps/frontend/messages/en/contestantApp.entitySelection.json';
const NOTHING_MESSAGES = 'apps/frontend/messages/en/contestantApp.nothingToEdit.json';
const VIEW_SELECTORS = {
  checkboxSelector: CHECKBOX,
  submitSelector: SUBMIT,
  selectionList: '[data-testid="contestant-entity-selection-list"]',
  selectionGroup: '[data-testid="contestant-entity-selection-group"]',
  selectionCard: '[data-testid="entity-card"]',
  nothing: '[data-testid="contestant-nothing-to-edit"]',
  nothingEmail: '[data-testid="contestant-nothing-to-edit-email"]'
};

const NAVIGATION_MS = 30_000;
const ELEMENT_MS = 15_000;
const SERVER_LISTEN_MS = 180_000;
const SESSION_MS = 900_000;
const PROJECT_STEP_MS = 300_000;
const TEARDOWN_PROJECT_MS = 180_000;
const PORT_FREE_MS = 30_000;
const SETTLE_MS = 5_000;
/** The reads' tolerance, in CSS pixels. */
const TOLERANCE = 0.5;

const PHONE_SIZES = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 640, height: 360 },
  { width: 740, height: 360 }
];
const DESKTOP_SIZE = { width: 1280, height: 720 };

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..', '..');
process.chdir(REPO_ROOT);

function usage(message) {
  if (message) console.error(`174.1-read.mjs: ${message}`);
  console.error('usage: node 174.1-read.mjs session --label <name> [--plan gate|views] [--port <number>] [--project-id <uuid>] | judge <label>');
  process.exit(2);
}

const read = (file) => readFileSync(file, 'utf8').trim();
const round = (n) => (typeof n === 'number' ? Math.round(n * 100) / 100 : n);
const near = (a, b) => Math.abs(a - b) < TOLERANCE;
const rectsEqual = (a, b) => !!a && !!b && near(a.left, b.left) && near(a.top, b.top) && near(a.right, b.right) && near(a.bottom, b.bottom);
const showRect = (r) => (r ? `${round(r.left)}, ${round(r.top)}, ${round(r.width)}, ${round(r.height)}` : 'absent');
const git = (...args) => spawnSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

/** `yyyy-mm-dd HH:MM:SS` in the host's local time, the form the host's power log stamps its entries with. */
function localStamp(date) {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`;
}

/** Whether a process listens on the port. */
function portListening(port) {
  const r = spawnSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN'], { encoding: 'utf8' });
  if (r.error) throw new Error(`lsof could not be run: ${r.error.message}`);
  return r.status === 0 && r.stdout.trim() !== '';
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** `<root>/<label>`, or its newest re-run `<label>-rN` that holds a `head` file. Exits 2 when neither exists. */
function resolveRun(root, label) {
  if (!label || label.startsWith('--')) usage('a <label> is required');
  let best = null;
  let bestN = 0;
  if (existsSync(root)) {
    const pattern = new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-r(\\d+)$`);
    for (const name of readdirSync(root)) {
      const m = pattern.exec(name);
      if (m && Number(m[1]) > bestN && existsSync(path.join(root, name, 'head'))) {
        bestN = Number(m[1]);
        best = path.join(root, name);
      }
    }
  }
  const dir = best ?? path.join(root, label);
  if (!existsSync(dir)) usage(`run directory ${dir} does not exist`);
  return dir;
}

// ── what the pages are asked ─────────────────────────────────────────────────────────────────────
// Each function below runs in the page. It takes one serialisable argument and returns plain data.

/** The geometry of the terms-of-use view, read from the live DOM. */
function readViewInPage({ checkboxSelector, submitSelector }) {
  const rectOf = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
  };
  const checkbox = document.querySelector(checkboxSelector);
  const label = checkbox ? checkbox.closest('label') : null;
  const section = checkbox ? checkbox.closest('section') : null;
  const nest = section ? section.closest('form[data-read-reconstruction]') : null;
  const column = section ? (nest ?? section).parentElement : null;
  const block = column ? column.parentElement : null;
  const ingress = section ? section.querySelector(':scope > div') : null;
  const expander = section ? ([...section.children].find((el) => el !== ingress && el !== label) ?? null) : null;
  const span = label ? label.querySelector('span') : null;
  let lines = null;
  if (span) {
    const range = document.createRange();
    range.selectNodeContents(span);
    lines = new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size;
  }
  const root = document.documentElement;
  const style = label ? getComputedStyle(label) : null;
  return {
    path: location.pathname,
    lang: root.lang,
    root: { scrollWidth: root.scrollWidth, clientWidth: root.clientWidth, scrollHeight: root.scrollHeight, innerWidth: window.innerWidth },
    label: label
      ? { whiteSpace: style.whiteSpace, textWrapMode: style.textWrapMode ?? null, classes: label.className, lines, rect: rectOf(label) }
      : null,
    checkbox: rectOf(checkbox),
    submit: rectOf(document.querySelector(submitSelector)),
    column: rectOf(column),
    h1: rectOf(block ? block.querySelector('h1') : null),
    hero: rectOf(block ? block.querySelector(':scope > figure') : null),
    ingress: rectOf(ingress),
    expander: rectOf(expander),
    nest: rectOf(nest)
  };
}

/** Puts the class on the consent label, or takes it off. Returns whether the label held it before. */
function setLabelClassInPage({ checkboxSelector, className, on }) {
  const label = document.querySelector(checkboxSelector).closest('label');
  const had = label.classList.contains(className);
  label.classList.toggle(className, on);
  return had;
}

/** Every style rule of the page's stylesheets whose selector is the class alone, with the cascade layers it sits in. */
function findClassRulesInPage(className) {
  const hits = [];
  const walk = (rules, layers) => {
    for (const rule of rules) {
      if (typeof rule.selectorText === 'string' && rule.selectorText.split(',').some((s) => s.trim() === `.${className}`)) {
        hits.push({ selector: rule.selectorText, declarations: rule.style.cssText, layers: layers.join(' > ') || '(no layer)' });
      }
      const inner = rule.constructor.name === 'CSSLayerBlockRule' ? [...layers, rule.name || '(anonymous)'] : layers;
      if (rule.cssRules && rule.cssRules.length) walk(rule.cssRules, inner);
    }
  };
  for (const sheet of document.styleSheets) {
    try {
      walk(sheet.cssRules, []);
    } catch (error) {
      hits.push({ unreadable: String(error) });
    }
  }
  return hits;
}

/** Nests the live form's section as the pre-registration email page nests it. */
function nestAsPreregistrationInPage({ checkboxSelector, formClass, introClass, introHtml, inputClasses, sectionClass }) {
  const section = document.querySelector(checkboxSelector).closest('section');
  const column = section.parentElement;
  const form = document.createElement('form');
  form.className = formClass;
  form.setAttribute('data-read-reconstruction', '');
  const intro = document.createElement('div');
  intro.className = introClass;
  intro.innerHTML = introHtml;
  column.insertBefore(form, section);
  form.append(intro);
  for (const inputClass of inputClasses) {
    const input = document.createElement('input');
    input.type = 'email';
    input.className = inputClass;
    form.append(input);
  }
  form.append(section);
  for (const name of sectionClass.split(/\s+/).filter(Boolean)) section.classList.add(name);
}

/** A signature of the view's layout, compared between two samples to tell a settled page from one still moving. */
function layoutSignatureInPage({ checkboxSelector, submitSelector }) {
  const sig = (el) => {
    if (!el) return 'absent';
    const r = el.getBoundingClientRect();
    return [r.left, r.top, r.width, r.height].map((n) => n.toFixed(2)).join(',');
  };
  const checkbox = document.querySelector(checkboxSelector);
  const root = document.documentElement;
  return [
    root.scrollWidth,
    root.scrollHeight,
    sig(checkbox),
    sig(checkbox ? checkbox.closest('label') : null),
    sig(document.querySelector(submitSelector)),
    sig(document.querySelector('h1'))
  ].join('|');
}

/** Runs before any script of the page: records every focus call on a heading the helper can focus, and every history call. */
function installRecorderInPage() {
  const state = { documentId: Math.random().toString(36).slice(2), focusCalls: [], historyCalls: [], gateHeading: null };
  const originalFocus = HTMLElement.prototype.focus;
  HTMLElement.prototype.focus = function (options) {
    if (this.tagName === 'H1' || this.hasAttribute('data-focus-on-nav')) {
      const stack = String(new Error().stack ?? '')
        .split('\n')
        .slice(2, 8)
        .map((line) => line.trim());
      state.focusCalls.push({
        t: performance.now(),
        tag: this.tagName,
        text: (this.textContent ?? '').trim().slice(0, 200),
        preventScroll: !!options && options.preventScroll === true,
        connected: this.isConnected,
        isGateHeading: state.gateHeading !== null && this === state.gateHeading,
        path: location.pathname,
        via: stack.some((line) => line.includes('MutationObserver')) ? 'a wait for the heading' : 'the first lookup',
        stack
      });
    }
    return originalFocus.call(this, options);
  };
  for (const kind of ['pushState', 'replaceState']) {
    const original = history[kind];
    history[kind] = function (data, unused, url) {
      state.historyCalls.push({ t: performance.now(), kind, url: url == null ? null : String(url) });
      return original.apply(this, arguments);
    };
  }
  window.__read1741 = state;
}

/** Marks the heading now shown as the gate's, and returns it with the recorder's counts. */
function noteGateInPage() {
  const state = window.__read1741;
  const heading = document.querySelector('h1');
  state.gateHeading = heading;
  return {
    t: performance.now(),
    documentId: state.documentId,
    path: location.pathname,
    gateHeading: heading ? { text: (heading.textContent ?? '').trim(), tabindex: heading.getAttribute('tabindex') } : null,
    focusCalls: state.focusCalls.length,
    historyCalls: state.historyCalls.length
  };
}

/** What has focus now. */
function readActiveElementInPage() {
  const state = window.__read1741;
  const el = document.activeElement;
  return {
    t: performance.now(),
    path: location.pathname,
    tag: el ? el.tagName : null,
    tabindex: el ? el.getAttribute('tabindex') : null,
    text: el ? (el.textContent ?? '').trim().slice(0, 200) : null,
    connected: el ? el.isConnected : false,
    isGateHeading: !!el && el === state.gateHeading
  };
}

/** The recorder's whole record. */
function readRecorderInPage() {
  const state = window.__read1741;
  return { documentId: state.documentId, path: location.pathname, focusCalls: state.focusCalls, historyCalls: state.historyCalls };
}

// ── helpers of the reads ─────────────────────────────────────────────────────────────────────────

const SELECTORS = { checkboxSelector: CHECKBOX, submitSelector: SUBMIT };

const twoFrames = (page) => page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(true)))));

/** Waits for the fonts, then until two consecutive samples of the layout are equal. Returns whether they were. */
async function settle(page, signatureInPage = layoutSignatureInPage, selectors = SELECTORS) {
  await page.evaluate(() => document.fonts.ready.then(() => true));
  const deadline = Date.now() + SETTLE_MS;
  let previous = null;
  for (;;) {
    await twoFrames(page);
    const now = await page.evaluate(signatureInPage, selectors);
    if (now === previous) return true;
    previous = now;
    if (Date.now() > deadline) return false;
    await page.waitForTimeout(200);
  }
}

/** The path of the app root under a locale: the base locale carries no prefix, every other locale its own. */
function localisedRoot(locale, baseLocale) {
  return locale === baseLocale ? APP_ROOT : `/${locale}${APP_ROOT}`;
}

/**
 * Opens the app root under a locale and waits for the view. Returns `served: false`, without waiting for the view,
 * when the URL did not settle on that locale.
 */
async function openView(page, base, locale, baseLocale) {
  const asked = localisedRoot(locale, baseLocale);
  const response = await page.goto(`${base}${asked}`, { timeout: NAVIGATION_MS, waitUntil: 'load' });
  const status = response ? response.status() : null;
  const settledPath = new URL(page.url()).pathname.replace(/\/$/, '');
  const lang = await page.evaluate(() => document.documentElement.lang);
  const served = status !== null && status < 400 && settledPath === asked && lang === locale;
  if (!served) return { locale, asked, served, status, settledPath, lang };
  await page.locator(SUBMIT).waitFor({ state: 'visible', timeout: ELEMENT_MS });
  const settled = await settle(page);
  return { locale, asked, served, status, settledPath, lang, settled };
}

/** The class lists of the pre-registration email page's nesting of the form, read from the page's source. */
function preregistrationNesting() {
  const source = readFileSync(PREREGISTER_PAGE, 'utf8');
  const formAt = source.indexOf('<form');
  const formEnd = source.indexOf('</form>');
  if (formAt < 0 || formEnd < 0) throw new Error(`${PREREGISTER_PAGE} holds no <form>`);
  const body = source.slice(formAt, formEnd);
  const formClass = /^<form\b[^>]*\bclass="([^"]+)"/.exec(body)?.[1];
  const introClass = /<div\b[^>]*\bclass="([^"]+)"/.exec(body)?.[1];
  const inputClasses = [...body.matchAll(/<input\b[^>]*?\bclass="([^"]+)"[^>]*?\/>/g)].map((m) => m[1]);
  const sectionClass = /<TermsOfUseForm\b[^>]*\bclass="([^"]+)"/.exec(body)?.[1];
  const messageKey = /t\('([^']+)'\)/.exec(body)?.[1];
  if (!formClass || !introClass || inputClasses.length === 0 || !sectionClass || !messageKey) {
    throw new Error(`${PREREGISTER_PAGE}: the nesting could not be read (form, intro, inputs, the form component's class or the intro's message)`);
  }
  let node = JSON.parse(readFileSync(PREREGISTER_MESSAGES, 'utf8'));
  let rest = messageKey;
  while (typeof node === 'object' && node !== null && rest) {
    const key = Object.keys(node)
      .filter((k) => rest === k || rest.startsWith(`${k}.`))
      .sort((a, b) => b.length - a.length)[0];
    if (key === undefined) break;
    node = node[key];
    rest = rest.slice(key.length + 1);
  }
  if (typeof node !== 'string') throw new Error(`${PREREGISTER_MESSAGES} holds no string at ${messageKey}`);
  return { formClass, introClass, introHtml: node, introMessage: messageKey, inputClasses, sectionClass };
}

// ── the read `geometry` ──────────────────────────────────────────────────────────────────────────

async function readGeometry({ browser, base }) {
  const baseLocale = JSON.parse(readFileSync(INLANG_SETTINGS, 'utf8')).baseLocale;
  const locales = readdirSync(MESSAGES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const nesting = preregistrationNesting();
  const readings = {
    browser: `Chromium ${browser.version()}`,
    tolerance: TOLERANCE,
    wrapClass: WRAP_CLASS,
    baseLocale,
    locales,
    desktop: {},
    sweep: [],
    notServed: [],
    reconstruction: { nesting, cells: [] }
  };
  const relations = [];
  const unsettled = [];
  const relate = (id, statement, observed, holds) => relations.push({ id, statement, observed, holds: !!holds });

  // (a) The desktop pair: the view as rendered, with the class taken away, and with it put back.
  for (const locale of ['en', 'fi']) {
    const context = await browser.newContext({ storageState: STORAGE_STATE, viewport: DESKTOP_SIZE });
    try {
      const page = await context.newPage();
      const opened = await openView(page, base, locale, baseLocale);
      if (!opened.served) throw new Error(`the app root did not settle on ${locale}: asked ${opened.asked}, got ${opened.settledPath} (lang ${opened.lang}, status ${opened.status})`);
      if (!opened.settled) unsettled.push(`desktop ${locale}`);
      const rendered = await page.evaluate(readViewInPage, SELECTORS);
      const stylesheetRules = await page.evaluate(findClassRulesInPage, WRAP_CLASS);
      const hadClass = await page.evaluate(setLabelClassInPage, { checkboxSelector: CHECKBOX, className: WRAP_CLASS, on: false });
      await twoFrames(page);
      const without = await page.evaluate(readViewInPage, SELECTORS);
      await page.evaluate(setLabelClassInPage, { checkboxSelector: CHECKBOX, className: WRAP_CLASS, on: true });
      await twoFrames(page);
      const restored = await page.evaluate(readViewInPage, SELECTORS);
      readings.desktop[locale] = { ...opened, viewport: DESKTOP_SIZE, labelHeldClass: hadClass, stylesheetRules, rendered, without, restored };
    } finally {
      await context.close();
    }
  }

  const RECTS = ['label', 'checkbox', 'submit', 'column', 'h1', 'hero', 'ingress', 'expander'];
  const rectOf = (state, name) => (name === 'label' ? state.label?.rect : state[name]);
  for (const locale of ['en', 'fi']) {
    const { rendered, without, restored, stylesheetRules, labelHeldClass } = readings.desktop[locale];
    const rule = stylesheetRules.find((r) => r.selector) ?? null;
    relate(
      `G1-${locale}`,
      `${locale}, 1280px: the label computes white-space normal as rendered, and nowrap without the class`,
      `as rendered ${rendered.label?.whiteSpace}, without the class ${without.label?.whiteSpace}; the label held the class: ${labelHeldClass}; the served stylesheet holds ${rule ? `${rule.selector} { ${rule.declarations} } in ${rule.layers}` : 'no rule for the class alone'}`,
      rendered.label?.whiteSpace === 'normal' && without.label?.whiteSpace === 'nowrap'
    );
    const overflow = rendered.root.scrollWidth - rendered.root.clientWidth;
    const label = rendered.label?.rect;
    const column = rendered.column;
    relate(
      `G2-${locale}`,
      `${locale}, 1280px, as rendered: the document does not overflow and the label's left and right edges lie within the column's`,
      `scrollWidth ${rendered.root.scrollWidth}, clientWidth ${rendered.root.clientWidth}; label ${round(label?.left)}…${round(label?.right)}, column ${round(column?.left)}…${round(column?.right)}; without the class the label is ${round(without.label?.rect?.left)}…${round(without.label?.rect?.right)}`,
      overflow <= 0 && !!label && !!column && label.left > column.left - TOLERANCE && label.right < column.right + TOLERANCE
    );
    relate(
      `G3-${locale}`,
      `${locale}, 1280px: Continue's rectangle, the checkbox's rectangle and the document height are equal in the two states`,
      `Continue ${showRect(rendered.submit)} | ${showRect(without.submit)}; checkbox ${showRect(rendered.checkbox)} | ${showRect(without.checkbox)}; document height ${rendered.root.scrollHeight} | ${without.root.scrollHeight}`,
      rectsEqual(rendered.submit, without.submit) && rectsEqual(rendered.checkbox, without.checkbox) && near(rendered.root.scrollHeight, without.root.scrollHeight)
    );
    const drift = RECTS.filter((name) => !rectsEqual(rectOf(rendered, name), rectOf(restored, name)));
    if (drift.length || rendered.root.scrollHeight !== restored.root.scrollHeight) unsettled.push(`desktop ${locale}: ${drift.join(', ') || 'document height'} read differently after the class was put back`);
  }
  {
    const { rendered, without } = readings.desktop.fi;
    const moved = RECTS.filter((name) => !rectsEqual(rectOf(rendered, name), rectOf(without, name)));
    relate(
      'G4-fi',
      'fi, 1280px: every rectangle read is equal in the two states',
      moved.length ? `not equal: ${moved.map((name) => `${name} ${showRect(rectOf(rendered, name))} | ${showRect(rectOf(without, name))}`).join('; ')}` : `all ${RECTS.length} equal (${RECTS.join(', ')}); label ${showRect(rendered.label?.rect)}, ${rendered.label?.lines} line(s)`,
      moved.length === 0
    );
  }
  {
    const { rendered, without } = readings.desktop.en;
    const above = ['hero', 'h1', 'ingress', 'expander'];
    const shifts = above.map((name) => (rectOf(without, name)?.top ?? NaN) - (rectOf(rendered, name)?.top ?? NaN));
    const sameShift = shifts.every((s) => Number.isFinite(s)) && Math.max(...shifts) - Math.min(...shifts) < TOLERANCE;
    const otherwiseStill = above.every((name) => {
      const a = rectOf(rendered, name);
      const b = rectOf(without, name);
      return !!a && !!b && near(a.left, b.left) && near(a.right, b.right) && near(a.height, b.height);
    });
    const labelRendered = rendered.label?.rect;
    const labelWithout = without.label?.rect;
    const growth = (labelRendered?.height ?? NaN) - (labelWithout?.height ?? NaN);
    const distance = shifts[0];
    const halfOfGrowth = near(distance, growth / 2);
    const widerThanColumn = !!labelWithout && !!without.column && labelWithout.width > without.column.width;
    const tallerWhenWider = !widerThanColumn || labelRendered.height > labelWithout.height;
    readings.desktop.en.derived = { labelHeightRendered: labelRendered?.height, labelHeightWithout: labelWithout?.height, growth, shifts: Object.fromEntries(above.map((name, i) => [name, shifts[i]])), distance, labelWithoutWiderThanColumn: widerThanColumn };
    relate(
      'G5-en',
      'en, 1280px: the hero, the heading, the ingress and the expander each sit higher as rendered than without the class by one and the same distance, and move in no other way; that distance is half of the difference between the label\'s two heights; where the label without the class is wider than the column, the label as rendered is the taller',
      `shifts ${above.map((name, i) => `${name} ${round(shifts[i])}`).join(', ')}; label height ${round(labelRendered?.height)} as rendered (${rendered.label?.lines} line(s)), ${round(labelWithout?.height)} without (${without.label?.lines} line(s)), growth ${round(growth)}, half ${round(growth / 2)}; label without the class ${round(labelWithout?.width)} wide, column ${round(without.column?.width)}`,
      sameShift && otherwiseStill && distance > -TOLERANCE && halfOfGrowth && tallerWhenWider
    );
  }

  // (b) The sweep: every locale the application serves, at four phone widths and one desktop width, as rendered.
  const sizes = [...PHONE_SIZES.map((viewport) => ({ viewport, phone: true })), { viewport: DESKTOP_SIZE, phone: false }];
  const notServed = new Map();
  for (const { viewport, phone } of sizes) {
    const context = await browser.newContext({ storageState: STORAGE_STATE, viewport, ...(phone ? { isMobile: true, hasTouch: true } : {}) });
    try {
      for (const locale of locales) {
        const page = await context.newPage();
        const opened = await openView(page, base, locale, baseLocale);
        if (!opened.served) {
          notServed.set(locale, opened);
          await page.close();
          continue;
        }
        if (!opened.settled) unsettled.push(`sweep ${locale} at ${viewport.width}`);
        const view = await page.evaluate(readViewInPage, SELECTORS);
        readings.sweep.push({
          locale,
          width: viewport.width,
          height: viewport.height,
          phone,
          overflow: view.root.scrollWidth - view.root.clientWidth,
          scrollWidth: view.root.scrollWidth,
          clientWidth: view.root.clientWidth,
          checkboxLeft: view.checkbox?.left ?? null,
          checkboxRight: view.checkbox?.right ?? null,
          labelWhiteSpace: view.label?.whiteSpace ?? null,
          labelWidth: view.label?.rect?.width ?? null,
          labelHeight: view.label?.rect?.height ?? null,
          labelLines: view.label?.lines ?? null
        });
        await page.close();
      }
    } finally {
      await context.close();
    }
  }
  readings.notServed = [...notServed.values()];
  {
    const cells = readings.sweep;
    const bad = cells.filter((c) => !(c.overflow <= 0 && c.checkboxLeft !== null && c.checkboxLeft >= 0 && c.checkboxRight <= c.clientWidth));
    const servedLocales = [...new Set(cells.map((c) => c.locale))];
    const complete = servedLocales.every((locale) => cells.filter((c) => c.locale === locale).length === sizes.length);
    const mustServe = ['en', 'fi'].every((locale) => servedLocales.includes(locale));
    const worst = cells.length ? Math.max(...cells.map((c) => c.overflow)) : null;
    const leftMost = cells.length ? Math.min(...cells.map((c) => c.checkboxLeft ?? -Infinity)) : null;
    relate(
      'G6',
      'every served locale at 320, 390, 640, 740 and 1280px, as rendered: no horizontal overflow, and the checkbox lies within the viewport\'s width; en and fi are served',
      `${cells.length} cell(s) over ${servedLocales.length} locale(s) (${servedLocales.join(', ')}) and ${sizes.length} width(s); largest overflow ${worst}; leftmost checkbox edge ${round(leftMost)}; not served: ${readings.notServed.map((n) => n.locale).join(', ') || 'none'}; cells that do not hold: ${bad.map((c) => `${c.locale}@${c.width} overflow ${c.overflow}, checkbox ${round(c.checkboxLeft)}…${round(c.checkboxRight)}`).join('; ') || 'none'}`,
      cells.length > 0 && bad.length === 0 && complete && mustServe
    );
  }

  // (c) The pre-registration nesting of the form, rebuilt in the page around the live form. A reconstruction.
  const nestSizes = [
    { viewport: PHONE_SIZES[0], phone: true },
    { viewport: PHONE_SIZES[1], phone: true },
    { viewport: DESKTOP_SIZE, phone: false }
  ];
  for (const { viewport, phone } of nestSizes) {
    const context = await browser.newContext({ storageState: STORAGE_STATE, viewport, ...(phone ? { isMobile: true, hasTouch: true } : {}) });
    try {
      const page = await context.newPage();
      const opened = await openView(page, base, 'en', baseLocale);
      if (!opened.served) throw new Error(`the app root did not settle on en for the reconstruction (got ${opened.settledPath})`);
      await page.evaluate(nestAsPreregistrationInPage, { checkboxSelector: CHECKBOX, ...nesting });
      if (!(await settle(page))) unsettled.push(`reconstruction at ${viewport.width}`);
      const rendered = await page.evaluate(readViewInPage, SELECTORS);
      await page.evaluate(setLabelClassInPage, { checkboxSelector: CHECKBOX, className: WRAP_CLASS, on: false });
      await twoFrames(page);
      const without = await page.evaluate(readViewInPage, SELECTORS);
      await page.evaluate(setLabelClassInPage, { checkboxSelector: CHECKBOX, className: WRAP_CLASS, on: true });
      const cell = (state) => ({
        scrollWidth: state.root.scrollWidth,
        clientWidth: state.root.clientWidth,
        formWidth: state.nest?.width ?? null,
        checkboxLeft: state.checkbox?.left ?? null,
        checkboxRight: state.checkbox?.right ?? null,
        labelWhiteSpace: state.label?.whiteSpace ?? null
      });
      readings.reconstruction.cells.push({ width: viewport.width, height: viewport.height, phone, rendered: cell(rendered), without: cell(without) });
    } finally {
      await context.close();
    }
  }
  {
    const phones = readings.reconstruction.cells.filter((c) => c.phone);
    const show = (c, s) => `${c.width}: scrollWidth ${s.scrollWidth} / clientWidth ${s.clientWidth}, form ${round(s.formWidth)} wide, checkbox ${round(s.checkboxLeft)}…${round(s.checkboxRight)}`;
    relate(
      'G7',
      'the pre-registration nesting (a reconstruction), en, as rendered at 320 and 390px: the document does not overflow and the checkbox is within the viewport',
      phones.map((c) => show(c, c.rendered)).join('; '),
      phones.length === 2 && phones.every((c) => c.rendered.formWidth !== null && c.rendered.scrollWidth <= c.rendered.clientWidth && c.rendered.checkboxLeft >= 0 && c.rendered.checkboxRight <= c.rendered.clientWidth)
    );
    relate(
      'G8',
      'the pre-registration nesting (a reconstruction), en, without the class at 320 and 390px: the document overflows, so G7 is not vacuous',
      phones.map((c) => show(c, c.without)).join('; '),
      phones.length === 2 && phones.every((c) => c.without.formWidth !== null && c.without.scrollWidth > c.without.clientWidth)
    );
  }

  relate(
    'G0',
    'the read\'s own control: every page read was settled (two consecutive equal samples of its layout), and each page of the desktop pair read the same after the class was put back as before it was removed',
    unsettled.length ? unsettled.join('; ') : 'every page settled; both desktop pages read the same after the class was put back',
    unsettled.length === 0
  );
  return { readings, relations };
}

// ── the reads `focus-root` and `focus-entity` ────────────────────────────────────────────────────

/**
 * Opens a path under a stored session with the recorder installed, and waits for the gate. The session is the pending
 * user's unless another is named; `recordInput` adds the recorder of key and pointer events.
 */
async function openGateForFocus({ browser, base }, pathName, { storageState = STORAGE_STATE, recordInput = false } = {}) {
  const context = await browser.newContext({ storageState, viewport: DESKTOP_SIZE });
  await context.addInitScript(installRecorderInPage);
  if (recordInput) await context.addInitScript(installInputRecorderInPage);
  const page = await context.newPage();
  await page.goto(`${base}${pathName}`, { timeout: NAVIGATION_MS, waitUntil: 'load' });
  await page.locator(SUBMIT).waitFor({ state: 'visible', timeout: ELEMENT_MS });
  // The navigation that brought the user here moves focus to the gate's heading once the client has started; waiting for that call is waiting for a page that answers the keyboard.
  const clientStarted = await page
    .waitForFunction(() => window.__read1741.focusCalls.length > 0, null, { timeout: ELEMENT_MS })
    .then(() => true)
    .catch(() => false);
  await settle(page);
  const atGate = await page.evaluate(noteGateInPage);
  return { context, page, atGate: { ...atGate, clientStarted, activeElement: await page.evaluate(readActiveElementInPage) } };
}

/** Ticks the checkbox with Space and presses Continue with Enter. Returns the recorder's counts taken just before Enter. */
async function acceptByKeyboard(page) {
  await page.locator(CHECKBOX).focus({ timeout: ELEMENT_MS });
  await page.keyboard.press('Space');
  await page.waitForFunction((selector) => !document.querySelector(selector).disabled, SUBMIT, { timeout: ELEMENT_MS });
  await page.locator(SUBMIT).focus({ timeout: ELEMENT_MS });
  const beforeContinue = await page.evaluate(noteCountsInPage);
  await page.keyboard.press('Enter');
  return beforeContinue;
}

/** The recorder's counts and the path, without touching what it marked as the gate's heading. */
function noteCountsInPage() {
  const state = window.__read1741;
  return { t: performance.now(), documentId: state.documentId, path: location.pathname, focusCalls: state.focusCalls.length, historyCalls: state.historyCalls.length };
}

/** Four reads of what has focus, over about four seconds. */
async function fourReads(page) {
  const reads = [];
  for (let i = 0; i < 4; i += 1) {
    if (i > 0) await page.waitForTimeout(1_300);
    reads.push(await page.evaluate(readActiveElementInPage));
  }
  return reads;
}

const showRead = (r) => `${r.tag}${r.tabindex === null ? '' : `[tabindex=${r.tabindex}]`} "${(r.text ?? '').slice(0, 60)}"${r.connected ? '' : ' (not connected)'}${r.isGateHeading ? ' (the gate\'s heading)' : ''}`;
const showCall = (c) => `${c.tag} "${c.text.slice(0, 60)}" preventScroll ${c.preventScroll} at ${c.path}, by ${c.via}${c.isGateHeading ? ' (the gate\'s heading)' : ''}`;
const onNewHeading = (r, gateText) => r.tag === 'H1' && r.connected && r.tabindex === '-1' && !r.isGateHeading && r.text !== gateText;

async function readFocusRoot(env) {
  const { context, page, atGate } = await openGateForFocus(env, APP_ROOT);
  try {
    const beforeContinue = await acceptByKeyboard(page);
    await page.waitForFunction(
      (source) => new RegExp(source).test(location.pathname) && [...document.querySelectorAll('h1')].some((h) => h.isConnected && h !== window.__read1741.gateHeading),
      ENTITY_HOME_SOURCE,
      { timeout: NAVIGATION_MS }
    );
    const reads = await fourReads(page);
    const record = await page.evaluate(readRecorderInPage);
    const sameDocument = record.documentId === beforeContinue.documentId;
    const callsAfter = sameDocument ? record.focusCalls.slice(beforeContinue.focusCalls) : record.focusCalls;
    const historyAfter = sameDocument ? record.historyCalls.slice(beforeContinue.historyCalls) : record.historyCalls;
    const lastPath = reads[reads.length - 1].path;
    const isEntityHome = new RegExp(ENTITY_HOME_SOURCE).test(lastPath);
    const gateText = atGate.gateHeading?.text ?? null;
    const readings = { viewport: DESKTOP_SIZE, opened: APP_ROOT, atGate, beforeContinue, reads, sameDocument, focusCallsBeforeContinue: record.focusCalls.slice(0, sameDocument ? beforeContinue.focusCalls : 0), focusCallsAfterContinue: callsAfter, historyCallsAfterContinue: historyAfter, entityPath: isEntityHome ? lastPath.replace(/\/$/, '') : null };
    const relations = [
      {
        id: 'F1',
        statement: 'at the app root: after Continue the path changed to an entity\'s home',
        observed: `before Continue ${beforeContinue.path}; after the last read ${lastPath}; history calls after Continue: ${historyAfter.map((h) => `${h.kind} ${h.url}`).join(', ') || 'none'}; the same document: ${sameDocument}`,
        holds: beforeContinue.path.replace(/\/$/, '') === APP_ROOT && isEntityHome
      },
      {
        id: 'F2',
        statement: 'at the app root: all four reads of document.activeElement are a connected H1 with tabindex -1 that is not the gate\'s heading',
        observed: `the gate's heading "${gateText}"; reads: ${reads.map(showRead).join(' | ')}`,
        holds: reads.length === 4 && reads.every((r) => onNewHeading(r, gateText))
      },
      {
        id: 'F3',
        statement: 'at the app root: exactly one heading focus call was recorded after Continue was pressed, with preventScroll true, in the document the gate was shown in',
        observed: `${callsAfter.length} call(s) after Continue: ${callsAfter.map(showCall).join(' | ') || 'none'}; ${beforeContinue.focusCalls} call(s) before it; the same document: ${sameDocument}`,
        holds: sameDocument && callsAfter.length === 1 && callsAfter[0].preventScroll === true
      }
    ];
    return { readings, relations };
  } finally {
    await context.close();
  }
}

async function readFocusEntity(env) {
  const entityPath = env.results['focus-root']?.readings?.entityPath;
  if (!entityPath) throw new Error('focus-root recorded no entity path, so there is no entity URL to open');
  const asked = `${entityPath}/profile`;
  const { context, page, atGate } = await openGateForFocus(env, asked);
  try {
    const beforeContinue = await acceptByKeyboard(page);
    await page.waitForFunction(
      (selector) => !document.querySelector(selector) && [...document.querySelectorAll('h1')].some((h) => h.isConnected && h !== window.__read1741.gateHeading),
      SUBMIT,
      { timeout: NAVIGATION_MS }
    );
    const reads = await fourReads(page);
    const record = await page.evaluate(readRecorderInPage);
    const sameDocument = record.documentId === beforeContinue.documentId;
    const callsAfter = sameDocument ? record.focusCalls.slice(beforeContinue.focusCalls) : record.focusCalls;
    const historyAfter = sameDocument ? record.historyCalls.slice(beforeContinue.historyCalls) : record.historyCalls;
    const lastPath = reads[reads.length - 1].path;
    const gateText = atGate.gateHeading?.text ?? null;
    const readings = { viewport: DESKTOP_SIZE, opened: asked, atGate, beforeContinue, reads, sameDocument, focusCallsBeforeContinue: record.focusCalls.slice(0, sameDocument ? beforeContinue.focusCalls : 0), focusCallsAfterContinue: callsAfter, historyCallsAfterContinue: historyAfter };
    const relations = [
      {
        id: 'F4',
        statement: 'at an entity URL: the gate is shown at the path asked for, and the path is the same before Continue and after the last read',
        observed: `asked ${asked}; at the gate ${atGate.path}; before Continue ${beforeContinue.path}; after the last read ${lastPath}; history calls after Continue: ${historyAfter.map((h) => `${h.kind} ${h.url}`).join(', ') || 'none'}; the same document: ${sameDocument}`,
        holds: atGate.path === asked && beforeContinue.path === asked && lastPath === asked && reads.every((r) => r.path === asked)
      },
      {
        id: 'F5',
        statement: 'at an entity URL: all four reads of document.activeElement are a connected H1 with tabindex -1 that is not the gate\'s heading',
        observed: `the gate's heading "${gateText}"; reads: ${reads.map(showRead).join(' | ')}`,
        holds: reads.length === 4 && reads.every((r) => onNewHeading(r, gateText))
      },
      {
        id: 'F6',
        statement: 'at an entity URL: exactly one heading focus call was recorded after Continue was pressed, with preventScroll true, in the document the gate was shown in',
        observed: `${callsAfter.length} call(s) after Continue: ${callsAfter.map(showCall).join(' | ') || 'none'}; ${beforeContinue.focusCalls} call(s) before it; the same document: ${sameDocument}`,
        holds: sameDocument && callsAfter.length === 1 && callsAfter[0].preventScroll === true
      }
    ];
    return { readings, relations };
  } finally {
    await context.close();
  }
}

// ── the reads `focus-select` and `focus-nothing` ─────────────────────────────────────────────────

/** Runs before any script of the page: records every key press, every pointer, mouse or touch press, and every click. */
function installInputRecorderInPage() {
  const log = { keys: [], presses: [], clicks: [] };
  const describe = (el) => (el instanceof Element ? { tag: el.tagName, testId: el.getAttribute('data-testid') } : null);
  addEventListener('keydown', (e) => log.keys.push({ t: performance.now(), key: e.key, trusted: e.isTrusted, target: describe(e.target) }), true);
  for (const kind of ['pointerdown', 'mousedown', 'touchstart']) {
    addEventListener(kind, (e) => log.presses.push({ t: performance.now(), kind, trusted: e.isTrusted, target: describe(e.target) }), true);
  }
  addEventListener('click', (e) => log.clicks.push({ t: performance.now(), trusted: e.isTrusted, detail: e.detail, pointerType: e.pointerType ?? null, target: describe(e.target) }), true);
  window.__read1741Input = log;
}

/** Where focus is among the gate's two controls, and their state. */
function readKeyboardStateInPage({ checkboxSelector, submitSelector }) {
  const checkbox = document.querySelector(checkboxSelector);
  const submit = document.querySelector(submitSelector);
  const el = document.activeElement;
  return {
    active: el ? { tag: el.tagName, testId: el.getAttribute('data-testid') } : null,
    activeIsCheckbox: !!checkbox && el === checkbox,
    activeIsSubmit: !!submit && el === submit,
    checkboxChecked: checkbox ? checkbox.checked === true : null,
    submitDisabled: submit ? submit.disabled === true : null
  };
}

/**
 * What the page shows and what has focus. The navigation target is found as the application's helper finds it: the
 * element carrying `data-focus-on-nav`, or the first `h1` when there is none.
 */
function readViewStateInPage({ submitSelector, selectionList, selectionGroup, selectionCard, nothing, nothingEmail }) {
  const state = window.__read1741;
  const headings = [...document.querySelectorAll('h1')];
  const marked = document.querySelector('[data-focus-on-nav]');
  const target = marked ?? headings[0] ?? null;
  const el = document.activeElement;
  const describe = (node) => (node ? { tag: node.tagName, tabindex: node.getAttribute('tabindex'), text: (node.textContent ?? '').trim().slice(0, 200), connected: node.isConnected } : null);
  const list = document.querySelector(selectionList);
  const email = document.querySelector(nothingEmail);
  return {
    t: performance.now(),
    path: location.pathname,
    url: location.href,
    documentHasFocus: document.hasFocus(),
    gateSubmitPresent: !!document.querySelector(submitSelector),
    gateHeadingConnected: !!state.gateHeading && state.gateHeading.isConnected,
    h1Count: headings.length,
    h1Texts: headings.map((h) => (h.textContent ?? '').trim().slice(0, 200)),
    focusOnNavCount: document.querySelectorAll('[data-focus-on-nav]').length,
    target: target ? { ...describe(target), byAttribute: !!marked } : null,
    active: el
      ? { ...describe(el), isBody: el === document.body, isTarget: !!target && el === target, isGateHeading: !!state.gateHeading && el === state.gateHeading }
      : null,
    selection: {
      listPresent: !!list,
      groups: list ? list.querySelectorAll(selectionGroup).length : 0,
      cards: list ? list.querySelectorAll(selectionCard).length : 0
    },
    nothing: { present: !!document.querySelector(nothing), email: email ? (email.textContent ?? '').trim() : null }
  };
}

/** A signature of either view's layout, compared between two samples to tell a settled page from one still moving. */
function viewSignatureInPage({ selectionList, selectionCard, nothing }) {
  const sig = (el) => {
    if (!el) return 'absent';
    const r = el.getBoundingClientRect();
    return [r.left, r.top, r.width, r.height].map((n) => n.toFixed(2)).join(',');
  };
  const root = document.documentElement;
  const list = document.querySelector(selectionList);
  return [
    root.scrollWidth,
    root.scrollHeight,
    sig(document.querySelector('h1')),
    sig(list),
    list ? list.querySelectorAll(selectionCard).length : 0,
    sig(document.querySelector(nothing))
  ].join('|');
}

/**
 * Ticks the checkbox with Space and presses Continue with Enter, as `acceptByKeyboard` does, and reads where focus
 * was and what the two controls held before Space, after it, and before Enter.
 */
async function acceptByKeyboardWitnessed(page) {
  await page.locator(CHECKBOX).focus({ timeout: ELEMENT_MS });
  const beforeSpace = await page.evaluate(readKeyboardStateInPage, SELECTORS);
  await page.keyboard.press('Space');
  await page.waitForFunction((selector) => !document.querySelector(selector).disabled, SUBMIT, { timeout: ELEMENT_MS });
  const afterSpace = await page.evaluate(readKeyboardStateInPage, SELECTORS);
  await page.locator(SUBMIT).focus({ timeout: ELEMENT_MS });
  const beforeEnter = await page.evaluate(readKeyboardStateInPage, SELECTORS);
  const beforeContinue = await page.evaluate(noteCountsInPage);
  await page.keyboard.press('Enter');
  return { beforeContinue, keyboard: { beforeSpace, afterSpace, beforeEnter } };
}

/** The English string a message file holds at `<namespace>.<key>`. */
function messageOf(file, namespace, key) {
  const value = JSON.parse(readFileSync(file, 'utf8'))?.[namespace]?.[key];
  if (typeof value !== 'string') throw new Error(`${file} holds no string at ${namespace}.${key}`);
  return value;
}

const testIdOf = (selector) => /data-testid="([^"]+)"/.exec(selector)[1];
const atAppRoot = (pathName) => pathName.replace(/\/$/, '') === APP_ROOT;
const showActive = (r) => (r.active ? `${r.active.tag}${r.active.tabindex === null ? '' : `[tabindex=${r.active.tabindex}]`} "${r.active.text.slice(0, 60)}"${r.active.connected ? '' : ' (not connected)'}${r.active.isTarget ? ' (the navigation target)' : ' (NOT the navigation target)'}${r.active.isGateHeading ? ' (the gate\'s heading)' : ''}` : 'no active element');

/**
 * One user accepts at the app root by keyboard, and the view that replaces the gate is read once it has settled.
 * A view that never replaces the gate does not end the read: what the page then shows is recorded and the relations
 * say so.
 */
async function readFocusView(env, view) {
  const { context, page, atGate } = await openGateForFocus(env, APP_ROOT, { storageState: view.storageState, recordInput: true });
  try {
    const gateState = await page.evaluate(readViewStateInPage, VIEW_SELECTORS);
    const { beforeContinue, keyboard } = await acceptByKeyboardWitnessed(page);
    const replaced = await page
      .waitForFunction(
        (selector) => !document.querySelector(selector) && [...document.querySelectorAll('h1')].some((h) => h.isConnected && h !== window.__read1741.gateHeading),
        SUBMIT,
        { timeout: NAVIGATION_MS }
      )
      .then(() => true)
      .catch(() => false);
    const early = await page.evaluate(readViewStateInPage, VIEW_SELECTORS);
    // The selection screen shows a loading state until the user's entities are provided to the data root; its cards are waited for before the page is called settled.
    const listResolved = view.expectsCards
      ? await page
          .waitForFunction(({ selectionList, selectionCard }) => (document.querySelector(selectionList)?.querySelectorAll(selectionCard).length ?? 0) > 0, VIEW_SELECTORS, { timeout: ELEMENT_MS })
          .then(() => true)
          .catch(() => false)
      : null;
    const settled = await settle(page, viewSignatureInPage, VIEW_SELECTORS);
    const reads = [];
    for (let i = 0; i < 4; i += 1) {
      if (i > 0) await page.waitForTimeout(1_300);
      reads.push(await page.evaluate(readViewStateInPage, VIEW_SELECTORS));
    }
    const record = await page.evaluate(readRecorderInPage);
    const input = await page.evaluate(() => window.__read1741Input ?? null);

    const sameDocument = record.documentId === beforeContinue.documentId;
    const callsAfter = sameDocument ? record.focusCalls.slice(beforeContinue.focusCalls) : record.focusCalls;
    const historyAfter = sameDocument ? record.historyCalls.slice(beforeContinue.historyCalls) : record.historyCalls;
    const gateText = atGate.gateHeading?.text ?? null;
    const keys = input?.keys ?? [];
    const presses = input?.presses ?? [];
    const clicks = input?.clicks ?? [];
    const spaces = keys.filter((k) => k.key === ' ' && k.trusted && k.target?.testId === testIdOf(CHECKBOX));
    const enters = keys.filter((k) => k.key === 'Enter' && k.trusted && k.target?.testId === testIdOf(SUBMIT));
    const showsView = (r) =>
      view.expectsCards
        ? r.selection.listPresent && r.selection.cards === VIEWS_MULTI_ENTITIES && !r.nothing.present
        : r.nothing.present && r.nothing.email === view.email && !r.selection.listPresent;
    const last = reads[reads.length - 1];
    const readings = {
      viewport: DESKTOP_SIZE,
      opened: APP_ROOT,
      user: view.email,
      expectedTitle: view.title,
      atGate,
      gateState,
      keyboard,
      beforeContinue,
      replaced,
      early,
      listResolved,
      settled,
      reads,
      sameDocument,
      focusCallsBeforeContinue: record.focusCalls.slice(0, sameDocument ? beforeContinue.focusCalls : 0),
      focusCallsAfterContinue: callsAfter,
      historyCallsAfterContinue: historyAfter,
      input
    };
    const id = (n) => `${view.idPrefix}${n}`;
    const relations = [
      {
        id: id(0),
        statement: `${view.label}, the read's own control: the gate was shown at the app root with neither view under it; the checkbox had focus and was unticked when Space was pressed, and was ticked with Continue enabled after it; Continue had focus when Enter was pressed; one trusted Space keydown on the checkbox and one trusted Enter keydown on Continue were recorded, and no pointer, mouse or touch press; the view was settled (two consecutive equal samples of its layout) before the first of the four reads`,
        observed: `at the gate ${atGate.path}, heading "${gateText}", focus on ${showRead(atGate.activeElement)}, Continue present: ${gateState.gateSubmitPresent}, selection list present: ${gateState.selection.listPresent}, "nothing to edit" present: ${gateState.nothing.present}; before Space: focus on ${keyboard.beforeSpace.active?.tag}[${keyboard.beforeSpace.active?.testId}], checked ${keyboard.beforeSpace.checkboxChecked}, Continue disabled ${keyboard.beforeSpace.submitDisabled}; after Space: checked ${keyboard.afterSpace.checkboxChecked}, Continue disabled ${keyboard.afterSpace.submitDisabled}; before Enter: focus on ${keyboard.beforeEnter.active?.tag}[${keyboard.beforeEnter.active?.testId}]; keydowns recorded: ${keys.map((k) => `"${k.key}" on ${k.target?.tag}[${k.target?.testId}] trusted ${k.trusted}`).join(', ') || 'none'}; pointer, mouse or touch presses: ${presses.length}; clicks: ${clicks.map((c) => `on ${c.target?.tag}[${c.target?.testId}] detail ${c.detail} pointerType "${c.pointerType}"`).join(', ') || 'none'}; the same document: ${sameDocument}; settled: ${settled}${listResolved === null ? '' : `; cards rendered: ${listResolved}`}`,
        holds:
          atAppRoot(atGate.path) &&
          gateState.gateSubmitPresent &&
          !gateState.selection.listPresent &&
          !gateState.nothing.present &&
          keyboard.beforeSpace.activeIsCheckbox &&
          keyboard.beforeSpace.checkboxChecked === false &&
          keyboard.beforeSpace.submitDisabled === true &&
          keyboard.afterSpace.checkboxChecked === true &&
          keyboard.afterSpace.submitDisabled === false &&
          keyboard.beforeEnter.activeIsSubmit &&
          sameDocument &&
          spaces.length === 1 &&
          enters.length === 1 &&
          presses.length === 0 &&
          settled === true &&
          listResolved !== false
      },
      {
        id: id(1),
        statement: `${view.label}: after Continue ${view.expectsCards ? `the selection screen replaced the gate, listing ${VIEWS_MULTI_ENTITIES} entity cards` : 'the "nothing to edit" view replaced the gate, showing the user\'s own address'}; the path is the app root before Continue and at each of the four reads, in the document the gate was shown in`,
        observed: `the gate was replaced: ${replaced}; before Continue ${beforeContinue.path}; reads at ${reads.map((r) => r.path).join(', ')}; URL ${last.url}; Continue present: ${reads.map((r) => r.gateSubmitPresent).join(', ')}; selection list present: ${last.selection.listPresent}, ${last.selection.groups} group(s), ${last.selection.cards} card(s); "nothing to edit" present: ${last.nothing.present}${last.nothing.email === null ? '' : `, address "${last.nothing.email}"`}; history calls after Continue: ${historyAfter.map((h) => `${h.kind} ${h.url}`).join(', ') || 'none'}; the same document: ${sameDocument}`,
        holds: replaced && sameDocument && atAppRoot(beforeContinue.path) && reads.length === 4 && reads.every((r) => atAppRoot(r.path) && !r.gateSubmitPresent && showsView(r))
      },
      {
        id: id(2),
        statement: `${view.label}: all four reads of document.activeElement are the view's navigation target, a connected H1 with tabindex -1 whose text is "${view.title}", and none is BODY or the gate's heading`,
        observed: `the gate's heading "${gateText}"; the navigation target at the last read: ${last.target ? `${last.target.tag}[tabindex=${last.target.tabindex}] "${last.target.text.slice(0, 60)}", found by ${last.target.byAttribute ? 'data-focus-on-nav' : 'being the first h1'}` : 'none'}; ${last.h1Count} h1 and ${last.focusOnNavCount} data-focus-on-nav element(s) in the document; the read taken as the gate was replaced: ${showActive(early)}; the four reads: ${reads.map(showActive).join(' | ')}; BODY at any read: ${reads.some((r) => r.active?.isBody === true)}`,
        holds:
          reads.length === 4 &&
          view.title !== gateText &&
          reads.every((r) => !!r.active && r.active.isTarget && r.active.tag === 'H1' && r.active.connected && r.active.tabindex === '-1' && r.active.text === view.title && !r.active.isBody && !r.active.isGateHeading)
      },
      {
        id: id(3),
        statement: `${view.label}: exactly one heading focus call was recorded after Continue was pressed, on an H1 with the view's title, with preventScroll true, in the document the gate was shown in`,
        observed: `${callsAfter.length} call(s) after Continue: ${callsAfter.map(showCall).join(' | ') || 'none'}; ${beforeContinue.focusCalls} call(s) before it; the same document: ${sameDocument}`,
        holds: sameDocument && callsAfter.length === 1 && callsAfter[0].preventScroll === true && callsAfter[0].tag === 'H1' && callsAfter[0].text === view.title
      }
    ];
    return { readings, relations };
  } finally {
    await context.close();
  }
}

const readFocusSelect = (env) =>
  readFocusView(env, {
    label: 'a user who edits several entities',
    idPrefix: 'S',
    expectsCards: true,
    email: VIEWS_MULTI_EMAIL,
    storageState: env.viewSessions.multi,
    title: messageOf(SELECTION_MESSAGES, 'contestantApp.entitySelection', 'title')
  });

const readFocusNothing = (env) =>
  readFocusView(env, {
    label: 'a user who has nothing to edit',
    idPrefix: 'N',
    expectsCards: false,
    email: VIEWS_NONE_EMAIL,
    storageState: env.viewSessions.none,
    title: messageOf(NOTHING_MESSAGES, 'contestantApp.nothingToEdit', 'title')
  });

const READS = {
  geometry: readGeometry,
  'focus-root': readFocusRoot,
  'focus-entity': readFocusEntity,
  'focus-select': readFocusSelect,
  'focus-nothing': readFocusNothing
};

/** The steps of each plan, in order, and the reads among them. A project step runs under the suite's configuration unless it names another. */
const PLANS = {
  gate: {
    steps: [
      { name: 'data-setup-base', kind: 'project', project: 'data-setup-base' },
      { name: 'auth-setup', kind: 'project', project: 'auth-setup' },
      { name: 'geometry', kind: 'read' },
      { name: 'focus-root', kind: 'read' },
      { name: 'auth-setup-again', kind: 'project', project: 'auth-setup' },
      { name: 'focus-entity', kind: 'read' }
    ],
    usersTeardown: false
  },
  views: {
    steps: [
      { name: 'data-setup-base', kind: 'project', project: 'data-setup-base' },
      { name: 'auth-setup', kind: 'project', project: 'auth-setup' },
      { name: 'views-users-setup', kind: 'project', project: 'views-users-register', config: VIEWS_CONFIG },
      { name: 'focus-root', kind: 'read' },
      { name: 'focus-select', kind: 'read' },
      { name: 'focus-nothing', kind: 'read' }
    ],
    usersTeardown: true
  }
};
const readsOf = (plan) => PLANS[plan].steps.filter((step) => step.kind === 'read').map((step) => step.name);

// ── session ──────────────────────────────────────────────────────────────────────────────────────

async function session(args) {
  let label = '';
  let plan = 'gate';
  let port = DEFAULT_PORT;
  let projectId = DEFAULT_PROJECT_ID;
  for (let i = 0; i < args.length; i += 2) {
    const value = args[i + 1];
    if (value === undefined) usage(`${args[i]} requires a value`);
    if (args[i] === '--label') label = value;
    else if (args[i] === '--plan') plan = value;
    else if (args[i] === '--port') port = Number(value);
    else if (args[i] === '--project-id') projectId = value;
    else usage(`unexpected argument '${args[i]}'`);
  }
  if (!label || /[/]/.test(label) || /^[.-]/.test(label)) usage('--label takes a plain name (e.g. 174.1-02-reads)');
  if (!Object.hasOwn(PLANS, plan)) usage(`--plan takes one of ${Object.keys(PLANS).join(', ')}`);
  if (!Number.isInteger(port) || port < 1 || port > 65535) usage('--port takes a port number');
  if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(projectId)) usage('--project-id takes a uuid');

  const dir = path.join(READS_ROOT, label);
  const refuse = (message) => {
    console.error(`174.1-read.mjs: ${message}`);
    process.exit(2);
  };
  const status = git('status', '--porcelain', '--', '.', ':(exclude).planning');
  if (status.status !== 0) refuse(`git status failed: ${status.stderr.trim()}`);
  const dirty = status.stdout.split('\n').filter((line) => line && line !== '?? CAND-APP-PLAN.md');
  if (dirty.length) refuse(`the working tree has uncommitted changes outside .planning/:\n${dirty.join('\n')}`);
  if (existsSync(path.join(dir, 'head'))) refuse(`${dir} already holds a session; a later attempt takes the next -rN suffix of the same label`);
  if (portListening(port)) refuse(`a process already listens on port ${port}`);
  if (!read(CREDENTIALS).includes(STORAGE_STATE.replace(/^tests\//, ''))) refuse(`${CREDENTIALS} does not name ${STORAGE_STATE}`);

  mkdirSync(dir, { recursive: true });
  const startedAt = new Date();
  const deadline = startedAt.getTime() + SESSION_MS;
  const remaining = () => Math.max(1_000, deadline - Date.now());
  const head = git('rev-parse', 'HEAD').stdout.trim();
  writeFileSync(path.join(dir, 'head'), `${head}\n`);
  writeFileSync(path.join(dir, 'started'), `${startedAt.toISOString()}\n`);

  const state = {
    label,
    plan,
    dir,
    head,
    port,
    projectId,
    node: process.version,
    startedUtc: startedAt.toISOString(),
    startedLocal: localStamp(startedAt),
    ceilingMs: SESSION_MS,
    server: { started: false, listened: false },
    steps: [],
    relations: {},
    teardown: null,
    interruptedBy: null,
    void: false,
    exit: null
  };
  const writeState = () => writeFileSync(path.join(dir, 'session.json'), `${JSON.stringify(state, null, 2)}\n`);
  const say = (message) => console.log(`174.1-read [${label}] ${message}`);

  const STEPS = PLANS[plan].steps;
  /** Where the plan `views` stores the sessions of its two users, and what its two Playwright projects are told about them. */
  const viewSessions = {
    multi: path.resolve(dir, 'auth', 'user-terms-pending-multi.json'),
    none: path.resolve(dir, 'auth', 'user-terms-pending-none.json')
  };
  const viewsEnv = {
    READ1741_MULTI_EMAIL: VIEWS_MULTI_EMAIL,
    READ1741_NONE_EMAIL: VIEWS_NONE_EMAIL,
    READ1741_MULTI_STATE: viewSessions.multi,
    READ1741_NONE_STATE: viewSessions.none
  };

  let server = null;
  let browser = null;
  let current = null;
  let stopping = false;
  let teardownPromise = null;
  const results = {};
  const base = `http://localhost:${port}`;

  const killGroup = (child, signal) => {
    try {
      process.kill(-child.pid, signal);
    } catch {
      try {
        child.kill(signal);
      } catch {
        // The process is already gone.
      }
    }
  };

  /** Runs a command in a process group of its own, with its output in a log file. Resolves with its status; never rejects. */
  const runLogged = (command, commandArgs, { env, logFile, timeoutMs }) =>
    new Promise((resolve) => {
      const fd = openSync(logFile, 'a');
      const began = Date.now();
      let timedOut = false;
      const child = spawn(command, commandArgs, { cwd: REPO_ROOT, env, detached: true, stdio: ['ignore', fd, fd] });
      current = child;
      const timer = setTimeout(() => {
        timedOut = true;
        killGroup(child, 'SIGINT');
        setTimeout(() => killGroup(child, 'SIGKILL'), 10_000).unref();
      }, timeoutMs);
      const done = (result) => {
        clearTimeout(timer);
        try {
          closeSync(fd);
        } catch {
          // Closed already.
        }
        if (current === child) current = null;
        resolve({ ...result, durationMs: Date.now() - began });
      };
      child.on('error', (error) => done({ status: 127, error: String(error) }));
      child.on('exit', (code, signal) => {
        const bySignal = signal ? 128 + (os.constants.signals[signal] ?? 0) : 1;
        done({ status: timedOut ? 124 : (code ?? bySignal), ...(timedOut ? { timedOut: true } : {}), ...(signal ? { signal } : {}) });
      });
    });

  const runProject = (project, logName, timeoutMs, { config = PLAYWRIGHT_CONFIG, env = {} } = {}) =>
    runLogged('npx', ['playwright', 'test', '-c', config, `--project=${project}`, '--no-deps', '--reporter=line'], {
      env: { ...process.env, FRONTEND_PORT: String(port), ...env },
      logFile: path.join(dir, logName),
      timeoutMs
    });

  /** The host's Sleep, Wake and DarkWake entries inside the session's window, as the E2E driver of Phase 174 reads them. */
  const powerEntries = (fromLocal, toLocal) =>
    new Promise((resolve) => {
      const entries = [];
      let child;
      try {
        child = spawn('pmset', ['-g', 'log'], { stdio: ['ignore', 'pipe', 'ignore'] });
      } catch (error) {
        resolve({ available: false, error: String(error), entries });
        return;
      }
      const timer = setTimeout(() => child.kill('SIGKILL'), 60_000);
      child.on('error', (error) => {
        clearTimeout(timer);
        resolve({ available: false, error: String(error), entries });
      });
      const lines = readline.createInterface({ input: child.stdout });
      lines.on('line', (line) => {
        if (!/^.{26}(Sleep|Wake|DarkWake) /.test(line)) return;
        const stamp = line.slice(0, 19);
        if (stamp >= fromLocal && stamp <= toLocal) entries.push(line.slice(0, 220));
      });
      child.on('exit', (code) => {
        clearTimeout(timer);
        lines.close();
        resolve({ available: code === 0, ...(code === 0 ? {} : { error: `pmset exited ${code}` }), entries });
      });
    });

  const teardown = (reason) => {
    if (teardownPromise) return teardownPromise;
    stopping = true;
    teardownPromise = (async () => {
      const record = { reason, users: null, project: null, note: null, serverGroupSignalled: false, portFree: null, power: null };
      state.teardown = record;
      say(`teardown (${reason})`);
      if (current) killGroup(current, 'SIGINT');
      if (browser) await browser.close().catch(() => undefined);
      for (let i = 0; i < 100 && current; i += 1) await sleep(100);

      if (!server) {
        record.note = 'the server process was never started: no setup ran and nothing was seeded';
      } else {
        if (PLANS[plan].usersTeardown) {
          // Before the dataset is cleared, and whether or not the server listens: the project opens no page.
          const result = await runProject('views-users-unregister', '89-views-users-unregister.log', TEARDOWN_PROJECT_MS, {
            config: VIEWS_CONFIG,
            env: { ...viewsEnv, READ1741_USERS_STEP: 'unregister' }
          });
          record.users = { name: 'views-users-unregister', ...result };
          say(`views-users-unregister: status ${result.status} in ${result.durationMs} ms`);
        }
        let listening = false;
        try {
          listening = portListening(port);
        } catch (error) {
          record.note = String(error);
        }
        if (listening) {
          const result = await runProject('data-teardown-base', '90-data-teardown-base.log', TEARDOWN_PROJECT_MS);
          record.project = { name: 'data-teardown-base', ...result };
          say(`data-teardown-base: status ${result.status} in ${result.durationMs} ms`);
        } else if (!state.server.listened) {
          record.note = 'the server never listened: no setup ran and nothing was seeded';
        } else {
          record.project = { name: 'data-teardown-base', status: 'not run' };
          record.note = 'the server listened and is no longer listening: the teardown project could not run, and whatever the setups seeded is left for the next attempt\'s own setup and teardown';
        }
        killGroup(server, 'SIGTERM');
        record.serverGroupSignalled = true;
        const serverGone = () => server.exitCode !== null || server.signalCode !== null;
        const held = () => {
          try {
            return portListening(port);
          } catch {
            return true;
          }
        };
        const freeBy = Date.now() + PORT_FREE_MS;
        while ((held() || !serverGone()) && Date.now() < freeBy) await sleep(250);
        if (held() || !serverGone()) {
          killGroup(server, 'SIGKILL');
          record.serverGroupKilled = true;
          const killedBy = Date.now() + 10_000;
          while (held() && Date.now() < killedBy) await sleep(250);
        }
        record.portFree = !held();
        say(`port ${port} ${record.portFree ? 'has no listener' : 'STILL HAS A LISTENER'}`);
      }

      const endedAt = new Date();
      state.endedUtc = endedAt.toISOString();
      state.endedLocal = localStamp(endedAt);
      const power = await powerEntries(state.startedLocal, state.endedLocal);
      const sleeps = power.entries.filter((line) => /^.{26}Sleep /.test(line));
      record.power = { ...power, sleepEntriesInWindow: sleeps.length };
      say(`sleep_entries_in_window: ${sleeps.length}`);
      if (sleeps.length > 0) {
        state.void = true;
        writeFileSync(
          path.join(dir, VOID_MARKER),
          `The host was suspended during this read session: ${sleeps.length} Sleep entr${sleeps.length === 1 ? 'y' : 'ies'} inside ${state.startedLocal} … ${state.endedLocal}.\nThe session is VOID, not red: keep this directory and make the session again under the next -rN suffix of the same label.\n\n${sleeps.join('\n')}\n`
        );
      }

      const stepsGreen = state.steps.length === STEPS.length && state.steps.every((step) => step.status === 0);
      const relationsHold = readsOf(plan).every((name) => Array.isArray(state.relations[name]) && state.relations[name].length > 0 && state.relations[name].every((r) => r.holds));
      const teardownGreen = record.project?.status === 0 && record.portFree === true && (!PLANS[plan].usersTeardown || record.users?.status === 0);
      state.exit = state.interruptedBy ? 130 : state.void ? 3 : stepsGreen && relationsHold && teardownGreen ? 0 : 1;
      writeState();
      writeFileSync(path.join(dir, 'ended'), `${endedAt.toISOString()}\n`);
      say(`ended: exit ${state.exit}`);
    })();
    return teardownPromise;
  };

  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
    process.on(signal, () => {
      if (!state.interruptedBy) state.interruptedBy = signal;
      teardown(`signal ${signal}`).finally(() => process.exit(130));
    });
  }

  let reason = 'the steps ended';
  try {
    writeState();
    say(`head ${head}; plan ${plan}; port ${port}; project ${projectId}`);
    const clean = await runLogged('yarn', ['dev:clean'], { env: process.env, logFile: path.join(dir, '00-dev-clean.log'), timeoutMs: 120_000 });
    state.devClean = clean;
    if (clean.status !== 0) throw new Error(`yarn dev:clean exited ${clean.status}`);
    if (stopping) throw new Error('interrupted');

    const serverLog = openSync(path.join(dir, 'devserver.log'), 'a');
    server = spawn('yarn', ['workspace', '@openvaa/frontend', 'dev'], {
      cwd: REPO_ROOT,
      env: { ...process.env, FRONTEND_PORT: String(port), PUBLIC_PROJECT_ID: projectId },
      detached: true,
      stdio: ['ignore', serverLog, serverLog]
    });
    closeSync(serverLog);
    state.server = { started: true, listened: false, pid: server.pid };
    writeState();
    const listenBy = Date.now() + Math.min(SERVER_LISTEN_MS, remaining());
    while (!stopping) {
      if (server.exitCode !== null || server.signalCode !== null) throw new Error(`the dev server exited before listening (see ${dir}/devserver.log)`);
      if (portListening(port)) {
        state.server.listened = true;
        break;
      }
      if (Date.now() > listenBy) throw new Error(`the dev server did not listen on ${port} within ${SERVER_LISTEN_MS / 1000}s`);
      await sleep(1_000);
    }
    state.server.listenedAfterMs = Date.now() - startedAt.getTime();
    writeState();
    say(`dev server listening on ${port}`);

    for (let i = 0; i < STEPS.length; i += 1) {
      const step = STEPS[i];
      if (stopping) break;
      if (Date.now() >= deadline) {
        reason = `the session's ceiling of ${SESSION_MS / 60_000} minutes`;
        break;
      }
      const entry = { name: step.name, kind: step.kind, status: null, durationMs: null };
      state.steps.push(entry);
      say(`step ${step.name}`);
      if (step.kind === 'project') {
        entry.project = step.project;
        entry.log = `${String(i + 1).padStart(2, '0')}-${step.name}.log`;
        const result = await runProject(step.project, entry.log, Math.min(PROJECT_STEP_MS, remaining()), step.config ? { config: step.config, env: viewsEnv } : {});
        Object.assign(entry, result);
      } else {
        const began = Date.now();
        try {
          if (!browser) {
            const { chromium } = await import('@playwright/test');
            browser = await chromium.launch();
          }
          const budget = remaining();
          let timer;
          const result = await Promise.race([
            READS[step.name]({ browser, base, results, viewSessions }),
            new Promise((_, reject) => {
              timer = setTimeout(() => reject(new Error(`the read did not end within the ${Math.round(budget / 1000)}s left of the session`)), budget);
            })
          ]).finally(() => clearTimeout(timer));
          results[step.name] = result;
          state.relations[step.name] = result.relations;
          writeFileSync(path.join(dir, `${step.name}.json`), `${JSON.stringify({ read: step.name, label, head, takenUtc: new Date().toISOString(), ...result }, null, 2)}\n`);
          entry.file = `${step.name}.json`;
          entry.status = 0;
          for (const relation of result.relations) say(`  ${relation.holds ? 'holds        ' : 'DOES NOT HOLD'} ${relation.id}: ${relation.observed}`);
        } catch (error) {
          entry.status = 1;
          entry.error = String(error?.stack ?? error).split('\n').slice(0, 12).join('\n');
          say(`  the read failed: ${entry.error.split('\n')[0]}`);
        }
        entry.durationMs = Date.now() - began;
      }
      writeState();
      say(`step ${step.name}: status ${entry.status} in ${entry.durationMs} ms`);
      if (entry.status !== 0) {
        reason = `step ${step.name} ended with status ${entry.status}`;
        break;
      }
    }
    for (const step of STEPS.slice(state.steps.length)) state.steps.push({ name: step.name, kind: step.kind, status: 'not run', durationMs: null });
  } catch (error) {
    reason = String(error?.message ?? error);
    state.error = String(error?.stack ?? error).split('\n').slice(0, 12).join('\n');
    say(`error: ${reason}`);
    for (const step of STEPS.slice(state.steps.length)) state.steps.push({ name: step.name, kind: step.kind, status: 'not run', durationMs: null });
  } finally {
    await teardown(reason);
  }
  process.exit(state.exit ?? 1);
}

// ── judge ────────────────────────────────────────────────────────────────────────────────────────

function judge(args) {
  if (args.length !== 1) usage('judge takes exactly one <label>');
  const dir = resolveRun(READS_ROOT, args[0]);
  const what = `174.1-read judge ${path.basename(dir)}`;
  console.log(`session: ${dir}`);
  const sessionFile = path.join(dir, 'session.json');
  const state = existsSync(sessionFile) ? JSON.parse(readFileSync(sessionFile, 'utf8')) : null;
  if (existsSync(path.join(dir, VOID_MARKER)) || state?.void === true) {
    console.log(`${what}: VOID — the host was suspended during the session (${state?.teardown?.power?.sleepEntriesInWindow ?? 'see the marker'} Sleep entr(ies) inside its window). It is neither a pass nor a finding: make the session again under the next -rN suffix of the same label.`);
    process.exit(3);
  }
  const failures = [];
  const fail = (message) => failures.push(message);
  const plan = state?.plan ?? 'gate';
  if (!Object.hasOwn(PLANS, plan)) usage(`${sessionFile} names the plan '${plan}', which this script does not hold`);

  if (!state) fail(`${sessionFile} is missing`);
  if (!existsSync(path.join(dir, 'ended'))) fail(`${dir}/ended is missing: the session did not reach the end of its teardown`);
  if (state) {
    console.log(`window: ${state.startedLocal} … ${state.endedLocal ?? '(not ended)'}; plan ${plan}; port ${state.port}; project ${state.projectId}; session exit ${state.exit}`);
    const expected = PLANS[plan].steps.map((step) => step.name);
    const names = (state.steps ?? []).map((step) => step.name);
    if (names.join(' ') !== expected.join(' ')) fail(`the session holds the steps '${names.join(',')}', not '${expected.join(',')}'`);
    for (const step of state.steps ?? []) {
      console.log(`step ${step.name}: status ${step.status}${step.durationMs === null ? '' : ` in ${step.durationMs} ms`}`);
      if (step.status !== 0) fail(`step ${step.name} has status ${step.status}`);
    }
    const teardown = state.teardown;
    if (!teardown) fail('the session records no teardown');
    else {
      console.log(`teardown (${teardown.reason}): ${PLANS[plan].usersTeardown ? `views-users-unregister status ${teardown.users?.status ?? 'none'}; ` : ''}data-teardown-base status ${teardown.project?.status ?? 'none'}; port free: ${teardown.portFree}; sleep_entries_in_window: ${teardown.power?.sleepEntriesInWindow ?? 'unknown'}${teardown.note ? `; ${teardown.note}` : ''}`);
      if (PLANS[plan].usersTeardown && teardown.users?.status !== 0) fail(`the users' teardown project has status ${teardown.users?.status ?? 'none'}: the two users of the plan are not shown to be removed`);
      if (teardown.project?.status !== 0) fail(`the teardown project has status ${teardown.project?.status ?? 'none'}: the dataset is not shown to be cleared`);
      if (teardown.portFree !== true) fail('the session did not record a free port at its end');
      if (teardown.power?.available !== true) fail('the session could not read the host\'s power log, so its window is not shown to hold no Sleep entry');
    }
    if (state.interruptedBy) fail(`the session was interrupted by ${state.interruptedBy}`);
  }
  for (const name of readsOf(plan)) {
    const file = path.join(dir, `${name}.json`);
    if (!existsSync(file)) {
      fail(`${file} is missing`);
      continue;
    }
    const relations = JSON.parse(readFileSync(file, 'utf8')).relations ?? [];
    if (relations.length === 0) fail(`${file} holds no relation`);
    for (const relation of relations) {
      console.log(`${relation.holds ? 'holds        ' : 'DOES NOT HOLD'} ${relation.id} — ${relation.statement}\n                 observed: ${relation.observed}`);
      if (!relation.holds) fail(`${name}: relation ${relation.id} does not hold`);
    }
  }
  const headFile = path.join(dir, 'head');
  if (!existsSync(headFile)) fail(`${headFile} is missing`);
  else {
    const head = read(headFile);
    const r = spawnSync('git', ['diff', '--quiet', head, 'HEAD', '--', '.', ':(exclude).planning']);
    if (r.status !== 0) fail(`${dir} is stale: its head ${head.slice(0, 9)} differs from HEAD outside .planning/`);
    else console.log(`not stale: head ${head.slice(0, 9)} is tree-equal to HEAD outside .planning/`);
  }
  for (const f of failures) console.error(`FAIL ${f}`);
  console.log(failures.length ? `${what}: FAIL (${failures.length})` : `${what}: PASS`);
  process.exit(failures.length ? 1 : 0);
}

const [command, ...rest] = process.argv.slice(2);
if (command === 'session') await session(rest);
else if (command === 'judge') judge(rest);
else usage(command ? `unknown subcommand '${command}'` : 'a subcommand is required');
