import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import nodemailer from 'npm:nodemailer@10.0.11';
import { BASE_CORS_HEADERS, jsonAnswer } from '../_shared/cors.ts';
import { isDeploymentProject } from '../_shared/deploymentProject.ts';
import { requireEnv } from '../_shared/envConfig.ts';
import { configuredSender, smtpTransportConfig } from '../_shared/mailTransport.ts';
import { callerMayOnProject } from './callerAuthority.ts';
import { renderTemplate, renderTemplateHtml } from './templateVars.ts';
import type { SmtpEnv } from '../_shared/mailTransport.ts';

interface SendEmailRequest {
  templates: Record<string, { subject: string; body: string }>;
  recipient_user_ids: string[];
  /** The project whose candidate, organization and nomination names may be rendered into these messages. Required, and honoured only when it names the project this deployment serves. */
  project_id: string;
  from?: string;
  dry_run?: boolean;
}

interface RecipientResult {
  user_id: string;
  email: string;
  status?: string;
  error?: string;
  subject?: string;
  body?: string;
}

/** The handler of every request: the body validated, the caller's authority, the recipients' variables, and the mails rendered and sent or, on a dry run, returned. */
async function handleRequest(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: BASE_CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return jsonAnswer({ error: 'Method not allowed' }, 405);
  }

  try {
    // -------------------------------------------------------------------------
    // 1. Parse and validate request body
    // -------------------------------------------------------------------------
    let body: SendEmailRequest;
    try {
      body = await req.json();
    } catch {
      return jsonAnswer({ error: 'Invalid or missing request body' }, 400);
    }

    const { templates, recipient_user_ids, project_id, from, dry_run } = body;

    // Validate templates
    if (!templates || typeof templates !== 'object' || Object.keys(templates).length === 0) {
      return jsonAnswer({ error: 'templates must be a non-empty object with locale keys' }, 400);
    }

    for (const [locale, tmpl] of Object.entries(templates)) {
      if (!tmpl || typeof tmpl.subject !== 'string' || typeof tmpl.body !== 'string') {
        return jsonAnswer(
          {
            error: `Template for locale "${locale}" must have "subject" and "body" strings`
          },
          400
        );
      }
    }

    // Validate recipient_user_ids
    if (!Array.isArray(recipient_user_ids) || recipient_user_ids.length === 0) {
      return jsonAnswer({ error: 'recipient_user_ids must be a non-empty array' }, 400);
    }

    // -------------------------------------------------------------------------
    // 2. Verify caller is admin
    // -------------------------------------------------------------------------
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonAnswer({ error: 'Missing Authorization header' }, 401);
    }

    // Verify the token is valid server-side via getUser()
    const callerClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const {
      data: { user: callerUser },
      error: userError
    } = await callerClient.auth.getUser();

    if (userError || !callerUser) {
      return jsonAnswer({ error: 'Invalid or expired authentication token' }, 401);
    }

    // THE PERMISSION BULK SEND ASKS FOR IS `project.edit_entities`, ON THE PROJECT NAMED IN THE REQUEST. It is an existing member of the permission vocabulary, so nothing is widened to accommodate this gate. No entity grant holds it, which is what keeps a candidate or an organization editor from mailing every recipient in the project.
    //
    // THE DECISION IS THE DATABASE'S, asked through the caller's own token. A TypeScript copy of the matrix over the raw `grants` claim cannot make it: resolving which account owns the project is a reach rule only `user_can` holds, so a copy's account arm admits an account admin of ANY account.
    //
    // A non-string or blank project_id is a denial inside the helper, before any round trip -- so an absent value can never compare equal to anything. The request's project_id is additionally required to match this deployment's configured project, just below.
    const mayBulkSend = await callerMayOnProject(callerClient, project_id, 'project.edit_entities');

    if (!mayBulkSend) {
      return jsonAnswer({ error: 'Forbidden: caller may not send bulk email for this project' }, 403);
    }

    // -------------------------------------------------------------------------
    // 3. Create admin client (service_role) and resolve template variables
    // -------------------------------------------------------------------------
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // The project whose entity names may be rendered into these messages comes from configuration ONLY, and is never defaulted: a deployment that has not chosen a project refuses to run rather than resolving variables out of a project nobody picked. The request body's project_id is therefore not a selection but a claim, and is honoured only when it names that same project. It is REQUIRED rather than optional because there is no safe reading of its absence: the rpc below needs a project, and supplying the configured one on behalf of a caller that named none would let a caller who has not thought about scoping keep sending.
    // The check sits AFTER the admin verification above rather than beside the body validation at the top, so that the difference between "wrong project" and "right project" is not an answer an unauthenticated caller can read off this endpoint. The refusal is a fixed string echoing neither the submitted nor the configured value, for the same reason the catch arm at the bottom of this file returns one.
    const configuredProjectId = requireEnv('PUBLIC_PROJECT_ID', Deno.env.get('PUBLIC_PROJECT_ID')?.trim());

    // Compared case-insensitively after trimming (isDeploymentProject, shared with account-access), so a caller echoing back the configured id in a different case is not refused for a difference that does not exist.
    if (!isDeploymentProject(project_id, configuredProjectId)) {
      return jsonAnswer({ error: 'Invalid project_id' }, 400);
    }

    // A caller-supplied sender is refused unless it IS the configured sender: the deployment's SMTP identity is not the caller's to spoof. Checked after the authority gate so an unauthenticated caller cannot probe the configured address, and answered with a fixed string that echoes neither value.
    if (from !== undefined && from !== null) {
      const sender = configuredSender(smtpEnv());
      if (typeof from !== 'string' || from.trim().toLowerCase() !== sender.trim().toLowerCase()) {
        return jsonAnswer({ error: 'Invalid from' }, 400);
      }
    }

    // Argument names must match the SQL function's parameter names exactly: PostgREST resolves overloads by named argument, and `resolve_email_variables` declares p_project_id / p_user_ids / p_template_body / p_template_subject (schema/502-email-helpers.sql).
    const { data: recipients, error: rpcError } = await supabaseAdmin.rpc('resolve_email_variables', {
      p_project_id: configuredProjectId,
      p_user_ids: recipient_user_ids,
      p_template_body: '',
      p_template_subject: ''
    });

    if (rpcError) {
      return jsonAnswer({ error: 'Failed to resolve template variables', details: rpcError.message }, 500);
    }

    if (!recipients || recipients.length === 0) {
      return jsonAnswer({ error: 'No valid recipients found for the provided user IDs' }, 400);
    }

    // -------------------------------------------------------------------------
    // 4. Render templates per recipient
    // -------------------------------------------------------------------------
    const availableLocales = Object.keys(templates);
    const defaultLocale = availableLocales[0];

    const renderedEmails: Array<{
      user_id: string;
      email: string;
      subject: string;
      body: string;
      html: string;
    }> = [];

    for (const recipient of recipients) {
      // Select template matching recipient's preferred locale, fallback to first available
      const locale = availableLocales.includes(recipient.preferred_locale) ? recipient.preferred_locale : defaultLocale;

      const template = templates[locale];
      const vars: Record<string, string> = recipient.variables || {};

      // Render this recipient's subject and body, substituting `{{ key }}` placeholders with the variables the RPC resolved above; surrounding spaces are tolerated. The key-lookup contract, including why a dotted key is a flat key rather than a path, lives with the pattern in `templateVars.ts`.
      renderedEmails.push({
        user_id: recipient.user_id,
        email: recipient.email,
        subject: renderTemplate(template.subject, vars),
        body: renderTemplate(template.body, vars),
        // The HTML part escapes every substituted value; the template markup itself is the operator's and is left as written.
        html: renderTemplateHtml(template.body, vars)
      });
    }

    // -------------------------------------------------------------------------
    // 5. Dry-run: return rendered content without sending
    // -------------------------------------------------------------------------
    if (dry_run === true) {
      const dryResults: RecipientResult[] = renderedEmails.map((r) => ({
        user_id: r.user_id,
        email: r.email,
        subject: r.subject,
        body: r.body
      }));

      return jsonAnswer(
        {
          success: true,
          dry_run: true,
          results: dryResults
        },
        200
      );
    }

    // -------------------------------------------------------------------------
    // 6. Send emails via SMTP
    // -------------------------------------------------------------------------
    const smtp = smtpEnv();
    const transport = nodemailer.createTransport(smtpTransportConfig(smtp));

    // The sender is always the configured one: a request's `from` is accepted only when it names it, and refused above otherwise.
    const senderAddress = configuredSender(smtp);
    const results: RecipientResult[] = [];
    let sentCount = 0;
    let failedCount = 0;

    for (const rendered of renderedEmails) {
      try {
        await transport.sendMail({
          from: senderAddress,
          to: rendered.email,
          subject: rendered.subject,
          text: rendered.body,
          html: rendered.html
        });

        results.push({
          user_id: rendered.user_id,
          email: rendered.email,
          status: 'sent'
        });
        sentCount++;
      } catch (sendErr) {
        const errorMessage = sendErr instanceof Error ? sendErr.message : 'Unknown send error';
        console.error(`Failed to send email to ${rendered.email}:`, errorMessage);

        results.push({
          user_id: rendered.user_id,
          email: rendered.email,
          status: 'failed',
          error: errorMessage
        });
        failedCount++;
      }
    }

    // If ALL sends failed, return 500
    if (sentCount === 0 && failedCount > 0) {
      return jsonAnswer(
        {
          success: false,
          sent: 0,
          failed: failedCount,
          dry_run: false,
          results
        },
        500
      );
    }

    return jsonAnswer(
      {
        success: true,
        sent: sentCount,
        failed: failedCount,
        dry_run: false,
        results
      },
      200
    );
  } catch (err) {
    // The real error goes to the log and a FIXED LITERAL goes to the caller, with nothing interpolated. This arm receives the three `requireEnv` throws above, whose messages name environment variables; echoing `err.message` here would turn an unconfigured deployment into a configuration-disclosure primitive for anyone who can reach this endpoint. The property that matters is the absence of a template, so the same guarantee holds for throws added later.
    console.error('send-email error:', err);
    return jsonAnswer({ error: 'Internal server error' }, 500);
  }
}

/** The five `SMTP_*` values of the environment. */
function smtpEnv(): SmtpEnv {
  return {
    host: Deno.env.get('SMTP_HOST'),
    port: Deno.env.get('SMTP_PORT'),
    // These two are optional and carry no default: the credentialed and the uncredentialed transport are both deliberate.
    user: Deno.env.get('SMTP_USER'),
    pass: Deno.env.get('SMTP_PASS'),
    sender: Deno.env.get('SMTP_FROM')
  };
}

Deno.serve(handleRequest);
