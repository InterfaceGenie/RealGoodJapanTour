import { NextResponse } from 'next/server'
import { toursApi } from '@/lib/api'

export async function GET() {
  try {
    const tours = await toursApi.getAll()
    return NextResponse.json(tours)
  } catch (error) {
    console.error('Error fetching tours:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tours' },
      { status: 500 }
    )
  }
}
