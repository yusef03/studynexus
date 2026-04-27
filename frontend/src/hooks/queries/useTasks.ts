"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Task, TaskCreate, TaskUpdate } from "@/types/task";

const TASKS_QUERY_KEY = ["userTasks"];
const EMPTY_TASKS: Task[] = [];

async function getTasks(): Promise<Task[]> {
  const res = await fetch("/api/mission/tasks");
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

async function createTask(payload: TaskCreate): Promise<Task> {
  const res = await fetch("/api/mission/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-studynexus-client": "true" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create task");
  return res.json();
}

async function updateTask({ id, payload }: { id: string; payload: TaskUpdate }): Promise<Task> {
  const res = await fetch(`/api/mission/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-studynexus-client": "true" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update task");
  return res.json();
}

async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`/api/mission/tasks/${id}`, {
    method: "DELETE",
    headers: { "x-studynexus-client": "true" },
  });
  if (!res.ok) throw new Error("Failed to delete task");
}

export function useTasks() {
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: TASKS_QUERY_KEY,
    queryFn: getTasks,
  });

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: updateTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });

  return {
    tasks: tasksQuery.data || EMPTY_TASKS,
    isLoading: tasksQuery.isPending,
    isError: tasksQuery.isError,
    createTask: createTaskMutation.mutate,
    createTaskAsync: createTaskMutation.mutateAsync,
    updateTask: updateTaskMutation.mutate,
    updateTaskAsync: updateTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutate,
    deleteTaskAsync: deleteTaskMutation.mutateAsync,
  };
}
