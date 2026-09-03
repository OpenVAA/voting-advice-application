import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@6.9.10';
import { decodeJwtSegment } from './jwtSegment.ts';
import { renderTemplate } from './templateVars.ts';
import { requireEnv } from './envConfig.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

interface SendEmailRequest {
  templates: Record<string, { subject: string; body: string }>;
  recipient_user_ids: string[];
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

    const { templates, recipient_user_ids, from, dry_run } = body;

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

    // Read the roles claim the Custom Access Token Hook wrote, to decide whether this caller may send in bulk. RFC 7515 section 2 requires JOSE segments to be base64url, whose alphabet substitutes `-` and `_` for the base64 `+` and `/`; the platform decoder implements plain base64 and rejects both characters, so decoding this segment as base64 turns an authorisation check into a 500 on any token whose payload happens to contain one (REVIEW-EDGE-01).
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(decodeJwtSegment(token.split('.')[1]));
    const userRoles: Array<{ role: string; scope_type: string; scope_id: string }> = payload.user_roles || [];

    const isAdmin = userRoles.some(
      (r) => r.role === 'super_admin' || r.role === 'account_admin' || r.role === 'project_admin'
    );

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: caller does not have admin role' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // -------------------------------------------------------------------------
    // 3. Create admin client (service_role) and resolve template variables
    // -------------------------------------------------------------------------
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Argument names must match the SQL function's parameter names exactly: PostgREST resolves overloads by named argument, and `resolve_email_variables` declares p_user_ids / p_template_body / p_template_subject (schema/502-email-helpers.sql:22-25).
    const { data: recipients, error: rpcError } = await supabaseAdmin.rpc('resolve_email_variables', {
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
        body: renderTemplate(template.body, vars)
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

    // The caller's override stays the first operand; only the final fallback changes. An unset sender used to assume an organisational identity that the deployment may not own, which is a spoofing risk rather than a convenience -- so the configured sender is now required instead of guessed (REVIEW-EDGE-02).
    const senderAddress = from || requireEnv('SMTP_FROM', Deno.env.get('SMTP_FROM'));
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
          html: rendered.body
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
