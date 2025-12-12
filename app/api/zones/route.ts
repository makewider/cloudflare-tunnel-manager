import { NextResponse } from 'next/server';
import { getAllowedZones } from '@/lib/cloudflare/zones';
import type { AllowedZone } from '@/types/zone';

interface ZonesResponse {
  zones: AllowedZone[];
}

/**
 * GET /api/zones
 * Returns the list of allowed zones from environment variables
 */
export async function GET(): Promise<NextResponse<ZonesResponse>> {
  const zones = getAllowedZones();
  return NextResponse.json({ zones });
}
