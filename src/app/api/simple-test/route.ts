import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(
      { success: true, message: 'Simple test API working' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Simple test API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
