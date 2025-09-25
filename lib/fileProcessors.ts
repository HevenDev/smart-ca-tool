// File processing utilities for Next.js-only implementation

export interface ExtractedData {
  date: string;
  description: string;
  amount: number;
  category: string;
  vendor?: string;
  client?: string;
  invoiceNo: string;
}

// Enhanced Excel processing with better column mapping
export function processExcelData(jsonData: any[]): ExtractedData[] {
  return jsonData.map((row: any, index: number) => {
    // Try multiple column name variations
    const getColumnValue = (possibleNames: string[]) => {
      for (const name of possibleNames) {
        if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
          return row[name];
        }
      }
      return null;
    };

    // Extract date
    const dateValue = getColumnValue(['Date', 'date', 'Transaction Date', 'Txn Date', 'DATE']);
    let date = new Date().toISOString().split('T')[0];
    if (dateValue) {
      try {
        const parsedDate = new Date(dateValue);
        if (!isNaN(parsedDate.getTime())) {
          date = parsedDate.toISOString().split('T')[0];
        }
      } catch (e) {
        // Keep default date
      }
    }

    // Extract description
    const description = getColumnValue([
      'Description', 'description', 'Particulars', 'particulars', 
      'Details', 'details', 'Narration', 'narration', 'DESCRIPTION'
    ]) || `Transaction ${index + 1}`;

    // Extract amount
    const amountValue = getColumnValue([
      'Amount', 'amount', 'Value', 'value', 'Total', 'total',
      'Debit', 'debit', 'Credit', 'credit', 'AMOUNT'
    ]);
    const amount = parseFloat(String(amountValue).replace(/[^\d.-]/g, '')) || 0;

    // Extract category
    const category = getColumnValue([
      'Category', 'category', 'Type', 'type', 'Account', 'account',
      'Head', 'head', 'CATEGORY'
    ]) || categorizeTransaction(description, amount);

    // Extract vendor/client
    const vendor = getColumnValue([
      'Vendor', 'vendor', 'Party', 'party', 'Client', 'client',
      'Supplier', 'supplier', 'Customer', 'customer', 'VENDOR'
    ]) || extractVendorFromDescription(description);

    // Extract invoice number
    const invoiceNo = getColumnValue([
      'Invoice No', 'InvoiceNo', 'invoiceNo', 'Reference', 'reference',
      'Ref No', 'RefNo', 'Bill No', 'billNo', 'INVOICE_NO'
    ]) || `EXL-${Date.now()}-${index}`;

    return {
      date,
      description: String(description),
      amount: Math.abs(amount), // Ensure positive amount
      category,
      vendor: vendor ? String(vendor) : undefined,
      invoiceNo: String(invoiceNo)
    };
  });
}

// Smart categorization based on description and amount
function categorizeTransaction(description: string, amount: number): string {
  const desc = description.toLowerCase();
  
  // Income indicators
  if (desc.includes('payment received') || desc.includes('income') || 
      desc.includes('revenue') || desc.includes('sales') || 
      desc.includes('receipt') || desc.includes('collection')) {
    return 'Income';
  }
  
  // Expense categories
  if (desc.includes('office') || desc.includes('supplies') || desc.includes('stationery')) {
    return 'Office Supplies';
  }
  
  if (desc.includes('software') || desc.includes('license') || desc.includes('subscription')) {
    return 'Software';
  }
  
  if (desc.includes('travel') || desc.includes('taxi') || desc.includes('flight') || 
      desc.includes('hotel') || desc.includes('meal') || desc.includes('restaurant')) {
    return 'Travel & Entertainment';
  }
  
  if (desc.includes('marketing') || desc.includes('advertising') || desc.includes('promotion')) {
    return 'Marketing';
  }
  
  if (desc.includes('rent') || desc.includes('lease')) {
    return 'Rent';
  }
  
  if (desc.includes('utility') || desc.includes('electricity') || desc.includes('water') || 
      desc.includes('internet') || desc.includes('phone')) {
    return 'Utilities';
  }
  
  if (desc.includes('insurance') || desc.includes('premium')) {
    return 'Insurance';
  }
  
  if (desc.includes('professional') || desc.includes('consultant') || desc.includes('legal') || 
      desc.includes('accounting') || desc.includes('audit')) {
    return 'Professional Services';
  }
  
  // Default based on amount
  if (amount > 0) {
    return amount > 10000 ? 'Expenses' : 'Office Supplies';
  }
  
  return 'Miscellaneous';
}

