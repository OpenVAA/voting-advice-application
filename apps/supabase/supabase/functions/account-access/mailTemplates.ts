/**
 * The sign-in mail and the recovery mail in every locale the application has messages for, and the resolution of a requested locale.
 *
 * Pure functions and constants with no Deno imports, no URL imports and no reference to the Deno global, so the module can be imported by both the Edge Function and vitest.
 *
 * The texts are fixed. The only value a caller chooses is the locale, from a closed set, and the only value inserted is the link the function built itself. An Edge Function is its own deployment unit and cannot import the application's message catalogues, so the texts live here.
 */

/** The locales the two mails exist in: one per message directory of the frontend. */
export const SIGN_IN_MAIL_LOCALES = ['da', 'en', 'et', 'fi', 'fr', 'lb', 'sv'] as const;

/** One of the locales the two mails exist in. */
export type SignInMailLocale = (typeof SIGN_IN_MAIL_LOCALES)[number];

/** The locale used when a request names none, or one outside the set. */
export const DEFAULT_MAIL_LOCALE: SignInMailLocale = 'en';

/** The marker each template holds exactly once in its text and once in its html. */
export const LINK_MARKER = '{{link}}';

/** One locale's template of either mail. `text` and `html` each hold the link marker exactly once. */
export interface SignInMailTemplate {
  subject: string;
  text: string;
  html: string;
}

/** A rendered mail, ready to hand to the transport. */
export interface SignInMail {
  subject: string;
  text: string;
  html: string;
}

/**
 * Build one locale's template from its sentences, so the text part and the html part cannot drift apart.
 *
 * @param subject - The subject line
 * @param intro - The sentence that precedes the link
 * @param linkLabel - The visible text of the link in the html part
 * @param once - The sentences saying that the link works once and expires, that only the newest link works, and where a new one is asked for
 * @param ignore - The sentence for a recipient who did not ask for the link
 */
function template(subject: string, intro: string, linkLabel: string, once: string, ignore: string): SignInMailTemplate {
  return Object.freeze({
    subject,
    text: `${intro}\n${LINK_MARKER}\n\n${once}\n\n${ignore}\n`,
    html: `<p>${intro}</p><p><a href="${LINK_MARKER}">${linkLabel}</a></p><p>${once}</p><p>${ignore}</p>`
  });
}

/** The sign-in mail per locale. No template states a duration, a name or an address, or names a page of the application. */
export const SIGN_IN_MAIL_TEMPLATES: Readonly<Record<SignInMailLocale, SignInMailTemplate>> = Object.freeze({
  da: template(
    'Loginlink til valgtesten',
    'Åbn dette link for at logge ind:',
    'Log ind',
    'Linket virker én gang og udløber snart, og kun det nyeste link, du har bedt om, virker. Hvis det ikke længere virker, kan du bede om et nyt i applikationen.',
    'Hvis du ikke har bedt om dette link, kan du se bort fra denne besked.'
  ),
  en: template(
    'Sign-in link for the voting advice application',
    'Open this link to sign in:',
    'Sign in',
    'The link works once and expires soon, and only the newest link you asked for works. If it no longer works, ask for a new one in the application.',
    'If you did not ask for this link, you can ignore this message.'
  ),
  et: template(
    'Sisselogimislink valimiskompassi',
    'Sisselogimiseks ava see link:',
    'Logi sisse',
    'Link toimib ühe korra ja aegub peagi ning toimib ainult kõige uuem link, mille oled küsinud. Kui see enam ei toimi, küsi rakenduses uus link.',
    'Kui sa seda linki ei küsinud, võid seda kirja eirata.'
  ),
  fi: template(
    'Kirjautumislinkki vaalikoneeseen',
    'Avaa tämä linkki kirjautuaksesi sisään:',
    'Kirjaudu',
    'Linkki toimii yhden kerran ja vanhenee pian, ja vain uusin pyytämäsi linkki toimii. Jos se ei enää toimi, pyydä uusi linkki sovelluksessa.',
    'Jos et pyytänyt tätä linkkiä, voit jättää tämän viestin huomiotta.'
  ),
  fr: template(
    'Lien de connexion à la boussole électorale',
    'Ouvrez ce lien pour vous connecter :',
    'Se connecter',
    "Le lien ne fonctionne qu'une seule fois et expire bientôt, et seul le dernier lien que vous avez demandé fonctionne. S'il ne fonctionne plus, demandez-en un nouveau dans l'application.",
    "Si vous n'avez pas demandé ce lien, vous pouvez ignorer ce message."
  ),
  lb: template(
    'Umelllink fir de Wal-Kompass',
    'Maacht dëse Link op, fir Iech unzemellen:',
    'Umellen',
    'De Link funktionéiert eemol a leeft geschwënn of, an nëmmen deen neiste Link, deen Dir ugefrot hutt, funktionéiert. Wann en net méi funktionéiert, frot an der Applikatioun en neien un.',
    'Wann Dir dëse Link net ugefrot hutt, kënnt Dir dëse Message ignoréieren.'
  ),
  sv: template(
    'Inloggningslänk till valkompassen',
    'Öppna den här länken för att logga in:',
    'Logga in',
    'Länken fungerar en gång och upphör snart att gälla, och bara den senaste länken du har bett om fungerar. Om den inte längre fungerar kan du be om en ny i applikationen.',
    'Om du inte har bett om den här länken kan du bortse från det här meddelandet.'
  )
});

