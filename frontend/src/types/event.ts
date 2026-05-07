export type EventType = "LECTURE" | "EXERCISE" | "TUTORIAL" | "SEMINAR" | "PRACTICUM" | "EXAM" | "CUSTOM_STUDY" | "WORK" | "LIFE" | "FOCUS";

export interface Event {
  id: string;
  user_id: string;
  module_id: string | null;
  title: string;
  event_type: EventType;
  semester_tag: string | null;
  is_recurring: boolean;
  day_of_week: number | null; // 0 = Monday, 6 = Sunday
  event_date: string | null; // YYYY-MM-DD
  start_time: string | null; // HH:MM:SS
  end_time: string | null; // HH:MM:SS
  location: string | null;
  lecturer: string | null;
  is_hidden: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface EventCreate {
  title: string;
  event_type?: EventType;
  semester_tag?: string | null;
  is_recurring?: boolean;
  day_of_week?: number | null;
  event_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  lecturer?: string | null;
  is_hidden?: boolean;
  module_id?: string | null;
}

export interface EventUpdate extends Partial<EventCreate> {}
