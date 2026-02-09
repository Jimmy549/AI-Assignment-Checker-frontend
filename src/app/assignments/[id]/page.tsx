'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useForm } from 'react-hook-form';

interface Submission {
  id: string;
  studentName: string;
  studentRollNumber: string;
  uploadedAt: string;
  isEvaluated: boolean;
  evaluation?: {
    id: string; // Ensure we have the evaluation ID
    score: number;
    percentageScore: number;
    remarks: string;
    passed: boolean;
    detailedFeedback: {
      topicRelevance: string;
      structure: string;
      contentQuality: string;
      wordCount: number;
    };
  };
}

interface Assignment {
  id: string;
  title: string;
  instructions: string;
  minWords: number;
  markingMode: string;
  totalMarks: number;
  passPercentage: number;
  isProcessing: boolean;
  createdAt?: string;
  status?: string;
  deadline?: string;
  submissions: Submission[];
}

interface EditGradeForm {
  score: number;
  remarks: string;
}

export default function AssignmentDetailsPage() {
  const params = useParams();
  const assignmentId = params?.id as string;
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [deletingAssignment, setDeletingAssignment] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [reEvaluating, setReEvaluating] = useState<string | null>(null);
  const [bulkReEvaluating, setBulkReEvaluating] = useState(false);
  
  // Edit Modal State
  const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);
  const { register, handleSubmit, reset, setValue } = useForm<EditGradeForm>();
  const [saving, setSaving] = useState(false);

  const fetchAssignment = async () => {
    try {
      const response = await apiClient.get(`/assignments/${assignmentId}`);
      setAssignment(response.data);

      // Prepare chart data
      const grades = ['A', 'B', 'C', 'D', 'F'];
      const gradeCounts = {
        A: 0, // 90-100
        B: 0, // 80-89
        C: 0, // 70-79
        D: 0, // 60-69
        F: 0, // Below 60
      };

      response.data.submissions?.forEach((sub: Submission) => {
        if (sub.evaluation?.percentageScore !== undefined) {
          const score = sub.evaluation.percentageScore;
          if (score >= 90) gradeCounts['A']++;
          else if (score >= 80) gradeCounts['B']++;
          else if (score >= 70) gradeCounts['C']++;
          else if (score >= 60) gradeCounts['D']++;
          else gradeCounts['F']++;
        }
      });

      setChartData(
        grades.map((grade) => ({
          grade,
          count: gradeCounts[grade as keyof typeof gradeCounts],
        })),
      );
    } catch (error) {
      console.error('Failed to fetch assignment:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assignmentId) {
      fetchAssignment();
    }
  }, [assignmentId]);

  const handleExport = async () => {
    try {
      const response = await apiClient.get(`/export/marks-sheet/${assignmentId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `marks-sheet-${assignmentId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await apiClient.get(`/export/marks-sheet-excel/${assignmentId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `marks-sheet-${assignmentId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error('Excel export failed:', error);
    }
  };

  const handleDeleteAssignment = async () => {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) return;
    setDeletingAssignment(true);
    try {
      await apiClient.delete(`/assignments/${assignmentId}`);
      alert('Assignment deleted successfully');
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete assignment');
    } finally {
      setDeletingAssignment(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setChangingStatus(true);
    try {
      await apiClient.patch(`/assignments/${assignmentId}/status`, { status: newStatus });
      await fetchAssignment();
    } catch (error) {
      console.error('Status change failed:', error);
      alert('Failed to change status');
    } finally {
      setChangingStatus(false);
    }
  };

  const handleReEvaluate = async (submissionId: string) => {
    if (!confirm('Re-evaluate this submission?')) return;
    setReEvaluating(submissionId);
    try {
      await apiClient.post(`/evaluations/re-evaluate/${submissionId}`);
      await fetchAssignment();
      alert('Re-evaluation completed');
    } catch (error) {
      console.error('Re-evaluation failed:', error);
      alert('Failed to re-evaluate');
    } finally {
      setReEvaluating(null);
    }
  };

  const handleBulkReEvaluate = async () => {
    if (!confirm('Re-evaluate all submissions? This may take a while.')) return;
    setBulkReEvaluating(true);
    try {
      const response = await apiClient.post(`/assignments/${assignmentId}/re-evaluate-all`);
      alert(response.data.message);
      await fetchAssignment();
    } catch (error) {
      console.error('Bulk re-evaluation failed:', error);
      alert('Failed to re-evaluate');
    } finally {
      setBulkReEvaluating(false);
    }
  };

  const openEditModal = (submission: Submission) => {
    if (!submission.evaluation) return;
    setEditingSubmission(submission);
    setValue('score', submission.evaluation.score);
    setValue('remarks', submission.evaluation.remarks);
  };

  const closeEditModal = () => {
    setEditingSubmission(null);
    reset();
  };

  const onUpdateGrade = async (data: EditGradeForm) => {
    if (!editingSubmission?.evaluation?.id) return;

    setSaving(true);
    try {
      await apiClient.patch(`/evaluations/${editingSubmission.evaluation.id}`, {
        score: Number(data.score),
        remarks: data.remarks,
      });
      
      // Refresh data
      await fetchAssignment();
      closeEditModal();
    } catch (error) {
      console.error('Failed to update grade:', error);
      alert('Failed to update grade. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
          <p className="text-gray-600">Loading assignment details...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="card text-center">
          <p className="text-gray-600 mb-4">Assignment not found</p>
          <Link href="/dashboard">
            <button className="btn-primary">Back to Dashboard</button>
          </Link>
        </div>
      </div>
    );
  }

  const evaluatedCount = assignment.submissions?.filter(
    (s) => s.isEvaluated,
  ).length || 0;
  const totalSubmissions = assignment.submissions?.length || 0;
  const passedCount = assignment.submissions?.filter(
    (s) => s.evaluation?.passed,
  ).length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 relative">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold text-gray-900">{assignment.title}</h1>
            <p className="text-gray-600 mt-2">
              Created on{' '}
              {format(new Date(assignment.createdAt || Date.now()), 'MMM dd, yyyy')}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/submissions/upload/${assignmentId}`}>
              <button className="btn-primary hover:scale-105 hover:shadow-xl transition-all duration-300">+ Upload Submissions</button>
            </Link>
            <button onClick={handleExport} className="btn-secondary hover:scale-105 hover:shadow-xl transition-all duration-300" disabled={evaluatedCount === 0}>
              📥 CSV
            </button>
            <button onClick={handleExportExcel} className="btn-secondary hover:scale-105 hover:shadow-xl transition-all duration-300" disabled={evaluatedCount === 0}>
              📊 Excel
            </button>
            <button onClick={handleBulkReEvaluate} className="btn-secondary hover:scale-105 hover:shadow-xl transition-all duration-300" disabled={bulkReEvaluating || totalSubmissions === 0}>
              {bulkReEvaluating ? '⏳ Re-evaluating...' : '🔄 Re-evaluate All'}
            </button>
            <button onClick={handleDeleteAssignment} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-red-500/30" disabled={deletingAssignment}>
              {deletingAssignment ? 'Deleting...' : '🗑️ Delete'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card hover:shadow-2xl hover:-translate-y-2 hover:border-2 hover:border-blue-200 transition-all duration-300">
            <p className="text-gray-600 text-sm">Total Submissions</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{totalSubmissions}</p>
          </div>
          <div className="card hover:shadow-2xl hover:-translate-y-2 hover:border-2 hover:border-green-200 transition-all duration-300">
            <p className="text-gray-600 text-sm">Evaluated</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{evaluatedCount}</p>
          </div>
          <div className="card hover:shadow-2xl hover:-translate-y-2 hover:border-2 hover:border-purple-200 transition-all duration-300">
            <p className="text-gray-600 text-sm">Passed</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{passedCount}</p>
          </div>
          <div className="card hover:shadow-2xl hover:-translate-y-2 hover:border-2 hover:border-orange-200 transition-all duration-300">
            <p className="text-gray-600 text-sm">Pass Rate</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {evaluatedCount > 0 ? Math.round((passedCount / evaluatedCount) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Processing Status */}
        {assignment.isProcessing && (
          <div className="card bg-yellow-50 border-2 border-yellow-200 mb-8">
            <p className="text-yellow-800 font-medium">
              ⏳ Submissions are being evaluated. Please refresh to see updates.
            </p>
          </div>
        )}

        {/* Charts and Instructions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 card">
            <h2 className="text-xl font-bold mb-4">Grade Distribution</h2>
            {chartData.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="grade" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" name="Number of Students" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-600 text-center py-8">
                No graded submissions yet
              </p>
            )}
          </div>

          <div className="card">
            <h2 className="text-xl font-bold mb-4">Settings</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Status</p>
                <select
                  value={assignment.status || 'draft'}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={changingStatus}
                  className="mt-1 form-input text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <p className="text-gray-600">Marking Mode</p>
                <p className="font-semibold text-gray-900 capitalize">
                  {assignment.markingMode}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Total Marks</p>
                <p className="font-semibold text-gray-900">{assignment.totalMarks}</p>
              </div>
              <div>
                <p className="text-gray-600">Pass Percentage</p>
                <p className="font-semibold text-gray-900">
                  {Math.round(assignment.passPercentage * 100)}%
                </p>
              </div>
              <div>
                <p className="text-gray-600">Min Words</p>
                <p className="font-semibold text-gray-900">{assignment.minWords}</p>
              </div>
              {assignment.deadline && (
                <div>
                  <p className="text-gray-600">Deadline</p>
                  <p className="font-semibold text-gray-900">
                    {format(new Date(assignment.deadline), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold mb-4">Instructions</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{assignment.instructions}</p>
        </div>

        {/* Submissions Table */}
        <div className="card">
          <h2 className="text-xl font-bold mb-6">Submissions</h2>

          {totalSubmissions === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No submissions yet.</p>
              <Link href={`/submissions/upload/${assignmentId}`}>
                <button className="btn-primary mt-4">Upload Submissions</button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Roll #</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Score</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Result</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignment.submissions?.map((submission) => (
                    <tr
                      key={submission.id}
                      className="border-b border-gray-200 transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-lg hover:scale-[1.01]"
                    >
                      <td className="px-6 py-4 font-medium">{submission.studentName}</td>
                      <td className="px-6 py-4 text-gray-600">{submission.studentRollNumber}</td>
                      <td className="px-6 py-4">
                        {submission.isEvaluated ? (
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            ✓ Evaluated
                          </span>
                        ) : submission.submissionStatus === 'unreadable' ? (
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            ⚠️ Unreadable
                          </span>
                        ) : submission.submissionStatus === 'evaluation_error' ? (
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                            ❌ Error
                          </span>
                        ) : (
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {submission.evaluation ? (
                          <div>
                            <p className="font-semibold">
                              {submission.evaluation.score.toFixed(1)}/
                              {assignment.totalMarks}
                            </p>
                            <p className="text-xs text-gray-600">
                              {submission.evaluation.percentageScore.toFixed(1)}%
                            </p>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {submission.evaluation?.passed ? (
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            PASS
                          </span>
                        ) : submission.evaluation ? (
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            FAIL
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <Link href={`/submissions/${submission.id}`}>
                          <button className="btn-outline text-xs hover:scale-110 hover:shadow-md transition-all duration-300">View Details</button>
                        </Link>
                        {submission.evaluation && (
                          <>
                            <button 
                              className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded text-xs font-medium transition-all duration-300 hover:scale-110 hover:shadow-md"
                              onClick={() => openEditModal(submission)}
                            >
                              Edit Grade
                            </button>
                            <button
                              className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1 rounded text-xs font-medium transition-all duration-300 hover:scale-110 hover:shadow-md"
                              onClick={() => handleReEvaluate(submission.id)}
                              disabled={reEvaluating === submission.id}
                            >
                              {reEvaluating === submission.id ? '⏳' : '🔄'}
                            </button>
                          </>
                        )}
                        {(submission.submissionStatus === 'unreadable' || submission.submissionStatus === 'evaluation_error') && (
                          <button
                            className="bg-orange-100 text-orange-700 hover:bg-orange-200 px-3 py-1 rounded text-xs font-medium transition-all duration-300 hover:scale-110 hover:shadow-md"
                            onClick={() => handleReEvaluate(submission.id)}
                            disabled={reEvaluating === submission.id}
                          >
                            {reEvaluating === submission.id ? 'Retrying...' : 'Retry'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-bold mb-4">Edit Grade</h3>
            <p className="text-gray-600 mb-4">
              Student: <span className="font-medium text-gray-900">{editingSubmission.studentName}</span>
            </p>
            
            <form onSubmit={handleSubmit(onUpdateGrade)} className="space-y-4">
              <div>
                <label className="form-label">Score (Out of {assignment.totalMarks})</label>
                <input
                  type="number"
                  {...register('score', { 
                    required: true, 
                    min: 0, 
                    max: assignment.totalMarks 
                  })}
                  className="form-input"
                  step="0.5"
                />
              </div>

              <div>
                <label className="form-label">Remarks</label>
                <textarea
                  {...register('remarks', { required: true })}
                  className="form-input min-h-[100px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="btn-outline"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}