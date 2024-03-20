export default (policyContext, config, {strapi}) => {
  const authorization = policyContext.request.header?.authorization;
  if (!authorization) return false;

  const parts = authorization.split(' ');
  if (parts.length != 2) return false;

  const token = parts[1].replaceAll('"', '');
  const {isValid} = strapi.admin.services.token.decodeJwtToken(token);
  return isValid;
};