/**
 * The recovery mail per locale, in the five parts of the sign-in mail. No template states a duration, a name or an address.
 *
 * Each names the control that asks for a new link by the label the locale's message catalogue gives it, `contestantApp.login.forgotPassword`.
 */
export const RECOVERY_MAIL_TEMPLATES: Readonly<Record<SignInMailLocale, SignInMailTemplate>> = Object.freeze({
  da: template(
    'Nulstil din adgangskode til valgtesten',
    'Åbn dette link for at logge ind og vælge en ny adgangskode:',
    'Vælg en ny adgangskode',
    'Linket virker én gang og udløber snart, og kun det nyeste link, du har bedt om, virker. Hvis det ikke længere virker, kan du bede om et nyt med ”Glemt adgangskode?” i applikationen.',
    'Hvis du ikke har bedt om dette link, kan du se bort fra denne besked. Din adgangskode er ikke blevet ændret.'
  ),
  en: template(
    'Reset your password for the voting advice application',
    'Open this link to sign in and choose a new password:',
    'Choose a new password',
    'The link works once and expires soon, and only the newest link you asked for works. If it no longer works, ask for a new one with “Forgot Password?” in the application.',
    'If you did not ask for this link, you can ignore this message. Your password has not been changed.'
  ),
  et: template(
    'Valimiskompassi parooli lähtestamine',
    'Sisselogimiseks ja uue parooli määramiseks ava see link:',
    'Määra uus parool',
    'Link toimib ühe korra ja aegub peagi ning toimib ainult kõige uuem link, mille oled küsinud. Kui see enam ei toimi, küsi rakenduses uus link valikuga „Unustasite salasõna?“.',
    'Kui sa seda linki ei küsinud, võid seda kirja eirata. Sinu parooli ei ole muudetud.'
  ),
  fi: template(
    'Vaalikoneen salasanan palautus',
    'Avaa tämä linkki kirjautuaksesi sisään ja asettaaksesi uuden salasanan:',
    'Aseta uusi salasana',
    'Linkki toimii yhden kerran ja vanhenee pian, ja vain uusin pyytämäsi linkki toimii. Jos se ei enää toimi, pyydä uusi linkki sovelluksen kohdasta ”Unohditko salasanan?”.',
    'Jos et pyytänyt tätä linkkiä, voit jättää tämän viestin huomiotta. Salasanaasi ei ole muutettu.'
  ),
  fr: template(
    'Réinitialisation de votre mot de passe pour la boussole électorale',
    'Ouvrez ce lien pour vous connecter et définir un nouveau mot de passe :',
    'Définir un nouveau mot de passe',
    "Le lien ne fonctionne qu'une seule fois et expire bientôt, et seul le dernier lien que vous avez demandé fonctionne. S'il ne fonctionne plus, demandez-en un nouveau avec « Mot de passe oublié ? » dans l'application.",
    "Si vous n'avez pas demandé ce lien, vous pouvez ignorer ce message. Votre mot de passe n'a pas été modifié."
  ),
  lb: template(
    'Äert Passwuert fir de Wal-Kompass zrécksetzen',
    'Maacht dëse Link op, fir Iech unzemellen an en neit Passwuert festzeleeën:',
    'Neit Passwuert festleeën',
    'De Link funktionéiert eemol a leeft geschwënn of, an nëmmen deen neiste Link, deen Dir ugefrot hutt, funktionéiert. Wann en net méi funktionéiert, frot an der Applikatioun mat „Passwuert vergiess?“ en neien un.',
    'Wann Dir dëse Link net ugefrot hutt, kënnt Dir dëse Message ignoréieren. Äert Passwuert gouf net geännert.'
  ),
  sv: template(
    'Återställ ditt lösenord till valkompassen',
    'Öppna den här länken för att logga in och ställa in ett nytt lösenord:',
    'Ställ in ett nytt lösenord',
    'Länken fungerar en gång och upphör snart att gälla, och bara den senaste länken du har bett om fungerar. Om den inte längre fungerar kan du be om en ny med ”Glömt lösenord?” i applikationen.',
    'Om du inte har bett om den här länken kan du bortse från det här meddelandet. Ditt lösenord har inte ändrats.'
  )
});

