'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useAssignmentStore, useAuthStore } from '@/lib/store';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const { assignments, setAssignments } = useAssignmentStore();
  const { user, token, logout } = useAuthStore();

  // Wait for Zustand to hydrate from localStorage
  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    // Don't check auth until store is hydrated
    if (!hydrated) return;

    // Check if user is authenticated
    if (!token) {
      router.replace('/login');
      return;
    }

    const fetchAssignments = async () => {
      try {
        const response = await apiClient.get('/assignments');
        setAssignments(response.data);
      } catch (error) {
        console.error('Failed to fetch assignments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [hydrated, token, router, setAssignments]);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  // Show loading while hydrating
  if (!hydrated || !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (assignment: any) => {
    if (assignment.isProcessing) {
      return (
        <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
          Processing...
        </span>
      );
    }
    const evaluated = assignment.submissions?.filter((s: any) => s.isEvaluated)
      .length || 0;
    const total = assignment.submissions?.length || 0;
    return (
      <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
        {evaluated}/{total} Evaluated
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Assignment Checker
            </h1>
            <p className="text-gray-600 mt-2">
              Welcome, {user?.name || 'Teacher'}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/assignments/new">
              <button className="btn-primary">+ New Assignment</button>
            </Link>
            <button onClick={handleLogout} className="btn-outline">
              Logout
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="text-gray-600 text-sm font-medium">
              Total Assignments
            </div>
            <div className="text-3xl font-bold text-blue-600 mt-2">
              {assignments.length}
            </div>
          </div>
          <div className="card">
            <div className="text-gray-600 text-sm font-medium">
              Total Submissions
            </div>
            <div className="text-3xl font-bold text-green-600 mt-2">
              {assignments.reduce(
                (acc, a) => acc + (a.submissions?.length || 0),
                0,
              )}
            </div>
          </div>
          <div className="card">
            <div className="text-gray-600 text-sm font-medium">Evaluated</div>
            <div className="text-3xl font-bold text-purple-600 mt-2">
              {assignments.reduce(
                (acc, a) =>
                  acc + (a.submissions?.filter((s: any) => s.isEvaluated).length || 0),
                0,
              )}
            </div>
          </div>
        </div>

        {/* Assignments List */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Your Assignments</h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin">
                <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
              <p className="text-gray-600 mt-4">Loading assignments...</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No assignments yet.</p>
              <Link href="/assignments/new">
                <button className="btn-primary mt-4">Create One Now</button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Marking Mode
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => (
                    <tr
                      key={assignment.id}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {assignment.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium">
                          {assignment.markingMode.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(assignment)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {format(new Date(assignment.createdAt), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link href={`/assignments/${assignment.id}`}>
                            <button className="btn-outline text-xs">
                              View
                            </button>
                          </Link>
                          <Link href={`/submissions/upload/${assignment.id}`}>
                            <button className="btn-primary text-xs">
                              Upload
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
