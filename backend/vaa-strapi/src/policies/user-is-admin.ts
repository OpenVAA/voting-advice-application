import { StrapiContext } from "../../types/customStrapiTypes";

/** 
  * Policy that only allows admin users to use LLM functions.
  */
export default function isAdmin(ctx: StrapiContext): boolean {
  const role = ctx.state.user.role;
  const userIsAuthenticated = ctx.state.isAuthenticated;

  if (role == 'admin' && userIsAuthenticated) {
    return true;
  }
  return false;
}
