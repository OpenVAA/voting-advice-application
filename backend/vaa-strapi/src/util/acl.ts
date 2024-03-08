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
      if (typeof query.populate !== 'object') {
        console.warn(
          `Disallowing ${query.populate} due to not using the explicit ?populate[...]=true syntax`
        );
        return false;
      }

      const origPopulate = query.populate;
      query.populate = filterObject(query.populate, allowedPopulate);
      if (JSON.stringify(origPopulate) !== JSON.stringify(query.populate)) {
        console.warn(
          `Filtered disallowed populate: ${JSON.stringify(origPopulate)} -> ${JSON.stringify(
            query.populate
          )}`
        );
      }
    }

    return true;
  };
}

export function restrictFilters(allowedFilters: string[]): any {
  return async (ctx, config, {strapi}) => {
    const query = ctx.request.query;

    // Only allow the provided filter fields
    if (query.filters) {
      // Allow only the explicit filters syntax
      if (typeof query.filters !== 'object') {
        console.warn(
          `Disallowing ${query.populate} due to not using the explicit ?filter[...]=true syntax`
        );
        return false;
      }

      const origFilters = query.filters;
      query.filters = filterObject(query.filters, allowedFilters);
      if (JSON.stringify(origFilters) !== JSON.stringify(query.filters)) {
        console.warn(
          `Filtered disallowed filters: ${JSON.stringify(origFilters)} -> ${JSON.stringify(
            query.filters
          )}`
        );
      }
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
      if (!Array.isArray(query.fields)) {
        console.warn(`Disallowing ${query.fields} due to not being an array.`);
        return false;
      }

      const origFields = query.fields;
      query.fields = query.fields.filter((field) => allowedFields.includes(field));
      if (origFields.length !== query.fields.length) {
        console.warn(`Filtered disallowed fields: ${origFields} -> ${query.fields}`);
      }
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

        console.warn(`Deleting restricted field ${key} from the body.`);
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

    const exists = !!res;
    if (!exists) {
      console.warn(`Resource ${contentType} is not owned by the currently authenticated user.`);
    }

    return exists;
  };
}