// Extract vendor from description
function extractVendorFromDescription(description: string): string | undefined {
  const desc = description.toLowerCase();
  
  // Common vendor patterns
  const vendors = [
    'microsoft', 'google', 'amazon', 'apple', 'adobe', 'salesforce',
    'uber', 'ola', 'swiggy', 'zomato', 'flipkart', 'paytm',
    'airtel', 'jio', 'vodafone', 'bsnl', 'tata', 'reliance',
    'hdfc', 'icici', 'sbi', 'axis', 'kotak', 'yes bank'
  ];
  
  for (const vendor of vendors) {
    if (desc.includes(vendor)) {
      return vendor.charAt(0).toUpperCase() + vendor.slice(1);
    }
  }
  
  // Extract company names (words ending with common suffixes)
  const companyPattern = /\b(\w+(?:\s+\w+)*)\s+(?:ltd|limited|inc|corp|corporation|pvt|private|llp|llc)\b/i;
  const match = description.match(companyPattern);
  if (match) {
    return match[1].trim();
  }
  
  return undefined;
}

// PDF text processing utilities
export function extractFinancialDataFromText(text: string): ExtractedData[] {
  const lines = text.split('\n').filter(line => line.trim());
  const data: ExtractedData[] = [];
  
  // Look for invoice patterns
  const invoicePattern = /invoice\s*(?:no\.?|number)?\s*:?\s*([A-Z0-9-]+)/i;
  const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;
  const amountPattern = /(?:₹|rs\.?|inr)\s*([0-9,]+(?:\.\d{2})?)/i;
  
  let currentInvoice: Partial<ExtractedData> = {};
  
  for (const line of lines) {
    // Extract invoice number
    const invoiceMatch = line.match(invoicePattern);
    if (invoiceMatch) {
      currentInvoice.invoiceNo = invoiceMatch[1];
    }
    
    // Extract date
    const dateMatch = line.match(datePattern);
    if (dateMatch) {
      try {
        const date = new Date(dateMatch[1]);
        if (!isNaN(date.getTime())) {
          currentInvoice.date = date.toISOString().split('T')[0];
        }
      } catch (e) {
        // Ignore invalid dates
      }
    }
    
    // Extract amount
    const amountMatch = line.match(amountPattern);
    if (amountMatch) {
      const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
      if (!isNaN(amount)) {
        currentInvoice.amount = amount;
      }
    }
    
    // If we have enough data, create a record
    if (currentInvoice.invoiceNo && currentInvoice.amount) {
      data.push({
        date: currentInvoice.date || new Date().toISOString().split('T')[0],
        description: `Invoice ${currentInvoice.invoiceNo}`,
        amount: currentInvoice.amount,
        category: 'Expenses',
        invoiceNo: currentInvoice.invoiceNo,
        vendor: extractVendorFromDescription(line)
      });
      
      currentInvoice = {};
    }
  }
  
  return data;
}

// Image OCR simulation (in production, you'd use Tesseract.js or similar)
export function simulateOCRExtraction(filename: string, fileSize: number): ExtractedData[] {
  const timestamp = Date.now();
  
  // Simulate different receipt types based on filename and size
  if (filename.toLowerCase().includes('receipt')) {
    return [
      {
        date: new Date().toISOString().split('T')[0],
        description: 'Receipt - Business Expense',
        amount: Math.floor(Math.random() * 5000) + 500,
        category: 'Office Supplies',
        vendor: 'Local Vendor',
        invoiceNo: `REC-${timestamp}`
      }
    ];
  }
  
  if (filename.toLowerCase().includes('invoice')) {
    return [
      {
        date: new Date().toISOString().split('T')[0],
        description: 'Service Invoice',
        amount: Math.floor(Math.random() * 15000) + 2000,
        category: 'Professional Services',
        vendor: 'Service Provider',
        invoiceNo: `INV-${timestamp}`
      }
    ];
  }
  
  // Default receipt
  return [
    {
      date: new Date().toISOString().split('T')[0],
      description: 'Scanned Receipt',
      amount: Math.floor(Math.random() * 2000) + 200,
      category: 'Miscellaneous',
      vendor: 'Unknown Vendor',
      invoiceNo: `IMG-${timestamp}`
    }
  ];
}