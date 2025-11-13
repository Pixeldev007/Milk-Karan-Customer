import { supabase } from '@/lib/supabase';
import { getCustomerSession } from '@/lib/session';
import { getCustomerId } from '@/lib/customers';

export type DeliveryRow = {
  date: string;
  shift: 'morning' | 'evening';
  liters: number;
  delivered: boolean;
  delivered_at: string | null;
  delivery_agent_name: string | null;
  delivery_agent_phone: string | null;
};

export async function listCustomerDeliveries(params: { customerId?: string | null; date?: string | null }) {
  const { customerId: providedId, date } = params || {};
  let customerId = providedId ?? null;
  if (!customerId) {
    const session = await getCustomerSession();
    if (!session?.phone) return [] as DeliveryRow[];
    customerId = await getCustomerId(session.name, session.phone);
  }
  if (!customerId) return [] as DeliveryRow[];

  const { data, error } = await supabase.rpc('get_customer_day_details', {
    p_customer_id: customerId,
    p_date: date ?? null,
  });
  if (error) throw error;
  return (data ?? []).map((r: any) => {
    const rawShift = (r.shift ?? '').toString().toLowerCase();
    const normalizedShift: 'morning' | 'evening' = rawShift.includes('even') || rawShift.includes('pm') ? 'evening' : 'morning';
    return {
      date: r.date,
      shift: normalizedShift,
      liters: Number(r.liters ?? 0),
      delivered: !!r.delivered,
      delivered_at: r.delivered_at ?? null,
      delivery_agent_name: r.delivery_agent_name ?? null,
      delivery_agent_phone: r.delivery_agent_phone ?? null,
    } as DeliveryRow;
  });
}
