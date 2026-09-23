import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@6.9.10';
import { callerMayOnProject } from './callerAuthority.ts';
import { renderTemplate, renderTemplateHtml } from './templateVars.ts';
import { requireEnv } from './envConfig.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // -------------------------------------------------------------------------
    // 1. Parse and validate request body
    // -------------------------------------------------------------------------
    let body: SendEmailRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid or missing request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { templates, recipient_user_ids, project_id, from, dry_run } = body;

    // Validate templates
    if (!templates || typeof templates !== 'object' || Object.keys(templates).length === 0) {
      return new Response(JSON.stringify({ error: 'templates must be a non-empty object with locale keys' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    for (const [locale, tmpl] of Object.entries(templates)) {
      if (!tmpl || typeof tmpl.subject !== 'string' || typeof tmpl.body !== 'string') {
        return new Response(
          JSON.stringify({
            error: `Template for locale "${locale}" must have "subject" and "body" strings`
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate recipient_user_ids
    if (!Array.isArray(recipient_user_ids) || recipient_user_ids.length === 0) {
      return new Response(JSON.stringify({ error: 'recipient_user_ids must be a non-empty array' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // -------------------------------------------------------------------------
    // 2. Verify caller is admin
    // -------------------------------------------------------------------------
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
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
      return new Response(JSON.stringify({ error: 'Invalid or expired authentication token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // THE PERMISSION BULK SEND ASKS FOR IS `project.edit_entities`, ON THE PROJECT NAMED IN THE REQUEST. That is the operator's ruling of 2026-09-16, and it is an existing member of the permission vocabulary, so nothing is widened to accommodate this gate. No entity grant holds it, which is what keeps a candidate or an organization editor from mailing every recipient in the project.
    //
    // THE DECISION IS THE DATABASE'S, asked through the caller's own token (162-REVIEW WR-09, WR-02). This used to be a TypeScript copy of the matrix over the raw `grants` claim, and its account arm admitted an account admin of ANY account because resolving which account owns the project is a reach rule only `user_can` holds. SPEC section 9 forbids the second copy; the invite-candidate gate asks the same function the same way.
    //
    // A non-string or blank project_id is a denial inside the helper, before any round trip -- so an absent value can never compare equal to anything. The request's project_id is additionally required to match this deployment's configured project, just below.
    const mayBulkSend = await callerMayOnProject(callerClient, project_id, 'project.edit_entities');

    if (!mayBulkSend) {
      return new Response(JSON.stringify({ error: 'Forbidden: caller may not send bulk email for this project' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // -------------------------------------------------------------------------
    // 3. Create admin client (service_role) and resolve template variables
    // -------------------------------------------------------------------------
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // The project whose entity names may be rendered into these messages comes from configuration ONLY, and is never defaulted: a deployment that has not chosen a project refuses to run rather than resolving variables out of a project nobody picked. The request body's project_id is therefore not a selection but a claim, and is honoured only when it names that same project. It is REQUIRED rather than optional because there is no safe reading of its absence: the rpc below needs a project, and supplying the configured one on behalf of a caller that named none would let a caller who has not thought about scoping keep sending.
    // The check sits AFTER the admin verification above rather than beside the body validation at the top, so that the difference between "wrong project" and "right project" is not an answer an unauthenticated caller can read off this endpoint. The refusal is a fixed string echoing neither the submitted nor the configured value, for the same reason the catch arm at the bottom of this file returns one.
    const configuredProjectId = requireEnv('PUBLIC_PROJECT_ID', Deno.env.get('PUBLIC_PROJECT_ID')?.trim());

    // Compared case-insensitively after trimming, so a caller echoing back the configured id in a different case is not refused for a difference that does not exist.
    if (
      typeof project_id !== 'string' ||
      project_id.trim() === '' ||
      project_id.trim().toLowerCase() !== configuredProjectId.toLowerCase()
    ) {
      return new Response(JSON.stringify({ error: 'Invalid project_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // A caller-supplied sender is refused unless it IS the configured sender (162-REVIEW WR-02): the deployment's SMTP identity is not the caller's to spoof. Checked after the authority gate so an unauthenticated caller cannot probe the configured address, and answered with a fixed string that echoes neither value.
    if (from !== undefined && from !== null) {
      const configuredSender = requireEnv('SMTP_FROM', Deno.env.get('SMTP_FROM'));
      if (typeof from !== 'string' || from.trim().toLowerCase() !== configuredSender.trim().toLowerCase()) {
        return new Response(JSON.stringify({ error: 'Invalid from' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
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
      return new Response(
        JSON.stringify({ error: 'Failed to resolve template variables', details: rpcError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!recipients || recipients.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid recipients found for the provided user IDs' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
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

      // Render this recipient's subject and body, substituting `{{ key }}` placeholders with the variables the RPC resolved above; surrounding spaces are tolerated (REVIEW-EDGE-03). The key-lookup contract, including why a dotted key is a flat key rather than a path, lives with the pattern in `templateVars.ts`.
      renderedEmails.push({
        user_id: recipient.user_id,
        email: recipient.email,
        subject: renderTemplate(template.subject, vars),
        body: renderTemplate(template.body, vars),
        // The HTML part escapes every substituted value; the template markup itself is the operator's and is left as written (162-REVIEW WR-02).
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

      return new Response(
        JSON.stringify({
          success: true,
          dry_run: true,
          results: dryResults
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // -------------------------------------------------------------------------
    // 6. Send emails via SMTP
    // -------------------------------------------------------------------------
    // An unset host used to fall back to the local development mail catcher, which is the worst possible failure shape: every send reported success, so the deployment looked healthy while no recipient ever received anything (REVIEW-EDGE-02).
    const smtpHost = requireEnv('SMTP_HOST', Deno.env.get('SMTP_HOST'));
    // The radix is explicit because the previous call omitted it, leaving the parse of a zero-padded port up to the runtime rather than to this line.
    const smtpPort = parseInt(requireEnv('SMTP_PORT', Deno.env.get('SMTP_PORT')), 10);
    // These two are genuinely optional and carry no default: the credentialed and uncredentialed branches below are both deliberate, so they are NOT converted to throws.
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPass = Deno.env.get('SMTP_PASS');

    const transportConfig: Record<string, unknown> = {
      host: smtpHost,
      port: smtpPort,
      secure: false
    };

    // Add auth if credentials are provided (production SMTP)
    if (smtpUser && smtpPass) {
      transportConfig.auth = { user: smtpUser, pass: smtpPass };
    } else {
      // Local development only (Inbucket/Mailpit serve a self-signed certificate and take no credentials). Certificate verification is NOT relaxed on the credentialed path: doing so would send SMTP_USER/SMTP_PASS over a channel whose peer is unauthenticated.
      transportConfig.tls = { rejectUnauthorized: false };
    }

    const transport = nodemailer.createTransport(transportConfig);

    // The sender is ALWAYS the configured one (162-REVIEW WR-02). A caller-chosen `from` let any caller who passed the gate send as an arbitrary address through the deployment's SMTP identity; the request's `from` is now accepted only when it names the configured sender, and refused above otherwise. Required rather than guessed, as before (REVIEW-EDGE-02).
    const senderAddress = requireEnv('SMTP_FROM', Deno.env.get('SMTP_FROM'));
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
      return new Response(
        JSON.stringify({
          success: false,
          sent: 0,
          failed: failedCount,
          dry_run: false,
          results
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        failed: failedCount,
        dry_run: false,
        results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    // The real error goes to the log and a FIXED LITERAL goes to the caller, with nothing interpolated. This arm now receives the three `requireEnv` throws above, whose messages name environment variables; echoing `err.message` here -- which is what this arm did until Phase 155 -- would have turned an unconfigured deployment into a configuration-disclosure primitive for anyone who can reach this endpoint. The property that matters is the absence of a template, so the same guarantee holds for throws added later.
    console.error('send-email error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
