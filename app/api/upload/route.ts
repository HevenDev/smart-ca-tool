import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }
    
    // Forward to processing service
    const processResponse = await fetch(`${request.nextUrl.origin}/api/process-file`, {
      method: 'POST',
      body: formData,
    });
    
    const processResult = await processResponse.json();
    
    if (!processResponse.ok) {
      throw new Error(processResult.error || 'Processing failed');
    }
    
    return NextResponse.json({
      message: 'File uploaded and processed successfully',
      ...processResult
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'File upload endpoint',
    supportedTypes: ['PDF', 'Excel', 'Images (JPG, PNG)'],
    maxSize: '10MB'
  });
}