import { describe, expectTypeOf, test } from 'vitest';
import type { DynamicSettings } from './dynamicSettings.type';

/**
 * Phase 90 Plan 01 (Stage A — D-90-10 / TIR5:28-50):
 * DynamicSettings must accept an OPTIONAL `i18n.supportedLocales` runtime override
 * that mirrors the StaticSettings.supportedLocales shape. When present, the override
 * REPLACES `staticSettings.supportedLocales` at runtime; absent, behaviour is
 * unchanged (no regression for baseV1 / e2e / 89-04 perm templates).
 */
describe('DynamicSettings — optional i18n.supportedLocales override (Phase 90 Plan 01)', () => {
  test('Type: i18n root is optional and may be omitted', () => {
    expectTypeOf<DynamicSettings['i18n']>().toEqualTypeOf<
      | {
          readonly supportedLocales?: ReadonlyArray<{
            readonly code: string;
            readonly name: string;
            readonly isDefault?: boolean;
          }>;
        }
      | undefined
    >();
  });

  test('Type: a valid override is structurally assignable', () => {
    const override: NonNullable<DynamicSettings['i18n']> = {
      supportedLocales: [{ code: 'en', name: 'English', isDefault: true }]
    };
    expectTypeOf(override).toMatchTypeOf<NonNullable<DynamicSettings['i18n']>>();
  });

  test('Type: omitting the override is allowed (backwards compatible)', () => {
    const i18n: DynamicSettings['i18n'] = undefined;
    expectTypeOf(i18n).toMatchTypeOf<DynamicSettings['i18n']>();
  });
});
