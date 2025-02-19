# Environmental variables

Environmental variables are never accessed directly in the frontend (i.e. from `$env/static/public` etc.), but instead via two utility modules:

- [$lib/utils/constants](../../frontend/src/lib/utils/constants.ts) which contains the publicly accessible variables, always prefixed with `PUBLIC_`.
- [$lib/server/constants](../../frontend/src/lib/server/constants.ts) which contains the private variables only accessible on the server.

Furthermore, the variables are not imported directly from these modules due to production compilation intricacies. They are imported wholesale instead:

```ts
import { constants } from '$lib/utils/constants';
const urlRoot = constants.PUBLIC_BROWSER_BACKEND_URL;
```
