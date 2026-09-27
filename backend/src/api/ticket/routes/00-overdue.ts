/**
 * Custom (non-CRUD) ticket routes.
 *
 * `/tickets/overdue` must be registered before the core `/tickets/:id` route
 * so it is not swallowed by the `:id` param matcher.
 */
export default {
  routes: [
    {
      method: 'GET',
      path: '/tickets/overdue',
      handler: 'ticket.overdue',
      config: {
        policies: [],
      },
    },
  ],
};
