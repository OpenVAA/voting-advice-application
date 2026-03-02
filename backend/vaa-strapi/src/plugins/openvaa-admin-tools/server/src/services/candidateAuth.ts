import { validatePassword } from '@openvaa/app-shared';
import crypto from 'crypto';
import type { Core } from '@strapi/strapi';
import type {
  CandidateAuthActionResult,
  CandidateInfo,
  CandidateSearchResult,
} from './candidateAuth.type';

if (!process.env.PUBLIC_BROWSER_FRONTEND_URL)
  throw new Error('Missing PUBLIC_BROWSER_FRONTEND_URL environment variable');

export default function service({ strapi }: { strapi: Core.Strapi }) {
  return {
    /**
     * Search candidates by free-text query matching firstName, lastName, email, or documentId.
     */
    searchCandidates: async ({ query }: { query: string }): Promise<CandidateAuthActionResult> => {
      if (!query || query.trim().length === 0) {
        return { type: 'failure', cause: 'Query is required' };
      }

      const trimmed = query.trim();

      const candidates = await strapi.documents('api::candidate.candidate').findMany({
        filters: {
          $or: [
            { firstName: { $containsi: trimmed } },
            { lastName: { $containsi: trimmed } },
            { email: { $containsi: trimmed } },
            { documentId: { $containsi: trimmed } },
          ],
        },
        populate: ['user'],
        limit: 20,
      });

      const results: Array<CandidateSearchResult> = candidates.map((c) => ({
        documentId: c.documentId,
        firstName: c.firstName ?? '',
        lastName: c.lastName ?? '',
        email: c.email ?? '',
        isRegistered: !!c.user,
      }));

      return { type: 'success', candidates: results };
    },

    /**
     * Fetch detailed info for a single candidate including registration status and URLs.
     */
    getCandidateInfo: async ({
      documentId,
    }: {
      documentId: string;
    }): Promise<CandidateAuthActionResult> => {
      const candidate = await strapi.documents('api::candidate.candidate').findOne({
        documentId,
        populate: ['user'],
      });

      if (!candidate) {
        return { type: 'failure', cause: 'Candidate not found' };
      }

      const isRegistered = !!candidate.user;
      const info: CandidateInfo = {
        documentId: candidate.documentId,
        firstName: candidate.firstName ?? '',
        lastName: candidate.lastName ?? '',
        email: candidate.email ?? '',
        isRegistered,
      };

      if (!isRegistered && candidate.registrationKey) {
        info.registrationKey = candidate.registrationKey;
        const url = new URL(process.env.PUBLIC_BROWSER_FRONTEND_URL!);
        url.pathname = '/candidate/register';
        url.searchParams.append('registrationKey', candidate.registrationKey);
        info.registrationUrl = url.toString();
      }

      if (isRegistered && candidate.user) {
        info.userId = candidate.user.id;
      }

      return { type: 'success', candidate: info };
    },

    /**
     * Force-register an unregistered candidate by creating a user and linking it.
     */
    forceRegister: async ({
      documentId,
      password,
    }: {
      documentId: string;
      password: string;
    }): Promise<CandidateAuthActionResult> => {
      const candidate = await strapi.documents('api::candidate.candidate').findOne({
        documentId,
        populate: ['user'],
      });

      if (!candidate) {
        return { type: 'failure', cause: 'Candidate not found' };
      }

      if (candidate.user) {
        return { type: 'failure', cause: 'Candidate is already registered' };
      }

      if (!candidate.email) {
        return { type: 'failure', cause: 'Candidate has no email address' };
      }

      const valid = validatePassword(password, candidate.email);
      if (!valid) {
        return { type: 'failure', cause: 'Password does not meet requirements' };
      }

      // Follow the same registration pattern as candidate.ts register()
      const pluginStore = strapi.store({ type: 'plugin', name: 'users-permissions' });
      const settings = (await pluginStore.get({ key: 'advanced' })) as { default_role: string };

      const role = await strapi
        .query('plugin::users-permissions.role')
        .findOne({ where: { type: settings.default_role } });

      if (!role) {
        return { type: 'failure', cause: 'Could not find the default role' };
      }

      const user = await strapi.plugin('users-permissions').service('user').add({
        role: role.id,
        username: candidate.email,
        email: candidate.email,
        password,
        provider: 'local',
        confirmed: true,
      });

      await strapi.documents('api::candidate.candidate').update({
        documentId: candidate.documentId,
        // registrationKey is private in the schema so it's not in the Input type
        data: { registrationKey: null, user: user.id } as Record<string, unknown>,
      });

      return { type: 'success' };
    },

    /**
     * Send a forgot-password email to a registered candidate and return the reset URL.
     */
    sendForgotPasswordEmail: async ({
      documentId,
    }: {
      documentId: string;
    }): Promise<CandidateAuthActionResult> => {
      const candidate = await strapi.documents('api::candidate.candidate').findOne({
        documentId,
        populate: ['user'],
      });

      if (!candidate) {
        return { type: 'failure', cause: 'Candidate not found' };
      }

      if (!candidate.user) {
        return { type: 'failure', cause: 'Candidate is not registered' };
      }

      const userId = candidate.user.id;

      // Generate reset token
      const resetPasswordToken = crypto.randomBytes(64).toString('hex');

      // Save token on user
      await strapi.plugin('users-permissions').service('user').edit(userId, { resetPasswordToken });

      // Build reset URL using the same pattern as strapi-server.ts bootstrap
      const url = new URL(process.env.PUBLIC_BROWSER_FRONTEND_URL!);
      url.pathname = '/candidate/password-reset';
      const resetUrl = `${url.toString()}?code=${resetPasswordToken}`;

      // Send reset email using Strapi's email plugin with the configured template
      try {
        const pluginStore = strapi.store({ type: 'plugin', name: 'users-permissions' });
        const emailTemplate = (await pluginStore.get({ key: 'email' })) as Record<
          string,
          { options: { message: string; object: string } }
        >;
        const resetPasswordTemplate = emailTemplate?.['reset_password'];

        if (resetPasswordTemplate) {
          await strapi.plugins['email'].services.email.sendTemplatedEmail(
            { to: candidate.email },
            {
              subject: resetPasswordTemplate.options.object,
              text: resetPasswordTemplate.options.message,
              html: resetPasswordTemplate.options.message,
            },
            {
              URL: url.toString(),
              TOKEN: resetPasswordToken,
              USER: candidate.user,
            }
          );
        } else {
          // Fallback: send a simple email
          await strapi.plugins['email'].services.email.send({
            to: candidate.email,
            subject: 'Password Reset',
            text: `You can reset your password using the following link: ${resetUrl}`,
          });
        }
      } catch (error) {
        strapi.log.error('candidateAuth.sendForgotPasswordEmail email sending failed', error);
        // Still return the reset URL even if email fails, so admin can copy it
      }

      return { type: 'success', resetUrl };
    },

    /**
     * Manually set the password for a registered candidate.
     */
    setPassword: async ({
      documentId,
      password,
    }: {
      documentId: string;
      password: string;
    }): Promise<CandidateAuthActionResult> => {
      const candidate = await strapi.documents('api::candidate.candidate').findOne({
        documentId,
        populate: ['user'],
      });

      if (!candidate) {
        return { type: 'failure', cause: 'Candidate not found' };
      }

      if (!candidate.user) {
        return { type: 'failure', cause: 'Candidate is not registered' };
      }

      const valid = validatePassword(password, candidate.email ?? '');
      if (!valid) {
        return { type: 'failure', cause: 'Password does not meet requirements' };
      }

      await strapi
        .plugin('users-permissions')
        .service('user')
        .edit(candidate.user.id, { password });

      return { type: 'success' };
    },

    /**
     * Generate a random password that meets all validation constraints.
     */
    generatePassword: async ({
      username,
    }: {
      username: string;
    }): Promise<CandidateAuthActionResult> => {
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const digits = '0123456789';
      const special = '!@#$%^&*()-_=+[]{}|;:,.<>?';
      const all = uppercase + lowercase + digits + special;

      const maxAttempts = 10;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Ensure at least one of each category
        const chars: Array<string> = [
          uppercase[crypto.randomInt(uppercase.length)],
          lowercase[crypto.randomInt(lowercase.length)],
          digits[crypto.randomInt(digits.length)],
          special[crypto.randomInt(special.length)],
        ];

        // Fill the rest (16 chars total)
        for (let i = chars.length; i < 16; i++) {
          chars.push(all[crypto.randomInt(all.length)]);
        }

        // Shuffle using Fisher-Yates
        for (let i = chars.length - 1; i > 0; i--) {
          const j = crypto.randomInt(i + 1);
          [chars[i], chars[j]] = [chars[j], chars[i]];
        }

        const password = chars.join('');

        if (validatePassword(password, username)) {
          return { type: 'success', password };
        }
      }

      return {
        type: 'failure',
        cause: 'Failed to generate a valid password after multiple attempts',
      };
    },
  };
}
