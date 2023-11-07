'use strict';

const {yup, validateYupSchema} = require('@strapi/utils');

const loginSchema = yup.object({
  passkey: yup.string().required()
});

module.exports = {
  validateLoginBody: validateYupSchema(loginSchema)
};
