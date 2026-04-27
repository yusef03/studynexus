"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Event, EventCreate, EventUpdate } from "@/types/event";

export const EVENTS_QUERY_KEY = ["userEvents"];

async function getEvents(semester_tag?: string): Promise<Event[]> {
  const query = semester_tag ? `?semester_tag=${semester_tag}` : "";
  const res = await fetch(`/api/mission/events${query}`);
  if (!res.ok) throw new Error("Failed to fetch events");
  return res.json();
}

async function createEvent({ payload, force }: { payload: EventCreate; force?: boolean }): Promise<Event> {
  const query = force ? `?force=true` : "";
  const res = await fetch(`/api/mission/events${query}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-studynexus-client": "true" },
    body: JSON.stringify(payload),
  });
  
  const data = await res.json();
  if (!res.ok) {
     if (res.status === 409) {
         throw Object.assign(new Error("Collision detected"), { collisionData: data.detail });
     }
     throw new Error(data.detail || "Failed to create event");
  }
  return data;
}

async function updateEvent({ id, payload }: { id: string; payload: EventUpdate }): Promise<Event> {
  const res = await fetch(`/api/mission/events/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-studynexus-client": "true" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update event");
  return res.json();
}

async function deleteEvent(id: string): Promise<void> {
  const res = await fetch(`/api/mission/events/${id}`, {
    method: "DELETE",
    headers: { "x-studynexus-client": "true" },
  });
  if (!res.ok) throw new Error("Failed to delete event");
}

export function useEvents(semesterTag: string = "WiSe2425") {
  const queryClient = useQueryClient();

  const eventsQuery = useQuery({
    queryKey: [...EVENTS_QUERY_KEY, semesterTag],
    queryFn: () => getEvents(semesterTag),
  });

  const createEventMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: updateEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
    },
  });

  return {
    events: eventsQuery.data || [],
    isLoading: eventsQuery.isPending,
    isError: eventsQuery.isError,
    createEvent: createEventMutation.mutate,
    createEventAsync: createEventMutation.mutateAsync,
    updateEvent: updateEventMutation.mutate,
    updateEventAsync: updateEventMutation.mutateAsync,
    deleteEvent: deleteEventMutation.mutate,
    deleteEventAsync: deleteEventMutation.mutateAsync,
  };
}
