"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Edit3, Save, X, Download, Eye, EyeOff, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Transaction {
  date: string;
  description: string;
  referenceNumber: string;
  voucherType: string;
  ledgerName: string;
  debitAmount: number;
  creditAmount: number;
  balance: number;
  narration: string;
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
  transactions: Transaction[];
}

interface BankStatementGridProps {
  data: BankStatement;
  onDataChange?: (data: BankStatement) => void;
}

export default function BankStatementGrid({ data, onDataChange }: BankStatementGridProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  if (!data || !data.transactions || data.transactions.length === 0) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <AlertDescription className="text-blue-800">
          No bank statement data available. Please provide bank statement data to display.
        </AlertDescription>
      </Alert>
    );
  }

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditingTransaction({ ...data.transactions[index] });
  };

  const saveEdit = () => {
    if (editingIndex !== null && editingTransaction && onDataChange) {
      const updatedTransactions = [...data.transactions];
      updatedTransactions[editingIndex] = editingTransaction;
      const updatedData = { ...data, transactions: updatedTransactions };
      onDataChange(updatedData);
      setEditingIndex(null);
      setEditingTransaction(null);
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingTransaction(null);
  };

  const exportToCSV = () => {
    const headers = [
      'Date', 'Description', 'Reference Number', 'Voucher Type', 'Ledger Name',
      'Debit Amount', 'Credit Amount', 'Balance', 'Narration'
    ];
    const csvContent = [
      headers.join(','),
      ...data.transactions.map(row => [
        row.date,
        `"${row.description}"`,
        row.referenceNumber,
        row.voucherType,
        `"${row.ledgerName}"`,
        row.debitAmount,
        row.creditAmount,
        row.balance,
        `"${row.narration}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.bankName}_${data.accountNumber}_statement.csv`;
    a.click();
  };

  const exportToExcel = () => {
    // Prepare bank details for Excel
    const bankDetails = [
      ['Bank Name', data.bankName],
      ['Account Number', data.accountNumber],
      ['Branch', data.branch],
      ['IFSC Code', data.ifscCode],
      ['Currency', data.currency],
      ['Statement Period', `${data.statementPeriod.fromDate} to ${data.statementPeriod.toDate}`],
      [], // Empty row
    ];

    // Prepare transactions data
    const transactionHeaders = [
      'Date', 'Description', 'Reference Number', 'Voucher Type', 'Ledger Name',
      'Debit Amount', 'Credit Amount', 'Balance', 'Narration'
    ];

    const transactionData = data.transactions.map(transaction => [
      transaction.date,
      transaction.description,
      transaction.referenceNumber,
      transaction.voucherType,
      transaction.ledgerName,
      transaction.debitAmount,
      transaction.creditAmount,
      transaction.balance,
      transaction.narration
    ]);

    // Create workbook and worksheets
    const wb = XLSX.utils.book_new();

    // Bank details sheet
    const bankSheet = XLSX.utils.aoa_to_sheet([
      ...bankDetails,
      ['Transaction Details'],
      transactionHeaders,
      ...transactionData
    ]);

    // Style the headers
    if (bankSheet['!cols']) {
      bankSheet['!cols'] = [
        { wch: 12 }, // Date
        { wch: 40 }, // Description
        { wch: 15 }, // Reference Number
        { wch: 12 }, // Voucher Type
        { wch: 20 }, // Ledger Name
        { wch: 15 }, // Debit Amount
        { wch: 15 }, // Credit Amount
        { wch: 15 }, // Balance
        { wch: 40 }, // Narration
      ];
    }

    XLSX.utils.book_append_sheet(wb, bankSheet, 'Bank Statement');

    // Summary sheet
    const summaryData = [
      ['Summary'],
      ['Total Debits', totalDebits],
      ['Total Credits', totalCredits],
      ['Net Balance', netBalance],
      ['Total Transactions', data.transactions.length],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    // Generate and download the file
    XLSX.writeFile(wb, `${data.bankName}_${data.accountNumber}_updated_statement.xlsx`);
  };

  const totalDebits = data.transactions.reduce((sum, t) => sum + t.debitAmount, 0);
  const totalCredits = data.transactions.reduce((sum, t) => sum + t.creditAmount, 0);
  const netBalance = totalCredits - totalDebits;

  return (
    <div className="space-y-6">
      {/* Bank Details Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-xl font-bold text-blue-900">{data.bankName} - Bank Statement</span>
            <div className="flex space-x-2">
              <Button
                onClick={() => setIsEditMode(!isEditMode)}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                {isEditMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span>{isEditMode ? 'View Mode' : 'Edit Mode'}</span>
              </Button>
              <Button
                onClick={exportToCSV}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                onClick={exportToExcel}
                variant="outline"
                size="sm"
                className="ml-2"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-semibold text-gray-700">Account Number:</span>
              <span className="ml-2 font-mono">{data.accountNumber}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Branch:</span>
              <span className="ml-2">{data.branch}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">IFSC Code:</span>
              <span className="ml-2 font-mono">{data.ifscCode}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Currency:</span>
              <span className="ml-2">{data.currency}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Period:</span>
              <span className="ml-2">
                {new Date(data.statementPeriod.fromDate).toLocaleDateString()} - {new Date(data.statementPeriod.toDate).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Total Transactions:</span>
              <span className="ml-2">{data.transactions.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-lg">
          <p className="text-red-100 text-sm">Total Debits</p>
          <p className="text-2xl font-bold">₹{totalDebits.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
          <p className="text-green-100 text-sm">Total Credits</p>
          <p className="text-2xl font-bold">₹{totalCredits.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
          <p className="text-blue-100 text-sm">Net Balance</p>
          <p className="text-2xl font-bold">₹{netBalance.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
          <p className="text-purple-100 text-sm">Transactions</p>
          <p className="text-2xl font-bold">{data.transactions.length}</p>
        </div>
      </div>

      {/* Transactions Table */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Transaction Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="font-semibold">Reference</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Ledger</TableHead>
                    <TableHead className="font-semibold text-right">Debit (₹)</TableHead>
                    <TableHead className="font-semibold text-right">Credit (₹)</TableHead>
                    <TableHead className="font-semibold text-right">Balance (₹)</TableHead>
                    <TableHead className="font-semibold">Narration</TableHead>
                    {isEditMode && <TableHead className="font-semibold w-24">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.transactions.map((transaction, index) => (
                    <TableRow key={index} className="hover:bg-gray-50 transition-colors">
                      <TableCell>
                        {editingIndex === index ? (
                          <Input
                            type="date"
                            value={editingTransaction?.date || ''}
                            onChange={(e) => setEditingTransaction(prev =>
                              prev ? { ...prev, date: e.target.value } : null
                            )}
                            className="w-full"
                          />
                        ) : (
                          new Date(transaction.date).toLocaleDateString()
                        )}
                      </TableCell>

                      <TableCell>
                        {editingIndex === index ? (
                          <Input
                            value={editingTransaction?.description || ''}
                            onChange={(e) => setEditingTransaction(prev =>
                              prev ? { ...prev, description: e.target.value } : null
                            )}
                            className="w-full"
                          />
                        ) : (
                          <div className="max-w-xs truncate" title={transaction.description}>
                            {transaction.description}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        {editingIndex === index ? (
                          <Input
                            value={editingTransaction?.referenceNumber || ''}
                            onChange={(e) => setEditingTransaction(prev =>
                              prev ? { ...prev, referenceNumber: e.target.value } : null
                            )}
                            className="w-full"
                          />
                        ) : (
                          <span className="font-mono text-sm">{transaction.referenceNumber}</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge variant={transaction.voucherType === 'Receipt' ? 'default' : 'secondary'}>
                          {transaction.voucherType}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {editingIndex === index ? (
                          <Input
                            value={editingTransaction?.ledgerName || ''}
                            onChange={(e) => setEditingTransaction(prev =>
                              prev ? { ...prev, ledgerName: e.target.value } : null
                            )}
                            className="w-full"
                          />
                        ) : (
                          <span className="text-gray-700">{transaction.ledgerName}</span>
                        )}
                      </TableCell>

                      <TableCell className="text-right font-medium">
                        {editingIndex === index ? (
                          <Input
                            type="number"
                            value={editingTransaction?.debitAmount || ''}
                            onChange={(e) => setEditingTransaction(prev =>
                              prev ? { ...prev, debitAmount: parseFloat(e.target.value) || 0 } : null
                            )}
                            className="w-full text-right"
                          />
                        ) : (
                          <span className={transaction.debitAmount > 0 ? 'text-red-600' : ''}>
                            {transaction.debitAmount > 0 ? `₹${transaction.debitAmount.toLocaleString()}` : '-'}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-right font-medium">
                        {editingIndex === index ? (
                          <Input
                            type="number"
                            value={editingTransaction?.creditAmount || ''}
                            onChange={(e) => setEditingTransaction(prev =>
                              prev ? { ...prev, creditAmount: parseFloat(e.target.value) || 0 } : null
                            )}
                            className="w-full text-right"
                          />
                        ) : (
                          <span className={transaction.creditAmount > 0 ? 'text-green-600' : ''}>
                            {transaction.creditAmount > 0 ? `₹${transaction.creditAmount.toLocaleString()}` : '-'}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-right font-medium">
                        <span className="text-blue-600">
                          ₹{transaction.balance.toLocaleString()}
                        </span>
                      </TableCell>

                      <TableCell>
                        {editingIndex === index ? (
                          <Input
                            value={editingTransaction?.narration || ''}
                            onChange={(e) => setEditingTransaction(prev =>
                              prev ? { ...prev, narration: e.target.value } : null
                            )}
                            className="w-full"
                          />
                        ) : (
                          <div className="max-w-xs truncate" title={transaction.narration}>
                            {transaction.narration}
                          </div>
                        )}
                      </TableCell>

                      {isEditMode && (
                        <TableCell>
                          {editingIndex === index ? (
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                onClick={saveEdit}
                                className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEdit}
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(index)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
