import { supabase } from '@/lib/supabase';

export type CustomerDashboard = {
  today_assigned: number;
  today_delivered: number;
  days7_assigned: number;
  days7_delivered: number;
};

export async function getCustomerDashboard(customerId: string): Promise<CustomerDashboard> {
  const { data, error } = await supabase.rpc('get_customer_dashboard', { p_customer_id: customerId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    today_assigned: Number(row?.today_assigned ?? 0),
    today_delivered: Number(row?.today_delivered ?? 0),
    days7_assigned: Number(row?.days7_assigned ?? 0),
    days7_delivered: Number(row?.days7_delivered ?? 0),
  };
}
