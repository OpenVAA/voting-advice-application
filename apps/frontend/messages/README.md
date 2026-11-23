# Messages

The Paraglide message catalogues. One directory per locale, one JSON file per namespace, and the same
key set in every locale.

> Reading order for a translator: this file, then the locale directory you are working in. The file
> names below are the namespaces; the key path inside a file continues from the file name, so
> `questions.json` holding `{ "questions": { "intro": { "start": "…" } } }` is the key
> `questions.intro.start`.

## Which locales exist, and which are offered

Two different lists, and confusing them is the usual mistake:

- **`../project.inlang/settings.json` → `locales`** decides which catalogues are compiled. That is the
  authority for what must exist in this directory. Currently seven: `en` (the base locale), `fi`, `sv`,
  `da`, `et`, `fr`, `lb`.
- **`packages/app-shared/src/settings/staticSettings.ts` → `supportedLocales`** decides which locales a
  _deployment_ offers its users. It is a subset, and it is meant to be edited per instance.

A locale directory must be complete even if no current deployment offers it.

## The rules a translator has to keep

1. **Every key exists in every locale.** A key present in some locales and missing in others is not a
   graceful degradation: `t()` returns the key string itself when it cannot resolve a message
   (`../src/lib/i18n/wrapper.ts`), so the user sees a raw identifier like `questions.intro.start`
   rendered in the page.
2. **Every file listed in `../project.inlang/settings.json` → `plugin.inlang.messageFormat.pathPattern`
   exists in every locale directory, and nothing else does.** A file here that the pattern does not
   list is never compiled. The message-format plugin silently ignores a pattern entry whose file is
   missing, so the compiler does not catch one: `../src/lib/i18n/tests/translations.test.ts` checks
   that the listed files and the files present agree.
3. **A `{name}` placeholder refers to a DECLARED INPUT, and the declared names are part of the
   message's signature.** They are the same in every locale because the calling code passes those
   names — they are not words to be translated. Translate the surrounding sentence and leave
   `{numQuestions}` alone; renaming it to `{antalFragor}` gives that locale a different signature from
   every other, and the value the caller passes never arrives.
4. **Keep the placeholder _set_ identical across locales**, even when word order differs. If the
   English message interpolates two values, so must yours.
5. **Some values are HTML** and are rendered through a sanitiser. Keep the tag structure valid and keep
   heading levels consistent with the page that renders them — the `<h3>`s in
   `dynamic.contestantAppPrivacy.registryStatement.content`, for example, sit under an `<h2>` that
   `TermsOfUse.svelte` supplies, so they are correct at that level and would be wrong at any other.
6. **Plural and selector forms use the inlang message format**, with a `declarations` / `selectors` /
   `match` object rather than a plain string. Add or remove a variant only together with its
   `selectors` entry. A variant key with more than one selector separates them with a comma and a
   space (`infoQuestionsLeft=1, opinionQuestionsLeft=*`); a space alone compiles to a variant that
   never matches. An exact count is the input itself matched as `=0` or `=1`, not the plural
   category `zero` or `one`: no configured locale ever yields `zero`, and French `one` covers 0 too.
   Every variant message with a number ends in a `*` catch-all, listed last, which takes every value
   and category no other variant names.

## Instance overrides

A deployment overrides messages without editing these catalogues, in `instance/messages/<locale>.json`
at the repository root: one file per locale, holding only the keys it changes, nested as here
(`{ "common": { "closeDialog": "…" } }` is the key `common.closeDialog`). The build validates every
file before compiling and fails naming the file and the key when the locale is not one of
`project.inlang` `locales`, a key is not in the base catalogue, or a message's `{placeholder}` set or
HTML tag set differs from the base message's. Runtime `translationOverrides` from the backend still
win over both. See [`instance/README.md`](../../../instance/README.md).

## Messages that name the identity provider

These keys name the identity provider ("Bank ID" in `en`) inside whole sentences; a deployment with another provider overrides them in every locale: `contestantApp.identityProvider.alreadyRegistered.pending`, `contestantApp.identityProvider.emailIntro`, `contestantApp.login.emailTaken`, `contestantApp.login.signInWithIdentityProvider`, `contestantApp.nothingToEdit.nextStepsNoAddress`, `contestantApp.register.identityProvider.intro.candidate`, `contestantApp.register.identityProvider.intro.candidateAndOrganization`, `contestantApp.register.identityProvider.intro.organization`, `contestantApp.register.identityProvider.redirectInfo`, `contestantApp.register.modes.identityProvider` and `contestantApp.settings.emailPendingInfo`.

## Checking your work

All three are worth running before opening a pull request; none needs a server.

```bash
# 1. Key-set parity across every locale. Prints nothing when the catalogues agree.
python3 - <<'EOF'
import json, os
root = 'apps/frontend/messages'
def flat(d, pre=''):
    out = set()
    for k, v in d.items():
        key = f'{pre}{k}'
        out |= flat(v, key + '.') if isinstance(v, dict) else {key}
    return out
keys = {}
for loc in sorted(os.listdir(root)):
    p = os.path.join(root, loc)
    if not os.path.isdir(p):
        continue
    keys[loc] = {f'{fn}::{k}' for fn in sorted(os.listdir(p))
                 for k in flat(json.load(open(os.path.join(p, fn), encoding='utf-8')))}
union, inter = set().union(*keys.values()), set.intersection(*keys.values())
for k in sorted(union - inter):
    print(k, 'missing from', sorted(l for l in keys if k not in keys[l]))
EOF

# 2. The type gate. `t()` only accepts keys in a generated union, so a key that does not
#    exist is a compile error at the call site rather than a defect a user finds.
yarn build

# 3. The compiled-message check. It calls every compiled message in every locale with 0, 1 and
#    other counts, so it needs the compile step first.
yarn workspace @openvaa/frontend paraglide:compile
yarn workspace @openvaa/frontend test:unit src/lib/i18n/tests/compiledMessages.test.ts
```

Check 3 fails when any variant message matches nothing for 0, 1 or another count, which is what a
space-separated variant key or a missing `*` catch-all produces.

The second one has a limit worth knowing: the union is generated by
`../tools/translationKey/generateTranslationKeyType.ts`, which reads its key list from **one** locale.
It therefore proves that a key a caller uses exists somewhere — never that it exists in the locale a
particular user is reading. Check 1 is what covers that, and it is the reason it is listed first.
