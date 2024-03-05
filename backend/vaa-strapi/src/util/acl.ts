// Helper functions used to make dealing with access control easier

function filterObject(obj, keys) {
  const recursive = (source, path) => {
    const res = {};

    for (const key in source) {
      const currentKey = path ? `${path}.${key}` : key;
      if (keys.includes(currentKey)) {
        res[key] = source[key];
        continue;
      }

      if (typeof source[key] == 'object') {
        res[key] = recursive(source[key], currentKey);
        if (Object.keys(res[key]).length === 0) delete res[key];
      }
    }

    return res;
  };

  return recursive(obj, '');
}

export function restrictPopulate(allowedPopulate: string[]): any {
  return async (ctx, config, {strapi}) => {
    const query = ctx.request.query;

    // Only allow the provided populate fields
    if (query.populate) {
      // Allow only the explicit populate syntax (vs. allowing ?populate=*)
      if (typeof query.populate !== 'object') return false;

      query.populate = filterObject(query.populate, allowedPopulate);
    }

    return true;
  };
}

export function restrictFields(allowedFields: string[]): any {
  return async (ctx, config, {strapi}) => {
    const query = ctx.request.query;

    // Only allow the provided fields
    if (query.fields) {
      // Allow only the explicit fields syntax (not sure if there are any other variations, but just in case)
      if (!Array.isArray(query.fields)) return false;

      query.fields = query.fields.filter((field) => allowedFields.includes(field));
    } else {
      // If the fields aren't provided, default to allowed fields only
      query.fields = allowedFields;
    }

    return true;
  };
}

export function restrictBody(allowedFields: string[]): any {
  return async (ctx, config, {strapi}) => {
    // Disallow providing non-allowed body fields
    if (ctx.request.body?.data) {
      for (const key in ctx.request.body.data) {
        if (allowedFields.includes(key)) continue;

        delete ctx.request.body.data[key];
      }
    }

    return true;
  };
}

export function restrictResourceOwnedByCandidate(contentType: string): any {
  return async (ctx, config, {strapi}) => {
    const {id} = ctx.params;

    const candidate = await strapi.query('api::candidate.candidate').findOne({
      where: {user: {id: ctx.state.user.id}}
    });

    // Make sure we can find the resource belonging to our candidate
    const res = await strapi.db.query(contentType).findOne({
      where: {id, candidate: candidate.id}
    });

    return !!res;
  };
}
