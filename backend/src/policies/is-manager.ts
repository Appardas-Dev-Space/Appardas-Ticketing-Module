import type { Core } from '@strapi/strapi';

const MANAGER_ROLES = ['scrum_master', 'lead_dev'];

/**
 * Global policy `global::is-manager`.
 *
 * Grants access only to authenticated users whose role type is a manager
 * (`scrum_master` or `lead_dev`). Returning `false` yields a 403 Forbidden
 * before the controller action runs.
 *
 * See IMPLEMENTATION_PLAN.md §3, §11.A.
 */
const isManager = (
  policyContext: any,
  _config: unknown,
  { strapi }: { strapi: Core.Strapi }
): boolean => {
  const user = policyContext.state?.user;

  if (!user) {
    strapi.log.debug('[is-manager] Rejected: no authenticated user.');
    return false;
  }

  const roleType = user.role?.type;
  const allowed = MANAGER_ROLES.includes(roleType);

  if (!allowed) {
    strapi.log.debug(`[is-manager] Rejected: role "${roleType}" is not a manager.`);
  }

  return allowed;
};

export default isManager;
