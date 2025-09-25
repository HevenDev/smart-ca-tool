import { NextRequest, NextResponse } from 'next/server';

interface TallyConfig {
  serverUrl: string;
  port: string;
  companyName: string;
  username: string;
  password: string;
}

// Real Tally connection test using HTTP API
async function testTallyConnection(config: TallyConfig): Promise<{ success: boolean; companyName?: string; error?: string; serverInfo?: any }> {
  try {
    // Construct Tally server URL
    const tallyUrl = `http://${config.serverUrl}:${config.port}`;
    
    // Create XML request to test connection and get company info
    const testXML = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>List of Companies</REPORTNAME>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;

    // Test connection with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(tallyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml',
          'Content-Length': testXML.length.toString()
        },
        body: testXML,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 404) {
          return { 
            success: false, 
            error: 'Tally server not found. Please check if Tally is running and HTTP API is enabled.' 
          };
        }
        return { 
          success: false, 
          error: `Tally server responded with error: ${response.status} ${response.statusText}` 
        };
      }
      
      const responseText = await response.text();
      
      // Parse XML response to check if company exists
      if (responseText.includes('No Company') || responseText.includes('Error')) {
        return { 
          success: false, 
          error: `Company "${config.companyName}" not found in Tally. Please check the company name.` 
        };
      }
      
      // Check if specific company is accessible
      if (config.companyName && !responseText.includes(config.companyName)) {
        // Try to connect to specific company
        const companyTestXML = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Company</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${config.companyName}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;
        
        const companyResponse = await fetch(tallyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/xml',
            'Content-Length': companyTestXML.length.toString()
          },
          body: companyTestXML
        });
        
        if (!companyResponse.ok) {
          return { 
            success: false, 
            error: `Cannot access company "${config.companyName}". Please verify the company name and ensure it's not password protected.` 
          };
        }
      }
      
      // Connection successful
      return { 
        success: true, 
        companyName: config.companyName,
        serverInfo: {
          url: tallyUrl,
          status: 'Connected',
          version: 'Tally.ERP 9',
          responseTime: Date.now()
        }
      };
      
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return { 
          success: false, 
          error: 'Connection timeout. Please check if Tally server is running and accessible.' 
        };
      }
      
      if (fetchError.code === 'ECONNREFUSED') {
        return { 
          success: false, 
          error: 'Connection refused. Please ensure Tally is running and HTTP API is enabled on the specified port.' 
        };
      }
      
      return { 
        success: false, 
        error: `Network error: ${fetchError.message}. Please check your network connection and Tally server settings.` 
      };
    }
    
  } catch (error: any) {
    return { 
      success: false, 
      error: `Connection test failed: ${error.message}` 
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const config: TallyConfig = await request.json();
    
    // Validate required fields
    if (!config.serverUrl || !config.port || !config.companyName) {
      return NextResponse.json({
        success: false,
        error: 'Server URL, Port, and Company Name are required'
      }, { status: 400 });
    }
    
    // Validate port number
    const portNum = parseInt(config.port);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      return NextResponse.json({
        success: false,
        error: 'Please enter a valid port number (1-65535)'
      }, { status: 400 });
    }
    
    // Test the connection
    const result = await testTallyConnection(config);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Successfully connected to Tally server',
        companyName: result.companyName,
        serverInfo: result.serverInfo,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Tally connection test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Invalid request data or server error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Tally Connection Test Service',
    description: 'Test connectivity to Tally ERP server',
    requirements: {
      tally: 'Tally.ERP 9 or higher',
      httpApi: 'HTTP API must be enabled in Tally',
      network: 'Network access to Tally server',
      port: 'Default port is 9000'
    },
    instructions: [
      '1. Start Tally ERP software',
      '2. Enable HTTP API in Tally (Gateway of Tally > F11 > Advanced Configuration > HTTP API)',
      '3. Note the port number (usually 9000)',
      '4. Ensure company is loaded and accessible',
      '5. Test connection using this endpoint'
    ]
  });
}