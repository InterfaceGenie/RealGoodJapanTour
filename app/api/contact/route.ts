import { NextRequest, NextResponse } from 'next/server'
import { contactApi, emailApi } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Create the contact message
    const message = await contactApi.create(body)

    // Send confirmation email
    await emailApi.sendContactConfirmation(message)

    return NextResponse.json(message)
  } catch (error) {
    console.error('Error creating contact message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
