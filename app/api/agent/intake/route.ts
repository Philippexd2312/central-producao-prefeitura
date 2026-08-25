import { triageDemand } from '@/lib/agent';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const result = await triageDemand({ text: body.text, mediaTypes: body.mediaTypes });
  return NextResponse.json(result);
}
