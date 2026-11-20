// Fixture for `node scripts/assert-declared-imports.mjs --self-test`. Each POSITIVE line names an
// undeclared package and appears in `expected.violations`; no NEGATIVE line does.

// POSITIVE
import { a } from 'undeclared-static';
import type { B } from "undeclared-type-only";
import { type C, d } from '@scope/undeclared-inline-type';
import {
  e,
  f
} from 'undeclared-multiline';
import 'undeclared-side-effect';
export * from 'undeclared-export-star';
export { g } from '@scope/undeclared-export-named/sub/path';
export type { H } from 'undeclared-export-type';
const lazy = await import("undeclared-dynamic");
type Inline = import('undeclared-import-type').T;
import fp from 'undeclared-subpath/fp';
import { x } from 'dev-only';

// NEGATIVE
import { core } from '@openvaa/core';
import { deep } from '@openvaa/core/internal/deep';
import { dep } from 'declared-dep';
import { peer } from 'declared-peer';
import { self } from '@fixture/declared-imports';
import { selfSub } from '@fixture/declared-imports/sub';
import { readFileSync } from 'node:fs';
import { readFile } from 'fs/promises';
import path from 'path';
import { local } from './local';
import { parent } from '../parent';
import { internal } from '#internal';
// import { commented } from 'ghost-line-comment';
/* import { blocked } from 'ghost-block-comment'; */
/**
 * export * from 'ghost-doc-comment';
 */
const message = `Registered prompts from '${name}'`;
const prose = "import x from 'ghost-in-string'";
const url = import.meta.url;
