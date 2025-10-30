import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ managers: [] });

  const { data, error } = await supabase
    .from('manager_employee')
    .select('profiles:manager_id(id, full_name)')
    .eq('employee_id', user.id);
  if (error) return NextResponse.json({ managers: [] });
  return NextResponse.json({ managers: data?.map(d => d.profiles) || [] });
}

