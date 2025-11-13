import { supabase } from '@/lib/supabase';

export async function getCustomerIdByPhone(phone: string): Promise<string | null> {
  const digits = (phone || '').replace(/\D/g, '');
  const { data, error } = await supabase
    .from('customers')
    .select('id')
    .eq('phone', digits)
    .limit(1)
    .single();
  if (error) return null;
  return data?.id ?? null;
}

export async function getCustomerId(name: string | null | undefined, phone: string): Promise<string | null> {
  const digits = (phone || '').replace(/\D/g, '');
  const n = name || '';
  try {
    const { data, error } = await supabase.rpc('login_customer', { p_name: n, p_phone: digits });
    if (!error && Array.isArray(data)) {
      if (data.length > 0) {
        return data[0]?.id ?? null;
      }
      // fallback if no rows
      return getCustomerIdByPhone(digits);
    }
  } catch {}
  const id = await getCustomerIdByPhone(digits);
  if (!id) console.warn('Customer lookup returned null. Check name/phone and DB records.');
  return id;
}
