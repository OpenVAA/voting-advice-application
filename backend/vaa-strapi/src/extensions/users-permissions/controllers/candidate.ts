import { errors, validateYupSchema, yup } from '@strapi/utils';
import { validatePassword } from '@openvaa/app-shared';
import type { Context } from 'koa';
import type { Data } from '@strapi/strapi';

const { ValidationError, ApplicationError } = errors;

type CandidateApi = 'api::candidate.candidate';

const validateCheckBody = validateYupSchema(
  yup.object({
    registrationKey: yup.string().required()
  })
);

const validateRegisterBody = validateYupSchema(
  yup.object({
    registrationKey: yup.string().required(),
    password: yup.string().required()
  })
);

const validatePreregisterBody = validateYupSchema(
  yup.object({
    firstName: yup.string().required(),
    lastName: yup.string().required(),
    identifier: yup.string().required(),
    email: yup.string().required(),
    nominations: yup.array(yup.object({ electionId: yup.string(), constituencyId: yup.string() })),
    extra: yup.object({
      emailTemplate: yup.object({
        subject: yup.string().required(),
        text: yup.string().required(),
        html: yup.string().required()
      })
    })
  })
);

/**
 * Check that the registration key is valid for the Candidate and the User associated with it does not yet exist.
 * @returns An object with the candidate object along with the email associated with the registration key.
 */
async function check(ctx: Context): Promise<Pick<Data.ContentType<CandidateApi>, 'firstName' | 'lastName' | 'email'>> {
  const params = ctx.request.body;
  await validateCheckBody(params);

  const { firstName, lastName, email } = await getCandidate(params.registrationKey).catch((e) => {
    throw e;
  });
  return {
    firstName,
    lastName,
    email
  };
}

/**
 * Register a new User for the Candidate using the provided registration key and password.
 * @returns { success: true }
 */
async function register(ctx: Context): Promise<{ type: 'success' }> {
  const params: {
    registrationKey: string;
    password: string;
  } = ctx.request.body;

  await validateRegisterBody(params);

  const valid = validatePassword(params.password);
  if (!valid) throw new ValidationError('Password does not meet requirements');

  const candidate = await getCandidate(params.registrationKey).catch((e) => {
    throw e;
  });

  const pluginStore = strapi.store({ type: 'plugin', name: 'users-permissions' });
  const settings = (await pluginStore.get({ key: 'advanced' })) as { default_role: string };

  const role = await strapi.query('plugin::users-permissions.role').findOne({ where: { type: settings.default_role } });

  if (!role) throw new ApplicationError('Impossible to find the default role');

  const user = await strapi.plugin('users-permissions').service('user').add({
    role: role.id,
    username: candidate.email,
    email: candidate.email,
    password: params.password,
    provider: 'local',
    confirmed: true
  });

  await strapi.documents('api::candidate.candidate').update({
    documentId: candidate.documentId,
    data: {
      registrationKey: null,
      user: user.id
    }
  });

  return {
    type: 'success'
  };
}

/**
 * Preregister a Candidate.
 * @access Authorization: Bearer {BACKEND_API_TOKEN}
 * @returns { success: true }
 */
async function preregister(ctx: Context): Promise<{ type: 'success' }> {
  const params: {
    firstName: string;
    lastName: string;
    identifier: string;
    email: string;
    nominations: Array<{ electionId: string; constituencyId: string }>;
    extra: {
      emailTemplate: {
        subject: string;
        text: string;
        html: string;
      };
    };
  } = ctx.request.body;

  await validatePreregisterBody(params);

  const { firstName, lastName, identifier, nominations, extra } = params;
  const email = params.email.trim().toLowerCase();

  const candidate =
    (await strapi.documents('api::candidate.candidate').findFirst({ filters: { email: { $eqi: email } } })) ??
    (await strapi.documents('api::candidate.candidate').findFirst({
      filters: {
        firstName: { $eqi: firstName },
        lastName: { $eqi: lastName },
        identifier: { $eqi: identifier }
      }
    }));

  if (candidate) {
    throw new ValidationError('CANDIDATE_CONFLICT');
  }

  const { documentId: candidateDocumentId, registrationKey } = await strapi
    .documents('api::candidate.candidate')
    .create({
      data: {
        email: email.trim().toLocaleLowerCase(),
        firstName,
        lastName,
        identifier,
        // The user must’ve accepted the terms of use to be able to register
        termsOfUseAccepted: new Date()
      }
    });

  await Promise.all(
    nominations.map(
      async (nomination) =>
        await strapi.documents('api::nomination.nomination').create({
          data: {
            candidate: candidateDocumentId,
            election: nomination.electionId,
            electionRound: 1,
            constituency: nomination.constituencyId,
            unconfirmed: true
          }
        })
    )
  );

  await strapi.plugins['email'].services.email.sendTemplatedEmail({ to: email }, extra.emailTemplate, {
    candidate: {
      firstName,
      registrationKey
    }
  });

  return { type: 'success' };
}

/**
 * Get the Candidate with the registration key and check that the user does not exist.
 */
async function getCandidate(registrationKey: string): Promise<Data.ContentType<CandidateApi>> {
  const candidate = (
    await strapi.documents('api::candidate.candidate').findMany({
      populate: ['user'],
      where: { registrationKey }
    })
  )[0];
  if (!candidate) throw new ValidationError('Incorrect registration key');
  if (candidate.user) throw new ValidationError('The user associated with the registration key is already registered.');
  return candidate;
}

module.exports = {
  check,
  register,
  preregister
};
