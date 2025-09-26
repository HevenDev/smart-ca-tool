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

    if (!processResponse.ok) {
      const errorText = await processResponse.text();
      throw new Error(`Processing failed: ${errorText}`);
    }

    const processResult = await processResponse.json();
    
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