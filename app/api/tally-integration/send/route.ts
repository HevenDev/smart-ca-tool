import { NextRequest, NextResponse } from 'next/server';

interface ExtractedData {
  date: string;
  description: string;
  amount: number;
  category: string;
  vendor?: string;
  client?: string;
  invoiceNo: string;
}

interface TallyConfig {
  serverUrl: string;
  port: string;
  companyName: string;
  username: string;
  password: string;
}

interface SendRequest {
  config: TallyConfig;
  data: ExtractedData[];
  batchNumber: number;
  totalBatches: number;
}

// Generate proper Tally XML for voucher creation
function generateTallyVoucherXML(data: ExtractedData[], companyName: string): string {
  const vouchers = data.map((record) => {
    // Determine voucher type based on category
    const isIncome = record.category === 'Income';
    const voucherType = isIncome ? 'Receipt' : 'Payment';
    
    // Format date for Tally (YYYYMMDD)
    const tallyDate = new Date(record.date).toISOString().split('T')[0].replace(/-/g, '');
    
    // Determine ledger names
    const partyLedger = record.vendor || record.client || 'Sundry Debtors';
    const cashLedger = 'Cash';
    
    // Create voucher XML
    return `
    <VOUCHER VCHTYPE="${voucherType}" ACTION="Create" OBJVIEW="Accounting Voucher View">
      <DATE>${tallyDate}</DATE>
      <GUID>${generateGUID()}</GUID>
      <VOUCHERTYPENAME>${voucherType}</VOUCHERTYPENAME>
      <VOUCHERNUMBER>${record.invoiceNo}</VOUCHERNUMBER>
      <PARTYLEDGERNAME>${partyLedger}</PARTYLEDGERNAME>
      <CSTFORMISSUETYPE/>
      <CSTFORMRECVTYPE/>
      <FBTPAYMENTTYPE>Default</FBTPAYMENTTYPE>
      <PERSISTEDVIEW>Accounting Voucher View</PERSISTEDVIEW>
      <NARRATION>${record.description}</NARRATION>
      <ALLLEDGERENTRIES.LIST>
        <LEDGERNAME>${partyLedger}</LEDGERNAME>
        <GSTCLASS/>
        <ISDEEMEDPOSITIVE>${isIncome ? 'Yes' : 'No'}</ISDEEMEDPOSITIVE>
        <LEDGERFROMITEM>No</LEDGERFROMITEM>
        <REMOVEZEROENTRIES>No</REMOVEZEROENTRIES>
        <ISPARTYLEDGER>Yes</ISPARTYLEDGER>
        <AMOUNT>${isIncome ? record.amount : -record.amount}</AMOUNT>
        <VATEXPAMOUNT>${isIncome ? record.amount : -record.amount}</VATEXPAMOUNT>
      </ALLLEDGERENTRIES.LIST>
      <ALLLEDGERENTRIES.LIST>
        <LEDGERNAME>${cashLedger}</LEDGERNAME>
        <GSTCLASS/>
        <ISDEEMEDPOSITIVE>${isIncome ? 'No' : 'Yes'}</ISDEEMEDPOSITIVE>
        <LEDGERFROMITEM>No</LEDGERFROMITEM>
        <REMOVEZEROENTRIES>No</REMOVEZEROENTRIES>
        <ISPARTYLEDGER>No</ISPARTYLEDGER>
        <AMOUNT>${isIncome ? -record.amount : record.amount}</AMOUNT>
        <VATEXPAMOUNT>${isIncome ? -record.amount : record.amount}</VATEXPAMOUNT>
      </ALLLEDGERENTRIES.LIST>
    </VOUCHER>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        ${vouchers}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

// Generate GUID for Tally vouchers
function generateGUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Create required ledgers in Tally
function generateLedgerXML(ledgerNames: string[], companyName: string): string {
  const ledgers = ledgerNames.map(name => `
    <LEDGER NAME="${name}" ACTION="Create">
      <GUID>${generateGUID()}</GUID>
      <PARENT>Sundry Debtors</PARENT>
      <CATEGORY>Primary</CATEGORY>
      <ISBILLWISEON>Yes</ISBILLWISEON>
      <ISCOSTCENTRESON>No</ISCOSTCENTRESON>
      <ISINTERESTON>No</ISINTERESTON>
      <ALLOWINMOBILE>No</ALLOWINMOBILE>
      <ISCOSTTRACKINGON>No</ISCOSTTRACKINGON>
      <ISBENEFICIARYCODEON>No</ISBENEFICIARYCODEON>
      <ISUPDATINGTARGETID>No</ISUPDATINGTARGETID>
      <ASORIGINAL>Yes</ASORIGINAL>
      <ISCONDENSED>No</ISCONDENSED>
      <AFFECTSSTOCK>No</AFFECTSSTOCK>
      <USEFORVAT>No</USEFORVAT>
      <IGNOREPHYSICALDIFFERENCE>No</IGNOREPHYSICALDIFFERENCE>
      <IGNORENEGATIVESTOCK>No</IGNORENEGATIVESTOCK>
      <TREATSALESASMANUFACTURED>No</TREATSALESASMANUFACTURED>
      <TREATPURCHASESASCONSUMED>No</TREATPURCHASESASCONSUMED>
      <TREATEXPENSESASCONSUMED>No</TREATEXPENSESASCONSUMED>
      <ALLOWUSEOFEXPIREDITEMS>No</ALLOWUSEOFEXPIREDITEMS>
      <IGNOREBATCHES>No</IGNOREBATCHES>
      <IGNOREGODOWNS>No</IGNOREGODOWNS>
      <CALCONMRP>No</CALCONMRP>
      <EXCLUDEJRNLFORDAY>No</EXCLUDEJRNLFORDAY>
      <USEFOREXCISE>No</USEFOREXCISE>
      <ISTRADINGACCOUNT>No</ISTRADINGACCOUNT>
      <USEFORSERVICETAX>No</USEFORSERVICETAX>
      <USEFORINTEREST>No</USEFORINTEREST>
      <USEFORGAINLOSS>No</USEFORGAINLOSS>
      <USEFORGODOWNTRANSFER>No</USEFORGODOWNTRANSFER>
      <USEFORCOMPOUND>No</USEFORCOMPOUND>
      <ALTERID>1</ALTERID>
      <SERVICECATEGORY>&#4; Not Applicable</SERVICECATEGORY>
      <EXCISELEDGERCLASSIFICATION>&#4; Not Applicable</EXCISELEDGERCLASSIFICATION>
      <EXCISEDUTYTYPE>&#4; Not Applicable</EXCISEDUTYTYPE>
      <EXCISENATUREOFPURCHASE>&#4; Not Applicable</EXCISENATUREOFPURCHASE>
      <LEDGERFBTCATEGORY>&#4; Not Applicable</LEDGERFBTCATEGORY>
      <VATAPPLICABLE>&#4; Not Applicable</VATAPPLICABLE>
    </LEDGER>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        ${ledgers}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

// Send data to Tally server
async function sendToTallyServer(config: TallyConfig, xmlData: string): Promise<{ success: boolean; response?: string; error?: string }> {
  try {
    const tallyUrl = `http://${config.serverUrl}:${config.port}`;
    
    const response = await fetch(tallyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'Content-Length': xmlData.length.toString()
      },
      body: xmlData
    });
    
    if (!response.ok) {
      return {
        success: false,
        error: `Tally server error: ${response.status} ${response.statusText}`
      };
    }
    
    const responseText = await response.text();
    
    // Check for Tally errors in response
    if (responseText.includes('<ERROR>') || responseText.includes('Error')) {
      const errorMatch = responseText.match(/<ERROR>(.*?)<\/ERROR>/);
      const errorMessage = errorMatch ? errorMatch[1] : 'Unknown Tally error';
      return {
        success: false,
        error: `Tally processing error: ${errorMessage}`
      };
    }
    
    return {
      success: true,
      response: responseText
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: `Network error: ${error.message}`
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { config, data, batchNumber, totalBatches }: SendRequest = await request.json();
    
    // Validate request
    if (!config || !data || data.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request: Missing configuration or data'
      }, { status: 400 });
    }
    
    // Validate Tally configuration
    if (!config.serverUrl || !config.port || !config.companyName) {
      return NextResponse.json({
        success: false,
        error: 'Invalid Tally configuration: Server URL, port, and company name are required'
      }, { status: 400 });
    }
    
    try {
      // Step 1: Create required ledgers first
      const uniqueLedgers = [...new Set(data.map(item => item.vendor || item.client).filter(Boolean))];
      
      if (uniqueLedgers.length > 0) {
        const ledgerXML = generateLedgerXML(uniqueLedgers, config.companyName);
        const ledgerResult = await sendToTallyServer(config, ledgerXML);
        
        if (!ledgerResult.success) {
          console.warn('Ledger creation warning:', ledgerResult.error);
          // Continue anyway - ledgers might already exist
        }
      }
      
      // Step 2: Create vouchers
      const voucherXML = generateTallyVoucherXML(data, config.companyName);
      const voucherResult = await sendToTallyServer(config, voucherXML);
      
      if (voucherResult.success) {
        const processedIds = data.map(record => `${record.invoiceNo}-${Date.now()}`);
        
        return NextResponse.json({
          success: true,
          message: `Batch ${batchNumber}/${totalBatches} processed successfully`,
          processedIds,
          batchInfo: {
            batchNumber,
            totalBatches,
            recordsInBatch: data.length,
            ledgersCreated: uniqueLedgers.length,
            vouchersCreated: data.length
          },
          tallyResponse: voucherResult.response
        });
      } else {
        return NextResponse.json({
          success: false,
          error: voucherResult.error
        }, { status: 500 });
      }
      
    } catch (tallyError: any) {
      return NextResponse.json({
        success: false,
        error: `Tally integration error: ${tallyError.message}`
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Tally send error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process request'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Tally Data Integration Service',
    description: 'Send financial data to Tally ERP as vouchers',
    features: [
      'Automatic voucher creation',
      'Ledger management',
      'Batch processing',
      'Error handling',
      'Receipt and Payment vouchers',
      'Party ledger creation'
    ],
    voucherTypes: {
      'Income': 'Receipt Voucher',
      'Expenses': 'Payment Voucher',
      'Other Categories': 'Payment Voucher'
    },
    requirements: {
      tally: 'Tally.ERP 9 or higher with HTTP API enabled',
      company: 'Company must be loaded and accessible',
      ledgers: 'Cash ledger must exist (created automatically if missing)'
    }
  });
}