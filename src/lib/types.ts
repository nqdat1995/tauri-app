export type ProjectSource = {
  mode: "linked" | "blob" | string;
  path: string;
  size: number;
  modified_at: string | null;
  fingerprint: string | null;
};

export type ProjectMedia = {
  duration: number | null;
  width: number | null;
  height: number | null;
  fps: number | null;
  codec: string | null;
  audio_codec: string | null;
  thumbnail_path?: string;
};

export type ProjectAssets = {
  subtitle_json: string;
};

export type ProjectRecord = {
  schema_version: number;
  id: string;
  project_type: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
  source: ProjectSource;
  media: ProjectMedia;
  assets?: ProjectAssets;
  processing: Record<string, unknown>;
};

export type JobStatus =
  | "queued"
  | "running"
  | "calling_whisper"
  | "parsing_subtitle"
  | "creating_project"
  | "extracting_thumbnail"
  | "saving_files"
  | "completed"
  | "cancelled"
  | "failed";

export type JobEvent = {
  job_id: string;
  status: JobStatus;
  message?: string;
  progress?: number;
  updated_at: string;
};

export type QueueJobRequest = {
  job_id: string;
  video_path: string;
  video_name: string;
  language: string;
  size: number;
  duration: number | null;
  width: number | null;
  height: number | null;
};
