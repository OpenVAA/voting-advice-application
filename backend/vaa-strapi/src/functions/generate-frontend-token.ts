export async function generateFrontendToken(strapi) {
  const tokenService = strapi.service('admin::api-token');
  if (tokenService && tokenService.create) {
    const tokenAlreadyExists = await tokenService.exists({
      name: 'vaa-frontend-token',
    });
    if (tokenAlreadyExists) {
      const token = await tokenService.find({
        name: 'vaa-frontend-token',
      });
      console.log('token: ', token);
      console.info('an api token named \'vaa-frontend-token\' already exists, skipping...');
    }
    else {
      console.info('creating \'vaa-frontend-token\' api token');
      const { accessKey } = await tokenService.create({
        name: 'vaa-frontend-token',
        type: 'custom',
        permissions:[
          'api::answer.answer.find',
          'api::answer.answer.findOne',
          'api::candidate.candidate.find',
          'api::candidate.candidate.findOne',
          'api::candidate-answer.candidate-answer.find',
          'api::candidate-answer.candidate-answer.findOne',
          'api::category.category.find',
          'api::category.category.findOne',
          'api::constituency.constituency.find',
          'api::constituency.constituency.findOne',
          'api::election.election.find',
          'api::election.election.findOne',
          'api::language.language.find',
          'api::language.language.findOne',
          'api::party.party.find',
          'api::party.party.findOne',
          'api::question.question.find',
          'api::question.question.findOne',
          'plugin::upload.content-api.find',
          'plugin::upload.content-api.findOne',
          'plugin::i18n.locales.listLocales',
        ],
      });
      console.log('Token: ', accessKey);
    }
  }else {
    console.error('Can\'t check if token exists');
  }
  return;
}
