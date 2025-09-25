import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Tally Integration API',
    version: '1.0.0',
    endpoints: {
      test: '/api/tally-integration/test - Test connection to Tally server',
      send: '/api/tally-integration/send - Send financial data to Tally'
    },
    features: [
      'Tally ERP integration',
      'XML data format support',
      'Batch processing',
      'Connection testing',
      'Voucher creation',
      'Ledger management'
    ],
    requirements: {
      tallyVersion: 'Tally.ERP 9 or higher',
      apiAccess: 'HTTP API enabled on Tally server',
      network: 'Network access to Tally server'
    }
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    error: 'Direct integration endpoint not available',
    message: 'Please use specific endpoints: /test or /send'
  }, { status: 400 });
}