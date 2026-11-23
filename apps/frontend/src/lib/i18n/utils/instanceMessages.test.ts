// @vitest-environment node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { assertSupportedLocalesCompiled, instanceMessagesProject, validateInstanceMessages } from './instanceMessages';

const BASE_SETTINGS = {
  baseLocale: 'en',
  locales: ['en', 'fi'],
  modules: ['https://example.invalid/plugin.js'],
  'plugin.inlang.messageFormat': {
    pathPattern: ['./messages/{locale}/about.json', './messages/{locale}/common.json']
  }
};

const BASE_MESSAGES: Record<string, Record<string, unknown>> = {
  en: {
    about: { about: { title: 'About', body: '<p>Read <strong>this</strong></p>' } },
    common: {
      common: {
        hello: 'Hello {name}',
        count: [{ declarations: ['input n'], selectors: ['n'], match: { 'n=1': 'One item', 'n=*': '{n} items' } }]
      }
    }
  },
  fi: {
    about: { about: { title: 'Tietoa', body: '<p>Lue <strong>tämä</strong></p>' } },
    common: {
      common: {
        hello: 'Hei {name}',
        count: [{ declarations: ['input n'], selectors: ['n'], match: { 'n=1': 'Yksi', 'n=*': '{n} kohdetta' } }]
      }
    }
  }
};

let repoRoot: string;
let frontendDir: string;
let instanceDir: string;

beforeEach(() => {
  repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'instance-messages-'));
  frontendDir = path.join(repoRoot, 'apps', 'frontend');
  instanceDir = path.join(repoRoot, 'instance', 'messages');
  fs.mkdirSync(path.join(frontendDir, 'project.inlang'), { recursive: true });
  fs.writeFileSync(path.join(frontendDir, 'project.inlang', 'settings.json'), JSON.stringify(BASE_SETTINGS));
  for (const [locale, files] of Object.entries(BASE_MESSAGES)) {
    fs.mkdirSync(path.join(frontendDir, 'messages', locale), { recursive: true });
    for (const [namespace, content] of Object.entries(files))
      fs.writeFileSync(path.join(frontendDir, 'messages', locale, `${namespace}.json`), JSON.stringify(content));
  }
});

