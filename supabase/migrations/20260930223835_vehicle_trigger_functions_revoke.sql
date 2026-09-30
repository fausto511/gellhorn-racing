-- RS-0052: trigger-only functions must not be callable via the API (advisor 0028/0029)
revoke execute on function public.vehicles_audit(), public.vehicles_log(), public.vehicle_values_supersede() from public, anon, authenticated;
