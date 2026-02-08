export interface Video {
  id: string;
  title: string;
  url: string;
  date: string;
  jpg: string;
  pictures_dir: string;
  actors: Actor[];
  tags: Tag[];
  formats: VideoFormat[];
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface Actor {
  id: number;
  name: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface VideoFormat {
  id: number;
  name: string;
  file_path: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
