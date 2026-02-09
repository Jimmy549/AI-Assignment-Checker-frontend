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
  deadline?: string;
  gradingCriteria?: {
    topicRelevance: { weight: number; enabled: boolean };
    structure: { weight: number; enabled: boolean };
    contentQuality: { weight: number; enabled: boolean };
    grammar: { weight: number; enabled: boolean };
    length: { weight: number; enabled: boolean };
  };
};

export default function NewAssignmentPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<AssignmentForm>({
    defaultValues: {
      minWords: 500,
      markingMode: 'strict',
      totalMarks: 100,
      passPercentage: 60,
      gradingCriteria: {
        topicRelevance: { weight: 30, enabled: true },
        structure: { weight: 20, enabled: true },
        contentQuality: { weight: 30, enabled: true },
        grammar: { weight: 10, enabled: true },
        length: { weight: 10, enabled: true },
      },
    },
  });
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { addAssignment } = useAssignmentStore();
  const gradingCriteria = watch('gradingCriteria');

  const onSubmit = async (data: AssignmentForm) => {
    setLoading(true);
    try {
      const payload: any = {
        title: data.title,
        instructions: data.instructions,
        minWords: Number(data.minWords),
        markingMode: data.markingMode,
        totalMarks: Number(data.totalMarks),
        passPercentage: Number(data.passPercentage) / 100,
      };
      
      // Only add optional fields if they have values
      if (data.deadline && data.deadline.trim()) {
        payload.deadline = data.deadline;
      }
      
      console.log('Sending payload:', JSON.stringify(payload, null, 2));
      const response = await apiClient.post('/assignments', payload);
      addAssignment(response.data);
      router.push(`/assignments/${response.data.id}`);
    } catch (error: any) {
      console.error('Full error:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.response?.data?.message);
      console.error('Error details:', JSON.stringify(error.response?.data, null, 2));
      
      const errorMsg = error.response?.data?.message || 
                       (Array.isArray(error.response?.data?.message) ? error.response?.data?.message.join(', ') : '') ||
                       error.message;
      alert(`Failed to create assignment: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="card hover:shadow-2xl transition-all duration-300">
          <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Create New Assignment
          </h1>

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
                <label className="flex items-center p-3 rounded-lg border-2 border-gray-200 cursor-pointer transition-all duration-300 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md">
                  <input
                    type="radio"
                    {...register('markingMode')}
                    value="strict"
                    className="mr-3 cursor-pointer"
                  />
                  <span className="text-gray-700">
                    <strong>Strict Mode</strong> - Penalizes off-topic and incomplete answers
                  </span>
                </label>
                <label className="flex items-center p-3 rounded-lg border-2 border-gray-200 cursor-pointer transition-all duration-300 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md">
                  <input
                    type="radio"
                    {...register('markingMode')}
                    value="loose"
                    className="mr-3 cursor-pointer"
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

            {/* Deadline */}
            <div>
              <label className="form-label">Deadline (Optional)</label>
              <input
                type="datetime-local"
                {...register('deadline')}
                className="form-input"
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
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-4"
              >
                {showAdvanced ? '− Hide' : '+ Show'} Advanced Grading Criteria
              </button>

              {showAdvanced && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-all duration-300">
                  <p className="text-sm text-gray-600 mb-3">Customize evaluation weights (total should be 100%)</p>
                  {['topicRelevance', 'structure', 'contentQuality', 'grammar', 'length'].map((criterion) => (
                    <div key={criterion} className="flex items-center gap-4 p-2 rounded hover:bg-white transition-all duration-300">
                      <input
                        type="checkbox"
                        checked={gradingCriteria?.[criterion as keyof typeof gradingCriteria]?.enabled}
                        onChange={(e) => {
                          setValue(`gradingCriteria.${criterion}.enabled` as any, e.target.checked);
                        }}
                        className="cursor-pointer w-4 h-4 transition-transform hover:scale-125"
                      />
                      <label className="flex-1 text-sm font-medium capitalize">
                        {criterion.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <input
                        type="number"
                        {...register(`gradingCriteria.${criterion}.weight` as any)}
                        className="form-input w-20 text-sm"
                        min="0"
                        max="100"
                        disabled={!gradingCriteria?.[criterion as keyof typeof gradingCriteria]?.enabled}
                      />
                      <span className="text-sm text-gray-600">%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 hover:scale-105 hover:shadow-xl transition-all duration-300"
              >
                {loading ? 'Creating...' : 'Create Assignment'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-outline flex-1 hover:scale-105 hover:shadow-lg transition-all duration-300"
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