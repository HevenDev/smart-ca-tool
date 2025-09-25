"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  Server, 
  Database,
  Loader2,
  ExternalLink,
  Shield
} from 'lucide-react';
import { ExtractedData } from '@/app/page';

interface TallyIntegrationProps {
  extractedData: ExtractedData[];
}

interface TallyConfig {
  serverUrl: string;
  port: string;
  companyName: string;
  username: string;
  password: string;
}

export default function TallyIntegration({ extractedData }: TallyIntegrationProps) {
  const [config, setConfig] = useState<TallyConfig>({
    serverUrl: 'localhost',
    port: '9000',
    companyName: '',
    username: '',
    password: ''
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [sentRecords, setSentRecords] = useState<string[]>([]);

  const testConnection = async () => {
    setIsTesting(true);
    setConnectionStatus('testing');
    setStatusMessage('Testing connection to Tally server...');
    
    try {
      const response = await fetch('/api/tally-integration/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setIsConnected(true);
        setConnectionStatus('success');
        setStatusMessage(`Successfully connected to Tally! Company: ${result.companyName}`);
      } else {
        setIsConnected(false);
        setConnectionStatus('error');
        setStatusMessage(result.error || 'Connection failed');
      }
    } catch (error) {
      setIsConnected(false);
      setConnectionStatus('error');
      setStatusMessage('Failed to connect to Tally server');
    } finally {
      setIsTesting(false);
    }
  };

  const sendToTally = async () => {
    if (!isConnected || extractedData.length === 0) return;
    
    setIsSending(true);
    setSendProgress(0);
    setSentRecords([]);
    
    try {
      // Send data in batches
      const batchSize = 5;
      const batches = [];
      for (let i = 0; i < extractedData.length; i += batchSize) {
        batches.push(extractedData.slice(i, i + batchSize));
      }
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        const response = await fetch('/api/tally-integration/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            config,
            data: batch,
            batchNumber: i + 1,
            totalBatches: batches.length
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          setSentRecords(prev => [...prev, ...result.processedIds]);
          setSendProgress(((i + 1) / batches.length) * 100);
        } else {
          throw new Error(result.error || 'Failed to send batch');
        }
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setStatusMessage(`Successfully sent ${extractedData.length} records to Tally!`);
      setConnectionStatus('success');
      
    } catch (error) {
      setConnectionStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'Failed to send data to Tally');
    } finally {
      setIsSending(false);
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'testing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Server className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'testing':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  if (extractedData.length === 0) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          No data available to send to Tally. Please upload and process a file first.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="preview">Data Preview</TabsTrigger>
          <TabsTrigger value="send">Send to Tally</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <span>Tally Connection Settings</span>
              </CardTitle>
              <CardDescription>
                Configure your Tally server connection details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serverUrl">Server URL</Label>
                  <Input
                    id="serverUrl"
                    value={config.serverUrl}
                    onChange={(e) => setConfig(prev => ({ ...prev, serverUrl: e.target.value }))}
                    placeholder="localhost or IP address"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    value={config.port}
                    onChange={(e) => setConfig(prev => ({ ...prev, port: e.target.value }))}
                    placeholder="9000"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={config.companyName}
                  onChange={(e) => setConfig(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="Your Tally company name"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username (Optional)</Label>
                  <Input
                    id="username"
                    value={config.username}
                    onChange={(e) => setConfig(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Tally username"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password (Optional)</Label>
                  <Input
                    id="password"
                    type="password"
                    value={config.password}
                    onChange={(e) => setConfig(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Tally password"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  onClick={testConnection}
                  disabled={isTesting || !config.serverUrl || !config.companyName}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {getConnectionIcon()}
                  <span className="ml-2">
                    {isTesting ? 'Testing...' : 'Test Connection'}
                  </span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => window.open('https://tallysolutions.com/support/', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Tally Help
                </Button>
              </div>
              
              {statusMessage && (
                <Alert className={getStatusColor()}>
                  {getConnectionIcon()}
                  <AlertDescription className={connectionStatus === 'error' ? 'text-red-800' : 
                    connectionStatus === 'success' ? 'text-green-800' : 'text-blue-800'}>
                    {statusMessage}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Security Note</h4>
                  <p className="text-sm text-gray-600">
                    Your Tally credentials are transmitted securely and not stored on our servers. 
                    Make sure your Tally server allows API connections.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-blue-600" />
                <span>Data Preview</span>
              </CardTitle>
              <CardDescription>
                Review the data that will be sent to Tally
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-800">{extractedData.length}</p>
                    <p className="text-sm text-blue-600">Total Records</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-800">
                      {extractedData.filter(item => item.category === 'Income').length}
                    </p>
                    <p className="text-sm text-green-600">Income Entries</p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-red-800">
                      {extractedData.filter(item => item.category !== 'Income').length}
                    </p>
                    <p className="text-sm text-red-600">Expense Entries</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-800">
                      ₹{extractedData.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-purple-600">Total Amount</p>
                  </div>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-3 border-b">
                    <h4 className="font-medium">Sample Records (First 5)</h4>
                  </div>
                  <div className="divide-y max-h-64 overflow-y-auto">
                    {extractedData.slice(0, 5).map((record, index) => (
                      <div key={index} className="p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{record.description}</p>
                          <p className="text-sm text-gray-500">
                            {record.date} • {record.vendor || record.client || 'No vendor'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${record.category === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{record.amount.toLocaleString()}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {record.category}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Send className="w-5 h-5 text-blue-600" />
                <span>Send to Tally</span>
              </CardTitle>
              <CardDescription>
                Transfer your financial data to Tally ERP
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {isConnected ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">
                        {isConnected ? 'Connected to Tally' : 'Not connected to Tally'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {isConnected ? 
                          `Ready to send ${extractedData.length} records` : 
                          'Please configure and test connection first'
                        }
                      </p>
                    </div>
                  </div>
                  <Badge variant={isConnected ? 'default' : 'destructive'}>
                    {isConnected ? 'Ready' : 'Not Ready'}
                  </Badge>
                </div>
                
                {isSending && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Sending progress</span>
                      <span>{Math.round(sendProgress)}%</span>
                    </div>
                    <Progress value={sendProgress} className="h-2" />
                    <p className="text-sm text-gray-600">
                      Sent {sentRecords.length} of {extractedData.length} records
                    </p>
                  </div>
                )}
                
                <Button
                  onClick={sendToTally}
                  disabled={!isConnected || isSending || extractedData.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending to Tally...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send {extractedData.length} Records to Tally
                    </>
                  )}
                </Button>
                
                {sentRecords.length > 0 && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Successfully sent {sentRecords.length} records to Tally!
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm">View sent record IDs</summary>
                        <div className="mt-2 max-h-24 overflow-y-auto">
                          {sentRecords.map(id => (
                            <div key={id} className="text-xs font-mono">{id}</div>
                          ))}
                        </div>
                      </details>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}