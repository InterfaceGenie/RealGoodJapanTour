import { NextRequest, NextResponse } from 'next/server'
import { locationsApi } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const areas = searchParams.get('areas')?.split(',') || []

    const locations = await locationsApi.searchByQuery(query, areas)
    return NextResponse.json(locations)
  } catch (error) {
    console.error('Error searching locations:', error)
    return NextResponse.json(
      { error: 'Failed to search locations' },
      { status: 500 }
    )
  }
}