afterEach(() => {
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

/** Writes `instance/messages/<filename>` with `content`, a string written as is or a value written as JSON. */
function writeInstanceFile(filename: string, content: unknown): void {
  fs.mkdirSync(instanceDir, { recursive: true });
  fs.writeFileSync(path.join(instanceDir, filename), typeof content === 'string' ? content : JSON.stringify(content));
}

function generatedSettingsPath(): string {
  return path.join(frontendDir, '.instance', 'project.inlang', 'settings.json');
}

describe('instanceMessagesProject without instance messages', () => {
  test('no instance/messages directory returns the base project and writes nothing', () => {
    expect(instanceMessagesProject({ frontendDir, repoRoot })).toBe('./project.inlang');
    expect(fs.existsSync(path.join(frontendDir, '.instance'))).toBe(false);
  });

  test('a directory holding no .json file returns the base project and writes nothing', () => {
    writeInstanceFile('README.md', '# notes');
    expect(instanceMessagesProject({ frontendDir, repoRoot })).toBe('./project.inlang');
    expect(fs.existsSync(path.join(frontendDir, '.instance'))).toBe(false);
  });
});

describe('instanceMessagesProject with instance messages', () => {
  test('writes the base settings with the rebased patterns and the instance pattern last', () => {
    writeInstanceFile('fi.json', { common: { hello: 'Moi {name}' } });
    expect(instanceMessagesProject({ frontendDir, repoRoot })).toBe('./.instance/project.inlang');
    const written = fs.readFileSync(generatedSettingsPath(), 'utf8');
    expect(written.endsWith('}\n')).toBe(true);
    expect(JSON.parse(written)).toEqual({
      ...BASE_SETTINGS,
      'plugin.inlang.messageFormat': {
        pathPattern: [
          '../messages/{locale}/about.json',
          '../messages/{locale}/common.json',
          '../../../instance/messages/{locale}.json'
        ]
      }
    });
    expect(written).toBe(`${JSON.stringify(JSON.parse(written), null, 2)}\n`);
  });

  test('validateInstanceMessages returns the locales that have an instance file', () => {
    writeInstanceFile('fi.json', { common: { hello: 'Moi {name}' } });
    writeInstanceFile('en.json', { about: { title: 'About us' } });
    expect(validateInstanceMessages({ frontendDir, repoRoot }).sort()).toEqual(['en', 'fi']);
  });

  test('accepts nested and variant overrides that keep the base signature', () => {
    writeInstanceFile('en.json', {
      about: { body: '<p>Please <strong>read</strong></p>' },
      common: { count: [{ declarations: ['input n'], selectors: ['n'], match: { 'n=*': '{n} things' } }] }
    });
    expect(validateInstanceMessages({ frontendDir, repoRoot })).toEqual(['en']);
  });
});

describe('validateInstanceMessages failures', () => {
  test('a key that is not in the base catalogue', () => {
    writeInstanceFile('fi.json', { common: { nope: 'x' } });
    expect(() => validateInstanceMessages({ frontendDir, repoRoot })).toThrow(
      /instance\/messages\/fi\.json.*common\.nope/s
    );
  });

  test('a placeholder set that differs from the base message', () => {
    writeInstanceFile('fi.json', { common: { hello: 'Moi {nimi}' } });
    expect(() => validateInstanceMessages({ frontendDir, repoRoot })).toThrow(
      /instance\/messages\/fi\.json.*common\.hello.*\{name\}.*\{nimi\}/s
    );
  });

  test('an HTML tag set that differs from the base message', () => {
    writeInstanceFile('fi.json', { about: { title: '<script>x</script>' } });
    expect(() => validateInstanceMessages({ frontendDir, repoRoot })).toThrow(
      /instance\/messages\/fi\.json.*about\.title/s
    );
  });

  test.each(['fi-FI.json', 'xx.json'])('a file name that is not a compiled locale: %s', (filename) => {
    writeInstanceFile(filename, { common: { hello: 'Moi {name}' } });
    expect(() => validateInstanceMessages({ frontendDir, repoRoot })).toThrow(
      new RegExp(`instance/messages/${filename.replace('.', '\\.')}.*en, fi`, 's')
    );
  });

  test('invalid JSON', () => {
    writeInstanceFile('fi.json', '{ "common": ');
    expect(() => validateInstanceMessages({ frontendDir, repoRoot })).toThrow(/instance\/messages\/fi\.json/);
  });

  test.each([
    ['an array', '[]'],
    ['a string', '"x"'],
    ['null', 'null']
  ])('a top level that is %s rather than an object', (_label, content) => {
    writeInstanceFile('fi.json', content);
    expect(() => validateInstanceMessages({ frontendDir, repoRoot })).toThrow(/instance\/messages\/fi\.json/);
  });

  test('a symlinked message file', () => {
    const target = path.join(repoRoot, 'elsewhere.json');
    fs.writeFileSync(target, JSON.stringify({ common: { hello: 'Moi {name}' } }));
    fs.mkdirSync(instanceDir, { recursive: true });
    fs.symlinkSync(target, path.join(instanceDir, 'fi.json'));
    expect(() => validateInstanceMessages({ frontendDir, repoRoot })).toThrow(
      /instance\/messages\/fi\.json.*symbolic link/s
    );
    expect(fs.existsSync(path.join(frontendDir, '.instance'))).toBe(false);
  });

  test('a symlinked messages directory', () => {
    const target = path.join(repoRoot, 'elsewhere');
    fs.mkdirSync(target);
    fs.writeFileSync(path.join(target, 'fi.json'), JSON.stringify({ common: { hello: 'Moi {name}' } }));
    fs.mkdirSync(path.dirname(instanceDir), { recursive: true });
    fs.symlinkSync(target, instanceDir);
    expect(() => instanceMessagesProject({ frontendDir, repoRoot })).toThrow(/instance\/messages.*symbolic link/s);
  });
});

describe('assertSupportedLocalesCompiled', () => {
  test('throws naming each supported locale with no compiled catalogue', () => {
    expect(() =>
      assertSupportedLocalesCompiled({
        supportedLocales: [{ code: 'en' }, { code: 'xx' }],
        compiledLocales: ['en', 'fi']
      })
    ).toThrow(/'xx'/);
  });

  test('returns undefined when every supported locale is compiled', () => {
    expect(
      assertSupportedLocalesCompiled({
        supportedLocales: [{ code: 'en' }, { code: 'fi' }],
        compiledLocales: ['en', 'fi']
      })
    ).toBeUndefined();
  });
});
