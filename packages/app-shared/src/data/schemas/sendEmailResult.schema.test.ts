/**
 * `SendEmailResultSchema` — the return shape of the `send-email` Edge Function.
 *
 * Covers the three branches the function can return (the 200 success, the 500 all-failed and the dry run), the two members every branch carries, and one unknown-key rejection per nesting level.
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
    const result = SendEmailResultSchema.safeParse({
      success: true,
      dry_run: true,
      results: [{ user_id: 'u1', email: 'a@example.test', subject: 'Hello', body: 'Body text.' }]
    });
    expect(result.success === false ? result.error.issues : result.success).toBe(true);
  });

  it('accepts an empty `results` array', () => {
    expect(
      SendEmailResultSchema.safeParse({ success: true, sent: 0, failed: 0, dry_run: false, results: [] }).success
    ).toBe(true);
  });

  it('rejects a payload with no `success` — every branch returns it', () => {
    const result = SendEmailResultSchema.safeParse({ sent: 0, failed: 0, dry_run: false, results: [] });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.path).toEqual(['success']);
  });

  it('rejects a payload with no `dry_run` — every branch returns it', () => {
    const result = SendEmailResultSchema.safeParse({ success: true, sent: 0, failed: 0, results: [] });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.path).toEqual(['dry_run']);
  });

  it('LEVEL 1: rejects an unknown key at the top level', () => {
    const result = SendEmailResultSchema.safeParse({
      success: true,
      sent: 1,
      failed: 0,
      dry_run: false,
      results: [],
      bogusTopLevel: 1
    });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.message).toMatch(/Unrecognized key/);
    expect(result.success === false && JSON.stringify(result.error.issues)).toMatch(/bogusTopLevel/);
  });

  it('LEVEL 2: rejects an unknown key inside a `results` entry', () => {
    // Top-level strictness alone does not reach into an array element: at zod 4.3.6 a top-level-only strict schema parses this input and silently strips `bogusResultKey`.
    const result = SendEmailResultSchema.safeParse({
      success: true,
      sent: 1,
      failed: 0,
      dry_run: false,
      results: [{ user_id: 'u1', email: 'a@example.test', status: 'sent', bogusResultKey: 1 }]
    });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.message).toMatch(/Unrecognized key/);
    expect(result.success === false && result.error.issues[0]?.path).toEqual(['results', 0]);
  });

  it('rejects a `status` outside the `sent` / `failed` pair', () => {
    const result = SendEmailResultSchema.safeParse({
      success: true,
      dry_run: false,
      results: [{ user_id: 'u1', email: 'a@example.test', status: 'queued' }]
    });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.path).toEqual(['results', 0, 'status']);
  });

  it('rejects a `results` entry with no `user_id` — every push site in the function sets one', () => {
    const result = SendEmailResultSchema.safeParse({
      success: true,
      dry_run: false,
      results: [{ email: 'a@example.test' }]
    });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.path).toEqual(['results', 0, 'user_id']);
  });

  it('rejects a missing `results` — all three branches return it', () => {
    const result = SendEmailResultSchema.safeParse({ success: true, sent: 0, failed: 0, dry_run: false });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.path).toEqual(['results']);
  });
});
