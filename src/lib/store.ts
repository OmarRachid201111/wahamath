import { create } from 'zustand'

export interface StudentUser {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  className: string
  program: { id: string; code: string; name: string; shortName: string; assetType: string }
  schoolName?: string | null
  role: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface TeacherUser {
  id: string
  firstName: string
  lastName: string
  email: string
  status: string
  role?: string
  createdAt: string
  updatedAt: string
}

export interface ChapterData {
  id: string
  number: number
  title: string
  semester: string
  exerciseCount: number
  completedCount: number
  exerciseProgress?: Record<string, { status: string; studentNote?: string | null }>
}

export interface ExerciseData {
  id: string
  number: number
  content: string
  chapterId: string
  pageStart?: number | null
  pageEnd?: number | null
  progress: { id: string; status: string; studentNote?: string | null } | null
}

export interface CommentData {
  id: string
  content: string
  createdAt: string
  student: { id: string; firstName: string; lastName: string; className: string; schoolName?: string | null }
  remarks: { id: string; content: string; createdAt: string }[]
  exercise?: { id: string; number: number; chapter: { id: string; number: number; title: string } } | null
}

export type CurrentView = 'auth' | 'student' | 'teacher'
export type StudentTab = 'chapters' | 'comments' | 'profile'
export type TeacherTab = 'pending' | 'students' | 'comments' | 'profile'

interface AppState {
  currentView: CurrentView
  user: StudentUser | TeacherUser | null
  selectedChapter: ChapterData | null
  selectedExercise: ExerciseData | null
  selectedStudent: StudentUser | null
  chapterExercises: ExerciseData[]
  studentTab: StudentTab
  teacherTab: TeacherTab
  // Global lightbox — rendered at the very top of the app, outside all Dialogs
  lightbox: { isOpen: boolean; imageUrl: string; label: string }
  login: (user: StudentUser | TeacherUser, view: CurrentView) => void
  logout: () => void
  setSelectedChapter: (chapter: ChapterData | null) => void
  setSelectedExercise: (exercise: ExerciseData | null) => void
  setSelectedStudent: (student: StudentUser | null) => void
  setChapterExercises: (exercises: ExerciseData[]) => void
  setStudentTab: (tab: StudentTab) => void
  setTeacherTab: (tab: TeacherTab) => void
  openLightbox: (imageUrl: string, label: string) => void
  closeLightbox: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'auth',
  user: null,
  selectedChapter: null,
  selectedExercise: null,
  selectedStudent: null,
  chapterExercises: [],
  studentTab: 'chapters',
  teacherTab: 'pending',
  lightbox: { isOpen: false, imageUrl: '', label: '' },
  login: (user, view) => set({ user, currentView: view }),
  logout: () => {
    void fetch('/api/auth/logout', { method: 'POST' })
    set({
      currentView: 'auth', user: null, selectedChapter: null, selectedExercise: null,
      selectedStudent: null, chapterExercises: [], studentTab: 'chapters', teacherTab: 'pending',
      lightbox: { isOpen: false, imageUrl: '', label: '' },
    })
  },
  setSelectedChapter: (chapter) => set({ selectedChapter: chapter }),
  setSelectedExercise: (exercise) => set({ selectedExercise: exercise }),
  setSelectedStudent: (student) => set({ selectedStudent: student }),
  setChapterExercises: (exercises) => set({ chapterExercises: exercises }),
  setStudentTab: (tab) => set({ studentTab: tab }),
  setTeacherTab: (tab) => set({ teacherTab: tab }),
  openLightbox: (imageUrl, label) => set({ lightbox: { isOpen: true, imageUrl, label } }),
  closeLightbox: () => set({ lightbox: { isOpen: false, imageUrl: '', label: '' } }),
}))
