--------------------------------------------------------------------------------
-- The former name of the per-caller limit of the anonymous account-access operations, dropped
--
-- WHAT IT CHANGES. Drops public.invitation_caller_take, the former name of public.access_caller_take, which no function of the repository calls.
--
-- WHAT IT LEAVES. public.access_caller_take and its privileges, the service role alone, private.access_throttle and its `caller:` rows, and every other table, policy and function.
--------------------------------------------------------------------------------

DROP FUNCTION public.invitation_caller_take (uuid, text);
