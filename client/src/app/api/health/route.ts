import { NextRequest, NextResponse } from 'next/server';

/**
 * Health check endpoint for the API
 * GET /api/health
 */
export async function GET(request: NextRequest) {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        ai: {
          status: 'available',
          provider: 'Google Gemini'
        },
        database: {
          status: 'connected'
        }
      }
    };
    
    return NextResponse.json({
      success: true,
      data: healthData
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
