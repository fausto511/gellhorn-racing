// "My Garage" (RS-0032, DEC-0074): which vehicles the signed-in driver owns.
// Private -- RLS only returns the driver's own rows (table owned_vehicles).
import { backendConfigured, getSupabase } from './supabase-client';

export async function currentDriverId(): Promise<string | null> {
  if (!backendConfigured) return null;
  const sb = getSupabase();
  const { data } = await sb.auth.getSession();
  const uid = data?.session?.user?.id;
  if (!uid) return null;
  const own = await sb.from('drivers').select('driver_id').eq('auth_user_id', uid).maybeSingle();
  return (own.data?.driver_id as string) ?? null;
}

export async function fetchOwned(): Promise<Set<string>> {
  if (!backendConfigured) return new Set();
  const { data, error } = await getSupabase().from('owned_vehicles').select('vehicle_id');
  if (error) return new Set();
  return new Set((data ?? []).map((r: { vehicle_id: string }) => r.vehicle_id));
}

/** true = now owned, false = now not owned; throws on error */
export async function setOwned(driverId: string, vehicleId: string, owned: boolean): Promise<boolean> {
  const sb = getSupabase();
  const { error } = owned
    ? await sb.from('owned_vehicles').upsert({ driver_id: driverId, vehicle_id: vehicleId }, { onConflict: 'driver_id,vehicle_id', ignoreDuplicates: true })
    : await sb.from('owned_vehicles').delete().eq('driver_id', driverId).eq('vehicle_id', vehicleId);
  if (error) throw error;
  return owned;
}
