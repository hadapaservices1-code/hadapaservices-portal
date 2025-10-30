import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const { managerId, employeeId } = await request.json();
  const supabase = await createClient();
  const { error } = await supabase
    .from('manager_employee')
    .upsert(
      { manager_id: managerId, employee_id: employeeId },
      { onConflict: ['manager_id', 'employee_id'] }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

