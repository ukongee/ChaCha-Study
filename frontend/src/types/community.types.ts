export interface Post {
  id: number;
  title: string;
  content: string;
  courseName: string;
  department: string;
  author: string;
  anonymous: boolean;
  likeCount: number;
  viewCount: number;
  createdAt: string;
}

export interface PostCreateRequest {
  title: string;
  content: string;
  courseName: string;
  department: string;
  anonymous: boolean;
}

export interface CourseReview {
  id: number;
  courseName: string;
  professorName: string;
  department: string;
  rating: number;
  examType: string;
  difficulty: string;
  tip: string | null;
  examInfo: string | null;
  author: string;
  createdAt: string;
}

export interface ReviewCreateRequest {
  courseName: string;
  professorName: string;
  department: string;
  rating: number;
  examType: string;
  difficulty: string;
  tip?: string;
  examInfo?: string;
}
