import { fail, redirect } from '@sveltejs/kit';
import { authenticate, getGeneralUserData } from '$lib/legacy-api/candidate';
import { ROUTE } from '$lib/utils/legacy-navigation';

export const actions = {
  default: async ({ cookies, request, locals }) => {
    const data = await request.formData();
    const email = data.get('email') as string;
    const password = data.get('password') as string;
    const redirectTo = data.get('redirectTo') as string;

    const response = await authenticate(email, password);

    if (!response.ok) return fail(400);

    const { jwt } = await response.json();

    cookies.set('token', jwt, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/'
    });

    const appUserResponse = await getGeneralUserData(jwt);

    // TODO: Do we need a descriptive error message here or on the client
    if (!appUserResponse) return fail(500);

    const localisationCode = appUserResponse.appLanguage?.localisationCode;
    if (localisationCode) {
      locals.currentLocale = localisationCode;
    }

    redirect(303, `/${locals.currentLocale}/${redirectTo || ROUTE.CandAppHome}`);
  }
};
