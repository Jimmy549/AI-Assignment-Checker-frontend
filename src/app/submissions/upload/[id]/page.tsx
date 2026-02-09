'use client';

import React, { useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { toast } from 'react-hot-toast';

export default function UploadSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params?.id as string;
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const pdfFiles = selectedFiles.filter((f) => f.type === 'application/pdf');
    if (selectedFiles.length !== pdfFiles.length) {
      toast.error('Only PDF files are allowed');
    }
    setFiles(pdfFiles);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const pdfFiles = droppedFiles.filter((f) => f.type === 'application/pdf');
    if (droppedFiles.length !== pdfFiles.length) {
      toast.error('Only PDF files are allowed');
    }
    setFiles((prev) => [...prev, ...pdfFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one PDF file');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev < 90) return prev + 10;
          clearInterval(progressInterval);
          return prev;
        });
      }, 300);

      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      await apiClient.post(
        `/submissions/upload/${assignmentId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      clearInterval(progressInterval);
      setUploadProgress(100);
      toast.success('Files uploaded successfully! Processing evaluations...');

      setTimeout(() => {
        router.push(`/assignments/${assignmentId}`);
      }, 1500);
    } catch (error) {
      console.error('Upload failed:', error);
      // Detailed error handled by global interceptor
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 mb-6"
        >
          ← Back
        </button>

        <div className="card">
          <h1 className="text-3xl font-bold mb-2">Upload Submissions</h1>
          <p className="text-gray-600 mb-8">
            Upload student assignment PDFs in bulk. Filenames should follow the format:
            <code className="bg-gray-100 px-2 py-1 rounded ml-1">StudentName_RollNumber.pdf</code>
          </p>

          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-blue-300 rounded-lg p-12 text-center cursor-pointer hover:bg-blue-50 transition"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFileSelect}
              hidden
            />
            <div className="text-5xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Drop PDFs here or click to select
            </h3>
            <p className="text-gray-600">Maximum 100 files, 10MB each</p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-bold mb-4">
                Selected Files ({files.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-4 rounded-lg"
                  >
                    <div className="flex items-center flex-1">
                      <span className="text-2xl mr-3">📑</span>
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-600">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="text-red-600 hover:text-red-800 font-bold"
                      disabled={loading}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {loading && (
            <div className="mt-8">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-center text-gray-600 mt-2">
                Uploading and evaluating submissions ({uploadProgress}%)
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={handleUpload}
              disabled={loading || files.length === 0}
              className="btn-primary flex-1"
            >
              {loading ? `Uploading (${uploadProgress}%)` : `Upload ${files.length} Files`}
            </button>
            <button
              onClick={() => router.back()}
              disabled={loading}
              className="btn-outline flex-1"
            >
              Cancel
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-sm text-gray-700">
              <strong>💡 Tip:</strong> PDFs will be automatically evaluated using AI.
              You can track progress from the assignment page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}