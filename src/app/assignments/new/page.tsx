'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { apiClient } from '@/lib/api-client';
import { useAssignmentStore } from '@/lib/store';

type AssignmentForm = {
  title: string;
  instructions: string;
  minWords: number;
  markingMode: 'strict' | 'loose';
  totalMarks: number;
  passPercentage: number;
};

export default function NewAssignmentPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<AssignmentForm>({
    defaultValues: {
      minWords: 500,
      markingMode: 'strict',
      totalMarks: 100,
      passPercentage: 60,
    },
  });
  const [loading, setLoading] = useState(false);
  const { addAssignment } = useAssignmentStore();

  const onSubmit = async (data: AssignmentForm) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/assignments', {
        ...data,
        passPercentage: data.passPercentage / 100,
      });
      addAssignment(response.data);
      router.push(`/assignments/${response.data.id}`);
    } catch (error) {
      console.error('Failed to create assignment:', error);
      alert('Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="card">
          <h1 className="text-3xl font-bold mb-8">Create New Assignment</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <div>
              <label className="form-label">Assignment Title *</label>
              <input
                {...register('title', { required: 'Title is required' })}
                className="form-input"
                placeholder="e.g., Essay on Mental Health"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* Instructions */}
            <div>
              <label className="form-label">Instructions *</label>
              <textarea
                {...register('instructions', { required: 'Instructions are required' })}
                className="form-input min-h-[120px]"
                placeholder="Describe the assignment in detail..."
              />
              {errors.instructions && (
                <p className="text-red-500 text-sm mt-1">{errors.instructions.message}</p>
              )}
            </div>

            {/* Min Words */}
            <div>
              <label className="form-label">Minimum Word Count</label>
              <input
                type="number"
                {...register('minWords')}
                className="form-input"
                min="100"
              />
            </div>

            {/* Marking Mode */}
            <div>
              <label className="form-label">Marking Mode *</label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    {...register('markingMode')}
                    value="strict"
                    className="mr-3"
                  />
                  <span className="text-gray-700">
                    <strong>Strict Mode</strong> - Penalizes off-topic and incomplete answers
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    {...register('markingMode')}
                    value="loose"
                    className="mr-3"
                  />
                  <span className="text-gray-700">
                    <strong>Loose Mode</strong> - More flexible, rewards effort
                  </span>
                </label>
              </div>
            </div>

            {/* Total Marks */}
            <div>
              <label className="form-label">Total Marks</label>
              <input
                type="number"
                {...register('totalMarks')}
                className="form-input"
                min="10"
              />
            </div>

            {/* Pass Percentage */}
            <div>
              <label className="form-label">Pass Percentage (%)</label>
              <input
                type="number"
                {...register('passPercentage')}
                className="form-input"
                min="0"
                max="100"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? 'Creating...' : 'Create Assignment'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}