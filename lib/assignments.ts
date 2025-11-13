import { supabase } from '@/lib/supabase';

export type CustomerAssignmentInfo = {
  assignmentId: string;
  assignedAt: string | null;
  defaultLiters: number;
  agentId: string;
  agentName: string | null;
  agentPhone: string | null;
};

export async function getCurrentAssignmentForCustomer(customerId: string): Promise<CustomerAssignmentInfo | null> {
  const { data: da, error: errDa } = await supabase
    .from('delivery_assignments')
    .select('id, delivery_agent_id, assigned_at, default_liters')
    .eq('customer_id', customerId)
    .is('unassigned_at', null)
    .order('assigned_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (errDa) {
    console.error('getCurrentAssignmentForCustomer error', errDa);
    return null;
  }
  if (!da) return null;
  const { data: agent, error: errAg } = await supabase
    .from('delivery_agents')
    .select('id, name, phone')
    .eq('id', da.delivery_agent_id)
    .limit(1)
    .maybeSingle();
  if (errAg || !agent) {
    return {
      assignmentId: da.id,
      assignedAt: da.assigned_at ?? null,
      defaultLiters: Number(da.default_liters ?? 0),
      agentId: da.delivery_agent_id,
      agentName: null,
      agentPhone: null,
    };
  }
  return {
    assignmentId: da.id,
    assignedAt: da.assigned_at ?? null,
    defaultLiters: Number(da.default_liters ?? 0),
    agentId: agent.id,
    agentName: agent.name ?? null,
    agentPhone: agent.phone ?? null,
  };
}
