/**
 * `SendEmailResultSchema` — the measured return shape of the `send-email` Edge Function.
 *
 * Covers all three branches the function can return (the 200 success, the 500 all-failed, and the dry run) plus one unknown-key rejection per nesting level.
 */

import { describe, expect, it } from 'vitest';
import { SendEmailResultSchema } from './sendEmailResult.schema';

describe('SendEmailResultSchema', () => {
  it('accepts the 200 success branch', () => {
    const input = {
      success: true,
      sent: 2,
      failed: 0,
      dry_run: false,
      results: [
        { user_id: 'u1', email: 'a@example.test', status: 'sent' },
        { user_id: 'u2', email: 'b@example.test', status: 'sent' }
      ]
    };
    const result = SendEmailResultSchema.safeParse(input);
    expect(result.success === false ? result.error.issues : result.success).toBe(true);
    expect(result.success && result.data).toEqual(input);
  });

  it('accepts the 500 all-failed branch, whose entries carry an `error`', () => {
    const result = SendEmailResultSchema.safeParse({
      success: false,
      sent: 0,
      failed: 1,
      dry_run: false,
      results: [{ user_id: 'u1', email: 'a@example.test', status: 'failed', error: 'Connection refused' }]
    });
    expect(result.success === false ? result.error.issues : result.success).toBe(true);
  });

  it('accepts the DRY-RUN branch, which omits `sent` and `failed` entirely', () => {
    // The dry-run return is `{ success, dry_run, results }` with no counts at all, which is why `sent` and `failed` are optional rather than required. A schema that required them would reject every dry run.
    const result = SendEmailResultSchema.safeParse({
      success: true,
      dry_run: true,
      results: [{ user_id: 'u1', email: 'a@example.test', subject: 'Hello', body: 'Body text.' }]
    });
    expect(result.success === false ? result.error.issues : result.success).toBe(true);
  });

  it('accepts an empty `results` array', () => {
    expect(SendEmailResultSchema.safeParse({ sent: 0, failed: 0, results: [] }).success).toBe(true);
  });

  it('LEVEL 1: rejects an unknown key at the top level', () => {
    const result = SendEmailResultSchema.safeParse({ sent: 1, failed: 0, results: [], bogusTopLevel: 1 });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.message).toMatch(/Unrecognized key/);
    expect(result.success === false && JSON.stringify(result.error.issues)).toMatch(/bogusTopLevel/);
  });

  it('LEVEL 2: rejects an unknown key inside a `results` entry', () => {
    // Top-level strictness alone does NOT reach into an array element: measured at zod 4.3.6, a top-level-only strict schema parses this input with SUCCESS and silently strips `bogusResultKey`.
    const result = SendEmailResultSchema.safeParse({
      sent: 1,
      failed: 0,
      results: [{ user_id: 'u1', email: 'a@example.test', status: 'sent', bogusResultKey: 1 }]
    });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.message).toMatch(/Unrecognized key/);
    expect(result.success === false && result.error.issues[0]?.path).toEqual(['results', 0]);
  });

  it('rejects a `status` outside the measured `sent` / `failed` pair', () => {
    const result = SendEmailResultSchema.safeParse({
      results: [{ user_id: 'u1', email: 'a@example.test', status: 'queued' }]
    });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.path).toEqual(['results', 0, 'status']);
  });

  it('rejects a `results` entry with no `user_id` — every push site in the function sets one', () => {
    expect(SendEmailResultSchema.safeParse({ results: [{ email: 'a@example.test' }] }).success).toBe(false);
  });

  it('rejects a missing `results` — all three branches return it', () => {
    expect(SendEmailResultSchema.safeParse({ sent: 0, failed: 0 }).success).toBe(false);
  });
});
