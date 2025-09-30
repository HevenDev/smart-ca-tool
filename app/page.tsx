"use client";

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import DataGrid from '@/components/DataGrid';
import BankStatementGrid from '@/components/BankStatementGrid';
import TallyIntegration from '@/components/TallyIntegration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileText, Upload, Database, Send, CreditCard } from 'lucide-react';

export interface ExtractedData {
  date: string;
  description: string;
  amount: number;
  category: string;
  vendor?: string;
  client?: string;
  invoiceNo: string;
}

interface BankStatement {
  bankName: string;
  accountNumber: string;
  branch: string;
  ifscCode: string;
  currency: string;
  statementPeriod: {
    fromDate: string;
    toDate: string;
  };
  transactions: {
    date: string;
    description: string;
    referenceNumber: string;
    voucherType: string;
    ledgerName: string;
    debitAmount: number;
    creditAmount: number;
    balance: number;
    narration: string;
  }[];
}

export default function Home() {
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([]);
  const [currentFile, setCurrentFile] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bankStatementData, setBankStatementData] = useState<BankStatement | null>(null);

  const handleFileProcessed = (data: ExtractedData[], filename: string) => {
    setExtractedData(data);
    setCurrentFile(filename);
  };

  const handleProcessingState = (processing: boolean) => {
    setIsProcessing(processing);
  };

  const handleBankStatementData = (data: BankStatement) => {
    setBankStatementData(data);
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
                <CreditCard className="w-8 h-8 opacity-80" />
                <div>
                  <p className="text-orange-100 text-sm">Bank Statements</p>
                  <p className="text-2xl font-bold">{bankStatementData ? 1 : 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
            <TabsTrigger value="upload" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              File Upload
            </TabsTrigger>
            <TabsTrigger value="data" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Data View
            </TabsTrigger>
            <TabsTrigger value="bank" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Bank Statement
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

          <TabsContent value="bank" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span>Bank Statement View</span>
                </CardTitle>
                <CardDescription>
                  View and edit bank statement data in Excel-like format
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bankStatementData ? (
                  <BankStatementGrid
                    data={bankStatementData}
                    onDataChange={setBankStatementData}
                  />
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Bank Statement Data</h3>
                    <p className="text-gray-600 mb-4">
                      Bank statement data will appear here when received.
                    </p>
                    <Button
                      onClick={() => handleBankStatementData({
                        bankName: "HDFC Bank",
                        accountNumber: "1234567890",
                        branch: "MG Road Branch",
                        ifscCode: "HDFC0001234",
                        currency: "INR",
                        statementPeriod: {
                          fromDate: "2025-09-01",
                          toDate: "2025-09-30"
                        },
                        transactions: [
                          {
                            date: "2025-09-02",
                            description: "NEFT Credit - Salary",
                            referenceNumber: "NEFT12345",
                            voucherType: "Receipt",
                            ledgerName: "Salary Account",
                            debitAmount: 0.0,
                            creditAmount: 50000.0,
                            balance: 150000.0,
                            narration: "Monthly salary credited"
                          },
                          {
                            date: "2025-09-05",
                            description: "ATM Withdrawal",
                            referenceNumber: "ATM56789",
                            voucherType: "Payment",
                            ledgerName: "Cash Withdrawal",
                            debitAmount: 10000.0,
                            creditAmount: 0.0,
                            balance: 140000.0,
                            narration: "Cash withdrawn from ATM"
                          },
                          {
                            date: "2025-09-10",
                            description: "Cheque Deposit",
                            referenceNumber: "CHQ99887",
                            voucherType: "Receipt",
                            ledgerName: "Cheque Collection",
                            debitAmount: 0.0,
                            creditAmount: 20000.0,
                            balance: 160000.0,
                            narration: "Cheque deposited"
                          },
                          {
                            date: "2025-09-15",
                            description: "Online Bill Payment - Electricity",
                            referenceNumber: "ONL44567",
                            voucherType: "Payment",
                            ledgerName: "Electricity Expenses",
                            debitAmount: 5000.0,
                            creditAmount: 0.0,
                            balance: 155000.0,
                            narration: "Electricity bill paid via net banking"
                          }
                        ]
                      })}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Load Sample Data
                    </Button>
                  </div>
                )}
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