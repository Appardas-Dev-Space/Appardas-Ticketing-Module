export default {
  routes: [
    {
      method: 'GET',
      path: '/members',
      handler: 'member.find',
      config: {
        // Any authenticated team member (scrum_master, lead_dev, developer)
        // with the api::member.member.find permission may list the team.
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/members/invite',
      handler: 'member.invite',
      config: {
        policies: ['global::is-manager'],
      },
    },
    {
      method: 'PUT',
      path: '/members/:id/role',
      handler: 'member.updateRole',
      config: {
        policies: ['global::is-manager'],
      },
    },
    {
      method: 'PUT',
      path: '/members/:id/deactivate',
      handler: 'member.deactivate',
      config: {
        policies: ['global::is-manager'],
      },
    },
  ],
};
