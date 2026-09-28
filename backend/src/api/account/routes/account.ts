export default {
  routes: [
    {
      method: 'PUT',
      path: '/account',
      handler: 'account.updateProfile',
      config: {
        // Authenticated users edit only their own profile (enforced in controller).
        policies: [],
      },
    },
    {
      method: 'PUT',
      path: '/account/password',
      handler: 'account.changePassword',
      config: {
        policies: [],
      },
    },
  ],
};
