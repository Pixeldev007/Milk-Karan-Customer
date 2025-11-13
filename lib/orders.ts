import { supabase } from '@/lib/supabase';

export type CustomerOrder = {
  id: string;
  date: string;
  shift: string;
  liters: number;
  delivered: boolean;
  deliveredAt: string | null;
};

export async function listMyOrders(customerId: string, from?: string, to?: string): Promise<CustomerOrder[]> {
  const { data, error } = await supabase.rpc('get_customer_orders', {
    p_customer_id: customerId,
    p_from: from ?? null,
    p_to: to ?? null,
  });
  if (error) {
    console.error('get_customer_orders error', error);
    throw error;
  }
  return (data ?? []).map((r: any) => ({
    id: r.id,
    date: r.date,
    shift: r.shift,
    liters: Number(r.liters ?? 0),
    delivered: !!r.delivered,
    deliveredAt: r.delivered_at ?? null,
  }));
}

export type CustomerOrderDetailed = {
  date: string;
  shift: string;
  liters: number;
  delivered: boolean;
  deliveredAt: string | null;
  deliveryAgentId: string | null;
  deliveryAgentName: string | null;
  deliveryAgentPhone: string | null;
  updatedAt: string | null;
};

export async function listMyOrdersDetailed(customerId: string, from?: string, to?: string): Promise<CustomerOrderDetailed[]> {
  const { data, error } = await supabase.rpc('get_customer_orders_detailed', {
    p_customer_id: customerId,
    p_from: from ?? null,
    p_to: to ?? null,
  });
  if (error) {
    console.error('get_customer_orders_detailed error', error);
    throw error;
  }
  return (data ?? []).map((r: any) => ({
    date: r.date,
    shift: r.shift,
    liters: Number(r.liters ?? 0),
    delivered: !!r.delivered,
    deliveredAt: r.delivered_at ?? null,
    deliveryAgentId: r.delivery_agent_id ?? null,
    deliveryAgentName: r.delivery_agent_name ?? null,
    deliveryAgentPhone: r.delivery_agent_phone ?? null,
    updatedAt: r.updated_at ?? null,
  }));
}

export async function getCustomerDayDetails(customerId: string, date?: string): Promise<CustomerOrderDetailed[]> {
  const { data, error } = await supabase.rpc('get_customer_day_details', {
    p_customer_id: customerId,
    p_date: date ?? null,
  });
  if (error) {
    console.error('get_customer_day_details error', error);
    throw error;
  }
  return (data ?? []).map((r: any) => ({
    date: r.date,
    shift: r.shift,
    liters: Number(r.liters ?? 0),
    delivered: !!r.delivered,
    deliveredAt: r.delivered_at ?? null,
    deliveryAgentId: r.delivery_agent_id ?? null,
    deliveryAgentName: r.delivery_agent_name ?? null,
    deliveryAgentPhone: r.delivery_agent_phone ?? null,
    updatedAt: null,
  }));
}
