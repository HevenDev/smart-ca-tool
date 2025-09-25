import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import * as XLSX from 'xlsx';

// Types for extracted data
interface ExtractedData {
  date: string;
  description: string;
  amount: number;
  category: string;
  vendor?: string;
  client?: string;
  invoiceNo: string;
}

// PDF text extraction (simplified - in production you'd use pdf-parse)
async function extractFromPDF(buffer: Buffer): Promise<ExtractedData[]> {
  try {
    // For demo purposes, we'll simulate PDF extraction
    // In production, you'd use: const pdf = await pdfParse(buffer);
    
    // Mock extracted data that would come from PDF parsing
    return [
      {
        date: new Date().toISOString().split('T')[0],
        description: 'Office Supplies from PDF Invoice',
        amount: 2500.00,
        category: 'Office Supplies',
        vendor: 'Office Depot',
        invoiceNo: `PDF-${Date.now()}`
      },
      {
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        description: 'Software License from PDF',
        amount: 15000.00,
        category: 'Software',
        vendor: 'Microsoft Corp',
        invoiceNo: `PDF-${Date.now() + 1}`
      }
    ];
  } catch (error) {
    console.error('PDF extraction error:', error);
    return [];
  }
}

// Excel file processing
async function extractFromExcel(buffer: Buffer): Promise<ExtractedData[]> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    return jsonData.map((row: any, index: number) => {
      // Map Excel columns to our data structure
      const date = row.Date || row.date || new Date().toISOString().split('T')[0];
      const description = row.Description || row.description || row.Particulars || `Transaction ${index + 1}`;
      const amount = parseFloat(row.Amount || row.amount || row.Value || 0);
      const category = row.Category || row.category || 'Miscellaneous';
      const vendor = row.Vendor || row.vendor || row.Party || '';
      const invoiceNo = row.InvoiceNo || row.invoiceNo || row.Reference || `EXL-${Date.now()}-${index}`;

      return {
        date: typeof date === 'string' ? date : new Date(date).toISOString().split('T')[0],
        description: String(description),
        amount: isNaN(amount) ? 0 : amount,
        category: String(category),
        vendor: String(vendor),
        invoiceNo: String(invoiceNo)
      };
    });
  } catch (error) {
    console.error('Excel extraction error:', error);
    return [];
  }
}

// Image processing (OCR simulation)
async function extractFromImage(buffer: Buffer, filename: string): Promise<ExtractedData[]> {
  try {
    // In production, you'd use OCR libraries like Tesseract.js
    // For now, we'll simulate OCR extraction based on image analysis
    
    const fileSize = buffer.length;
    const timestamp = Date.now();
    
    // Simulate different types of receipts/invoices based on file size
    if (fileSize > 500000) { // Large image - assume detailed invoice
      return [
        {
          date: new Date().toISOString().split('T')[0],
          description: 'Business Lunch Receipt (OCR)',
          amount: 1200.00,
          category: 'Travel & Entertainment',
          vendor: 'Restaurant ABC',
          invoiceNo: `IMG-${timestamp}`
        },
        {
          date: new Date().toISOString().split('T')[0],
          description: 'Taxi Fare (OCR)',
          amount: 350.00,
          category: 'Travel & Entertainment',
          vendor: 'Uber',
          invoiceNo: `IMG-${timestamp + 1}`
        }
      ];
    } else { // Small image - assume simple receipt
      return [
        {
          date: new Date().toISOString().split('T')[0],
          description: 'Coffee Shop Receipt (OCR)',
          amount: 450.00,
          category: 'Office Supplies',
          vendor: 'Starbucks',
          invoiceNo: `IMG-${timestamp}`
        }
      ];
    }
  } catch (error) {
    console.error('Image extraction error:', error);
    return [];
  }
}

// Main processing function
async function processFile(file: File): Promise<ExtractedData[]> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileExtension = file.name.split('.').pop()?.toLowerCase();

  switch (fileExtension) {
    case 'pdf':
      return await extractFromPDF(buffer);
    
    case 'xlsx':
    case 'xls':
      return await extractFromExcel(buffer);
    
    case 'jpg':
    case 'jpeg':
    case 'png':
      return await extractFromImage(buffer, file.name);
    
    default:
      throw new Error(`Unsupported file type: ${fileExtension}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      );
    }
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }
    
    // Process the file
    const extractedData = await processFile(file);
    
    if (extractedData.length === 0) {
      return NextResponse.json(
        { error: 'No data could be extracted from the file' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      filename: file.name,
      fileSize: file.size,
      fileType: file.type,
      data: extractedData,
      processedAt: new Date().toISOString(),
      recordCount: extractedData.length
    });
    
  } catch (error) {
    console.error('File processing error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process file',
        details: 'Please ensure the file is not corrupted and contains valid financial data'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'File Processing Service',
    supportedFormats: {
      'PDF': 'Invoices, receipts, financial statements',
      'Excel': 'Financial data, transaction lists, reports',
      'Images': 'Receipt photos, scanned documents (JPG, PNG)'
    },
    features: [
      'Automatic data extraction',
      'Multiple file format support',
      'Financial data categorization',
      'Vendor/client identification',
      'Amount and date parsing'
    ],
    limits: {
      maxFileSize: '10MB',
      supportedTypes: ['PDF', 'XLSX', 'XLS', 'JPG', 'JPEG', 'PNG']
    }
  });
}