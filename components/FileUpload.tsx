"use client";

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, File, CheckCircle, AlertCircle, X } from 'lucide-react';
import { ExtractedData } from '@/app/page';

interface FileUploadProps {
  onFileProcessed: (data: ExtractedData[], filename: string) => void;
  onProcessingState: (processing: boolean) => void;
  isProcessing: boolean;
}

export default function FileUpload({ onFileProcessed, onProcessingState, isProcessing }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFile = async (file: File) => {
    setError(null);
    setSuccess(null);
    setUploadProgress(0);
    onProcessingState(true);

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png'
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Unsupported file type. Please upload PDF, Excel, or image files.');
      onProcessingState(false);
      return;
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size too large. Please upload files smaller than 10MB.');
      onProcessingState(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      if (result.success) {
        onFileProcessed(result.data, result.filename);
        setSuccess(`Successfully processed ${result.filename}`);
      } else {
        throw new Error(result.error || 'Processing failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during upload');
    } finally {
      onProcessingState(false);
      setTimeout(() => {
        setUploadProgress(0);
      }, 2000);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="w-full space-y-4">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
          dragActive 
            ? 'border-blue-500 bg-blue-50 scale-105' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileInput}
          accept=".pdf,.xlsx,.xls,.jpg,.jpeg,.png"
        />
        
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 bg-blue-100 rounded-full">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-900">
              Drop your files here or click to browse
            </h3>
            <p className="text-gray-600">
              Supports PDF, Excel files (XLS, XLSX), and images (JPG, PNG)
            </p>
          </div>
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-700 transition-colors"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Select File'}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      {uploadProgress > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Upload Progress</span>
            <span className="text-gray-600">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="flex items-center justify-center space-x-3 p-4 bg-blue-50 rounded-lg">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-blue-700 font-medium">Processing your file...</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 flex justify-between items-center">
            {success}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearMessages}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 flex justify-between items-center">
            {error}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearMessages}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* File Type Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <File className="w-5 h-5 text-red-600" />
          <div>
            <p className="font-medium text-gray-900">PDF Documents</p>
            <p className="text-sm text-gray-600">Invoices, receipts, statements</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <File className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-medium text-gray-900">Excel Files</p>
            <p className="text-sm text-gray-600">Financial data, reports</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <File className="w-5 h-5 text-blue-600" />
          <div>
            <p className="font-medium text-gray-900">Images</p>
            <p className="text-sm text-gray-600">Receipt photos, scanned docs</p>
          </div>
        </div>
      </div>
    </div>
  );
}