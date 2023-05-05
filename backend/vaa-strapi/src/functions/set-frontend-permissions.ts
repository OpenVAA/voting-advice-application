/**
 * Creates a new permissions object for Strapi if permission does not exist,
 * and returns said object for later to be added into a role.
 * @param route
 * @param permission
 */
async function createPermissionObject(route: string, permission: string ){
  const action = `${route}::${permission}`;
  const existingPermission = await strapi.query('plugin::users-permissions.permission').findOne({ where: { action: action }});

  if(!existingPermission){
    const permissionObj = await strapi.query('plugin::users-permissions.permission').create({
      data: {
        action: action
      }
    });
    if(permissionObj){
      console.info('Created new permission for ', permission);
    } else {
      console.error('Could not create permission for ', permission);
    }
    return permissionObj;
  } else {
    return existingPermission;
  }
}

/**
 * Enables the permissions required by frontend API queries
 * in Strapi users-permissions plugin whenever server starts.
 */
export async function setFrontendPermissions(){
  const publicRole = await strapi
    .query('plugin::users-permissions.role')
    .findOne({where: {type: 'authenticated'}, populate: ['users', 'permissions']});

  const requiredPermissions = [
    'answer',
    'candidate',
    'candidate-answer',
    'category',
    'constituency',
    'election',
    'language',
    'party',
    'question',
  ];

  const permissions = [];
  // for (const permission of requiredPermissions) {
  //   const findPermissionObj = await createPermissionObject('api', `${permission}.${permission}.find`);
  //   permissions.push(findPermissionObj);
  //
  //   const findOnePermissionObj = await createPermissionObject('api', `${permission}.${permission}.findOne`);
  //   permissions.push(findOnePermissionObj);
  // }

  const uploadFindPermissionObj = await createPermissionObject('plugin', 'upload.content-api.find');
  permissions.push(uploadFindPermissionObj);

  const uploadFindOnePermissionObj = await createPermissionObject('plugin', 'upload.content-api.findOne');
  permissions.push(uploadFindOnePermissionObj);

  const languagesPermissionObj = await createPermissionObject('plugin', 'i18n.locales.listLocales');
  permissions.push(languagesPermissionObj);

  // await strapi.query('plugin::users-permissions.role').update({
  //   where: {id: publicRole.id},
  //   data: {permissions: permissions},
  // });
  return;
}
