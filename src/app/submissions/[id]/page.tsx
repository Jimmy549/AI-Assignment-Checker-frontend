'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

interface Submission {
  id: string;
  studentName: string;
  studentRollNumber: string;
  fileName: string;
  uploadedAt: string;
  isEvaluated: boolean;
  fileContent: string;
  assignment: {
    id: string;
    title: string;
    totalMarks: number;
  };
  evaluation: {
    score: number;
    percentageScore: number;
    remarks: string;
    passed: boolean;
    detailedFeedback: {
      topicRelevance: string;
      structure: string;
      contentQuality: string;
      wordCount: number;
      recommendation: string;
    };
  };
}

export default function SubmissionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params?.id as string;
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'content' | 'feedback'>('feedback');
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const response = await apiClient.get(`/submissions/${submissionId}`);
        setSubmission(response.data);
        
        // If not evaluated, start polling
        if (!response.data.isEvaluated && !isPolling) {
          setIsPolling(true);
        }
      } catch (error) {
        console.error('Failed to fetch submission:', error);
      } finally {
        setLoading(false);
      }
    };

    if (submissionId) {
      fetchSubmission();
    }
  }, [submissionId]);

  // Polling: Check for evaluation completion every 3 seconds
  useEffect(() => {
    if (!isPolling || !submissionId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await apiClient.get(`/submissions/${submissionId}`);
        setSubmission(response.data);

        // Stop polling once evaluation is complete
        if (response.data.isEvaluated) {
          setIsPolling(false);
          console.log('✅ Evaluation completed!');
        }
      } catch (error) {
        console.error('Failed to poll submission status:', error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [isPolling, submissionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
          <p className="text-gray-600">Loading submission...</p>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="card text-center">
          <p className="text-gray-600 mb-4">Submission not found</p>
          <button onClick={() => router.back()} className="btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 mb-6"
        >
          ← Back
        </button>

        <div className="card mb-6 hover:shadow-2xl transition-all duration-300">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {submission.studentName}
              </h1>
              <p className="text-gray-600 mt-1">Roll #: {submission.studentRollNumber}</p>
              <p className="text-gray-600">
                Assignment: {submission.assignment.title}
              </p>
            </div>
            {submission.isEvaluated && (
              <div className="text-right">
                <div className={`text-4xl font-bold ${getScoreColor(submission.evaluation.percentageScore)}`}>
                  {submission.evaluation.score.toFixed(1)}/{submission.assignment.totalMarks}
                </div>
                <p className="text-gray-600">
                  {submission.evaluation.percentageScore.toFixed(1)}%
                </p>
                <div className="mt-2">
                  {submission.evaluation.passed ? (
                    <span className="px-4 py-1 bg-green-100 text-green-800 rounded-full font-semibold">
                      ✓ PASS
                    </span>
                  ) : (
                    <span className="px-4 py-1 bg-red-100 text-red-800 rounded-full font-semibold">
                      ✗ FAIL
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {!submission.isEvaluated && (
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <div className="flex items-center gap-3">
                <div className="inline-block animate-spin">
                  <div className="h-5 w-5 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
                </div>
                <div>
                  <p className="text-yellow-800 font-medium">
                    ⏳ Evaluating submission...
                  </p>
                  <p className="text-yellow-700 text-sm">
                    Checking for results every 3 seconds
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {submission.isEvaluated && (
          <>
            {/* Tabs */}
            <div className="card">
              <div className="flex border-b border-gray-200 mb-6">
                <button
                  onClick={() => setActiveTab('feedback')}
                  className={`px-6 py-3 font-medium border-b-2 transition-all duration-300 ${
                    activeTab === 'feedback'
                      ? 'border-blue-600 text-blue-600 scale-105'
                      : 'border-transparent text-gray-600 hover:text-blue-500 hover:border-blue-300'
                  }`}
                >
                  AI Feedback
                </button>
                <button
                  onClick={() => setActiveTab('content')}
                  className={`px-6 py-3 font-medium border-b-2 transition-all duration-300 ${
                    activeTab === 'content'
                      ? 'border-blue-600 text-blue-600 scale-105'
                      : 'border-transparent text-gray-600 hover:text-blue-500 hover:border-blue-300'
                  }`}
                >
                  Submission Content
                </button>
              </div>

              {/* Feedback Tab */}
              {activeTab === 'feedback' && (
                <div className="space-y-6">
                  {/* Overall Remarks */}
                  <div>
                    <h3 className="text-lg font-bold mb-2">Overall Remarks</h3>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                      {submission.evaluation.remarks}
                    </p>
                  </div>

                  {/* Detailed Feedback */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:bg-blue-100">
                      <h4 className="font-semibold text-blue-900 mb-2">
                        📍 Topic Relevance
                      </h4>
                      <p className="text-blue-700">
                        {submission.evaluation.detailedFeedback.topicRelevance}
                      </p>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:bg-green-100">
                      <h4 className="font-semibold text-green-900 mb-2">
                        📋 Structure
                      </h4>
                      <p className="text-green-700">
                        {submission.evaluation.detailedFeedback.structure}
                      </p>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:bg-purple-100">
                      <h4 className="font-semibold text-purple-900 mb-2">
                        ⭐ Content Quality
                      </h4>
                      <p className="text-purple-700">
                        {submission.evaluation.detailedFeedback.contentQuality}
                      </p>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:bg-orange-100">
                      <h4 className="font-semibold text-orange-900 mb-2">
                        📊 Word Count
                      </h4>
                      <p className="text-orange-700">
                        {submission.evaluation.detailedFeedback.wordCount} words
                      </p>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div>
                    <h3 className="text-lg font-bold mb-2">Recommendation</h3>
                    <div className={`p-4 rounded-lg font-semibold ${
                      submission.evaluation.detailedFeedback.recommendation === 'PASS'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {submission.evaluation.detailedFeedback.recommendation}
                    </div>
                  </div>
                </div>
              )}

              {/* Content Tab */}
              {activeTab === 'content' && (
                <div>
                  <h3 className="text-lg font-bold mb-4">Submission Content</h3>
                  <div className="bg-gray-50 p-6 rounded-lg max-h-[600px] overflow-y-auto">
                    <p className="text-gray-700 whitespace-pre-wrap font-mono text-sm">
                      {submission.fileContent}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}