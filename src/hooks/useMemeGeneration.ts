import { useState } from 'react';
import { apiService } from '../services/api';
import type { PromptRequest, PromptResponse, TaskStatus } from '../types/api';

interface GenerationState {
  loading: boolean;
  error: string | null;
  result: PromptResponse | null;
  taskId: string | null;
  taskStatus: TaskStatus | null;
}

export const useMemeGeneration = () => {
  const [state, setState] = useState<GenerationState>({
    loading: false,
    error: null,
    result: null,
    taskId: null,
    taskStatus: null,
  });

  const generateSync = async (request: PromptRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null, result: null }));
    
    try {
      const response = await apiService.generatePrompt(request);
      setState(prev => ({ ...prev, loading: false, result: response }));
      return response;
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'detail' in error 
        ? (error as { detail: string }).detail 
        : 'Failed to generate prompt';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  const generateAsync = async (request: PromptRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null, taskId: null, taskStatus: null }));
    
    try {
      const response = await apiService.generatePromptAsync(request);
      setState(prev => ({ ...prev, loading: false, taskId: response.task_id }));
      
      // Start polling
      pollTaskStatus(response.task_id);
      return response.task_id;
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'detail' in error 
        ? (error as { detail: string }).detail 
        : 'Failed to start async generation';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  const pollTaskStatus = (taskId: string) => {
    apiService.pollTaskStatus(
      taskId,
      (status) => {
        setState(prev => ({ ...prev, taskStatus: status }));
      },
      (status) => {
        if (status.status === 'completed') {
          // Convert task result to PromptResponse
          const mockResponse: PromptResponse = {
            id: taskId,
            user_input: '', // Will be set from form
            generated_prompt: status.result || '',
            parameters: {
            shape: '',
            text_option: '',
            aspect_ratio: '',
            image_format: ''
          },
            created_at: status.created_at,
            status: 'completed',
          };
          setState(prev => ({ ...prev, result: mockResponse, taskId: null, taskStatus: null }));
        } else {
          setState(prev => ({
            ...prev,
            error: status.error || 'Generation failed',
            taskId: null,
            taskStatus: null,
          }));
        }
      },
      (error) => {
        setState(prev => ({
          ...prev,
          error: error.detail || 'Polling failed',
          taskId: null,
          taskStatus: null,
        }));
      }
    );
  };

  const reset = () => {
    setState({
      loading: false,
      error: null,
      result: null,
      taskId: null,
      taskStatus: null,
    });
  };

  return {
    ...state,
    generateSync,
    generateAsync,
    reset,
  };
};