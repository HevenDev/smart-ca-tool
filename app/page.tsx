"use client";

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import DataGrid from '@/components/DataGrid';
import TallyIntegration from '@/components/TallyIntegration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, Database, Send } from 'lucide-react';

export interface ExtractedData {
  date: string;
  description: string;
  amount: number;
  category: string;
  vendor?: string;
  client?: string;
  invoiceNo: string;
}

export default function Home() {
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([]);
  const [currentFile, setCurrentFile] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileProcessed = (data: ExtractedData[], filename: string) => {
    setExtractedData(data);
    setCurrentFile(filename);
  };

  const handleProcessingState = (processing: boolean) => {
    setIsProcessing(processing);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Tally Integration System
              </h1>
              <p className="text-gray-600">Extract financial data and sync with Tally</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Upload className="w-8 h-8 opacity-80" />
                <div>
                  <p className="text-blue-100 text-sm">Files Processed</p>
                  <p className="text-2xl font-bold">{currentFile ? 1 : 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Database className="w-8 h-8 opacity-80" />
                <div>
                  <p className="text-green-100 text-sm">Records Extracted</p>
                  <p className="text-2xl font-bold">{extractedData.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Send className="w-8 h-8 opacity-80" />
                <div>
                  <p className="text-purple-100 text-sm">Total Amount</p>
                  <p className="text-2xl font-bold">
                    ₹{extractedData.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 opacity-80" />
                <div>
                  <p className="text-orange-100 text-sm">Current File</p>
                  <p className="text-sm font-medium truncate">
                    {currentFile || 'No file processed'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm">
            <TabsTrigger value="upload" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              File Upload
            </TabsTrigger>
            <TabsTrigger value="data" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Data View
            </TabsTrigger>
            <TabsTrigger value="tally" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Tally Integration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <span>Upload Financial Documents</span>
                </CardTitle>
                <CardDescription>
                  Upload PDF invoices, Excel files, or images to extract financial data automatically
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload 
                  onFileProcessed={handleFileProcessed}
                  onProcessingState={handleProcessingState}
                  isProcessing={isProcessing}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-blue-600" />
                  <span>Extracted Financial Data</span>
                </CardTitle>
                <CardDescription>
                  Review and edit extracted data before sending to Tally
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataGrid 
                  data={extractedData} 
                  onDataChange={setExtractedData}
                  filename={currentFile}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tally" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <Send className="w-5 h-5 text-blue-600" />
                  <span>Tally Integration</span>
                </CardTitle>
                <CardDescription>
                  Configure Tally settings and send financial data to your Tally system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TallyIntegration extractedData={extractedData} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}