/**
 * Resolve a requested locale against the closed set.
 *
 * @param input - Whatever the request carried as its locale
 * @returns The input when it is exactly one of the seven locales, and the default otherwise: for an unknown code, for a non-string, and for a property name every object inherits
 */
export function resolveMailLocale(input: unknown): SignInMailLocale {
  return typeof input === 'string' && (SIGN_IN_MAIL_LOCALES as ReadonlyArray<string>).includes(input)
    ? (input as SignInMailLocale)
    : DEFAULT_MAIL_LOCALE;
}

/** Escape the five characters HTML gives meaning to, so a value is inserted into markup as text. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Render one locale's template of a mail around a link.
 *
 * The link enters the text part as written and the html part HTML-escaped. It is inserted through a replacer function, so no character sequence in it is read as a replacement pattern.
 *
 * @param templates - The mail's templates, one per locale
 * @param locale - The locale to render; a value outside the set renders the default locale
 * @param link - The link the function built
 */
function render(
  templates: Readonly<Record<SignInMailLocale, SignInMailTemplate>>,
  locale: SignInMailLocale,
  link: string
): SignInMail {
  const { subject, text, html } = templates[resolveMailLocale(locale)];
  return {
    subject,
    text: text.replace(LINK_MARKER, () => link),
    html: html.replace(LINK_MARKER, () => escapeHtml(link))
  };
}

/**
 * Render the sign-in mail for a locale.
 *
 * @param locale - The locale to render; a value outside the set renders the default locale
 * @param link - The sign-in link the function built
 * @returns The subject, the text part and the html part
 */
export function renderSignInMail(locale: SignInMailLocale, link: string): SignInMail {
  return render(SIGN_IN_MAIL_TEMPLATES, locale, link);
}

/**
 * Render the recovery mail for a locale.
 *
 * @param locale - The locale to render; a value outside the set renders the default locale
 * @param link - The recovery link the function built
 * @returns The subject, the text part and the html part
 */
export function renderRecoveryMail(locale: SignInMailLocale, link: string): SignInMail {
  return render(RECOVERY_MAIL_TEMPLATES, locale, link);
}
