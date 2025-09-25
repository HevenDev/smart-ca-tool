"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Edit3, Save, X, Download, Plus, Trash2, Search, Filter } from 'lucide-react';
import { ExtractedData } from '@/app/page';

interface DataGridProps {
  data: ExtractedData[];
  onDataChange: (data: ExtractedData[]) => void;
  filename: string;
}

const categories = [
  'Income', 'Expenses', 'Marketing', 'Travel & Entertainment', 
  'Software', 'Office Supplies', 'Professional Services', 'Utilities', 
  'Rent', 'Insurance', 'Miscellaneous'
];

export default function DataGrid({ data, onDataChange, filename }: DataGridProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<ExtractedData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const tableRef = useRef<HTMLDivElement>(null);

  if (!data || data.length === 0) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <AlertDescription className="text-blue-800">
          No data available. Please upload a file to see extracted financial data here.
        </AlertDescription>
      </Alert>
    );
  }

  const filteredData = data.filter(item => {
    const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.client?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditingData({ ...data[index] });
  };

  const saveEdit = () => {
    if (editingIndex !== null && editingData) {
      const updatedData = [...data];
      updatedData[editingIndex] = editingData;
      onDataChange(updatedData);
      setEditingIndex(null);
      setEditingData(null);
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingData(null);
  };

  const deleteRow = (index: number) => {
    const updatedData = data.filter((_, i) => i !== index);
    onDataChange(updatedData);
  };

  const addNewRow = () => {
    const newRow: ExtractedData = {
      date: new Date().toISOString().split('T')[0],
      description: 'New Entry',
      amount: 0,
      category: 'Miscellaneous',
      vendor: '',
      invoiceNo: 'NEW-' + Date.now()
    };
    onDataChange([...data, newRow]);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Description', 'Amount', 'Category', 'Vendor/Client', 'Invoice No'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => [
        row.date,
        `"${row.description}"`,
        row.amount,
        row.category,
        `"${row.vendor || row.client || ''}"`,
        row.invoiceNo
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename || 'financial-data'}.csv`;
    a.click();
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Income': 'bg-green-100 text-green-800',
      'Expenses': 'bg-red-100 text-red-800',
      'Marketing': 'bg-purple-100 text-purple-800',
      'Travel & Entertainment': 'bg-blue-100 text-blue-800',
      'Software': 'bg-indigo-100 text-indigo-800',
      'Office Supplies': 'bg-gray-100 text-gray-800',
      'Professional Services': 'bg-yellow-100 text-yellow-800',
      'Utilities': 'bg-orange-100 text-orange-800',
      'Rent': 'bg-pink-100 text-pink-800',
      'Insurance': 'bg-teal-100 text-teal-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const totalAmount = filteredData.reduce((sum, item) => sum + item.amount, 0);
  const incomeTotal = filteredData.filter(item => item.category === 'Income').reduce((sum, item) => sum + item.amount, 0);
  const expenseTotal = filteredData.filter(item => item.category !== 'Income').reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
          <p className="text-blue-100 text-sm">Total Records</p>
          <p className="text-2xl font-bold">{filteredData.length}</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
          <p className="text-green-100 text-sm">Total Income</p>
          <p className="text-2xl font-bold">₹{incomeTotal.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-lg">
          <p className="text-red-100 text-sm">Total Expenses</p>
          <p className="text-2xl font-bold">₹{expenseTotal.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
          <p className="text-purple-100 text-sm">Net Amount</p>
          <p className="text-2xl font-bold">₹{(incomeTotal - expenseTotal).toLocaleString()}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 space-x-0 sm:space-x-4">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 space-x-0 sm:space-x-4 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={addNewRow}
            className="bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>
          <Button
            onClick={exportToCSV}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <div 
        ref={tableRef}
        className="rounded-lg border bg-white overflow-hidden shadow-sm"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Description</TableHead>
                <TableHead className="font-semibold text-right">Amount (₹)</TableHead>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold">Vendor/Client</TableHead>
                <TableHead className="font-semibold">Invoice No</TableHead>
                <TableHead className="font-semibold w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((row, index) => (
                <TableRow 
                  key={index} 
                  className="hover:bg-gray-50 transition-colors"
                >
                  <TableCell>
                    {editingIndex === index ? (
                      <Input
                        type="date"
                        value={editingData?.date || ''}
                        onChange={(e) => setEditingData(prev => 
                          prev ? { ...prev, date: e.target.value } : null
                        )}
                        className="w-full"
                      />
                    ) : (
                      new Date(row.date).toLocaleDateString()
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {editingIndex === index ? (
                      <Input
                        value={editingData?.description || ''}
                        onChange={(e) => setEditingData(prev => 
                          prev ? { ...prev, description: e.target.value } : null
                        )}
                        className="w-full"
                      />
                    ) : (
                      <div className="max-w-xs truncate" title={row.description}>
                        {row.description}
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-right font-medium">
                    {editingIndex === index ? (
                      <Input
                        type="number"
                        value={editingData?.amount || ''}
                        onChange={(e) => setEditingData(prev => 
                          prev ? { ...prev, amount: parseFloat(e.target.value) || 0 } : null
                        )}
                        className="w-full text-right"
                      />
                    ) : (
                      <span className={`${row.category === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{row.amount.toLocaleString()}
                      </span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {editingIndex === index ? (
                      <Select
                        value={editingData?.category || ''}
                        onValueChange={(value) => setEditingData(prev => 
                          prev ? { ...prev, category: value } : null
                        )}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={getCategoryColor(row.category)}>
                        {row.category}
                      </Badge>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {editingIndex === index ? (
                      <Input
                        value={editingData?.vendor || editingData?.client || ''}
                        onChange={(e) => setEditingData(prev => 
                          prev ? { ...prev, vendor: e.target.value, client: e.target.value } : null
                        )}
                        className="w-full"
                      />
                    ) : (
                      <span className="text-gray-600">
                        {row.vendor || row.client || '-'}
                      </span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {editingIndex === index ? (
                      <Input
                        value={editingData?.invoiceNo || ''}
                        onChange={(e) => setEditingData(prev => 
                          prev ? { ...prev, invoiceNo: e.target.value } : null
                        )}
                        className="w-full"
                      />
                    ) : (
                      <span className="font-mono text-sm">
                        {row.invoiceNo}
                      </span>
                    )}
                  </TableCell>
                  
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
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(index)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteRow(index)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Showing {filteredData.length} of {data.length} records</span>
          <div className="flex space-x-4">
            <span>Total: <strong>₹{totalAmount.toLocaleString()}</strong></span>
            {filename && <span>Source: <strong>{filename}</strong></span>}
          </div>
        </div>
      </div>
    </div>
  );
}