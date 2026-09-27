import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::sprint.sprint', {
  config: {
    create: {
      policies: ['global::is-manager'],
    },
    update: {
      policies: ['global::is-manager'],
    },
    delete: {
      policies: ['global::is-manager'],
    },
  },
});
