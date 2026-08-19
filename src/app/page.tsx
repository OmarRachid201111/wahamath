'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useTheme } from 'next-themes'
import {
  BookOpen, LogOut, GraduationCap, ChevronLeft, ChevronRight, CheckCircle,
  Clock, Circle, AlertTriangle, ImageIcon, X, Loader2, Send,
  Trash2, MessageSquare, Plus, Minus, RotateCcw, ZoomIn, ZoomOut,
  Eye, XCircle, User, Mail, Phone, School, Calendar, Sun, Moon
} from 'lucide-react'
import { useAppStore, StudentUser, TeacherUser, ChapterData, ExerciseData, CommentData } from '@/lib/store'
import { PROGRAMS, ProgramCode } from '@/lib/programs'

// ===== Helper =====
const PROGRAM_ASSET_BASE_URL = 'https://qb2iij98kkeg6uie.public.blob.vercel-storage.com'

function pageImageUrl(pageNum: number, programCode = 'sm2', chapterNumber?: number, exerciseNumber?: number): string {
  if (programCode === 'pc2' && chapterNumber && exerciseNumber) {
    return `${PROGRAM_ASSET_BASE_URL}/programs/pc2/exercise-images/exercise-${chapterNumber}-${exerciseNumber}.png`
  }
  const basePath = programCode === 'sm2'
    ? '/exercises-pages'
    : `${PROGRAM_ASSET_BASE_URL}/programs/${programCode}/exercises-pages`
  const digits = programCode === 'tcs' ? 2 : 3
  return `${basePath}/page-${String(pageNum).padStart(digits, '0')}.png`
}

// ===== Status Badge =====
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    not_started: { label: 'Non commencé', className: 'bg-muted text-muted-foreground' },
    in_progress: { label: 'En cours', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
    completed: { label: 'Terminé', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
    difficulty: { label: 'Difficulté', className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' },
  }
  const c = config[status] || config.not_started
  return <Badge variant="secondary" className={c.className}>{c.label}</Badge>
}

// ===== Image Lightbox (Portal) =====
function ImageLightbox({
  isOpen, imageUrl, label, onClose
}: {
  isOpen: boolean
  imageUrl: string
  label: string
  onClose: () => void
}) {
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastTouchDist = useRef<number | null>(null)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const posStartRef = useRef({ x: 0, y: 0 })

  const resetView = useCallback(() => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        e.preventDefault()
        onClose()
      }
      else if (e.key === '+' || e.key === '=') setZoom(z => Math.min(z + 0.25, 5))
      else if (e.key === '-') setZoom(z => Math.max(z - 0.25, 0.5))
      else if (e.key === '0') resetView()
    }
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [isOpen, onClose, resetView])

  // Global mousemove/mouseup for smooth drag even when cursor leaves container
  useEffect(() => {
    if (!isDragging) return
    const handleGlobalMove = (e: MouseEvent) => {
      setPosition({
        x: posStartRef.current.x + (e.clientX - dragStartRef.current.x),
        y: posStartRef.current.y + (e.clientY - dragStartRef.current.y),
      })
    }
    const handleGlobalUp = () => {
      setIsDragging(false)
    }
    window.addEventListener('mousemove', handleGlobalMove)
    window.addEventListener('mouseup', handleGlobalUp)
    return () => {
      window.removeEventListener('mousemove', handleGlobalMove)
      window.removeEventListener('mouseup', handleGlobalUp)
    }
  }, [isDragging])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    setZoom(z => {
      const next = e.deltaY < 0 ? Math.min(z + 0.15, 5) : Math.max(z - 0.15, 0.5)
      if (next <= 1) setPosition({ x: 0, y: 0 })
      return next
    })
  }, [])

  const handlePointerDown = (e: React.PointerEvent) => {
    if (zoom <= 1) return
    e.preventDefault()
    setIsDragging(true)
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    posStartRef.current = { x: position.x, y: position.y }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastTouchDist.current = Math.sqrt(dx * dx + dy * dy)
    } else if (e.touches.length === 1 && zoom > 1) {
      setIsDragging(true)
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      posStartRef.current = { x: position.x, y: position.y }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const scale = dist / lastTouchDist.current
      setZoom(z => {
        const next = Math.min(Math.max(z * scale, 0.5), 5)
        if (next <= 1) setPosition({ x: 0, y: 0 })
        return next
      })
      lastTouchDist.current = dist
    } else if (e.touches.length === 1 && isDragging) {
      setPosition({
        x: posStartRef.current.x + (e.touches[0].clientX - dragStartRef.current.x),
        y: posStartRef.current.y + (e.touches[0].clientY - dragStartRef.current.y),
      })
    }
  }

  const handleTouchEnd = () => {
    lastTouchDist.current = null
    setIsDragging(false)
  }


  // Close lightbox when clicking the dark overlay area (not the image or controls)
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    // Only close if clicking directly on the overlay, not on children
    if (e.target === e.currentTarget) {
      onClose()
    }
  }, [onClose])

  if (!isOpen) return null

  const lightboxContent = (
    <div
      className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center pointer-events-auto"
      onClick={handleOverlayClick}
    >
      {/* Close button */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose() }}
        className="absolute top-4 right-4 z-10 text-white/70 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
        aria-label="Fermer"
      >
        <X className="size-6" />
      </button>
      <div
        ref={containerRef}
        className="flex-1 w-full flex items-center justify-center overflow-hidden"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default', userSelect: 'none' }}
      >
        {!imageLoaded && (
          <Loader2 className="size-10 text-white animate-spin" />
        )}
        <img
          src={imageUrl}
          alt={label}
          className="max-w-[90vw] max-h-[80vh] object-contain select-none pointer-events-none"
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            transition: isDragging ? 'none' : 'transform 0.15s ease',
            display: imageLoaded ? 'block' : 'none',
          }}
          onLoad={() => setImageLoaded(true)}
          draggable={false}
        />
      </div>
      {/* Zoom control bar */}
      <div
        className="flex items-center gap-4 py-4 px-6 bg-black/70 rounded-t-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); setZoom(z => Math.max(z - 0.25, 0.5)) }}>
          <ZoomOut className="size-5" />
        </Button>
        <span className="text-white text-sm font-mono min-w-[50px] text-center">{Math.round(zoom * 100)}%</span>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); setZoom(z => Math.min(z + 0.25, 5)) }}>
          <ZoomIn className="size-5" />
        </Button>
        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); resetView() }}>
          <RotateCcw className="size-4 mr-1" /> Réinitialiser
        </Button>
        <span className="text-white/70 text-sm ml-2">{label}</span>
      </div>
    </div>
  )

  // Render via portal to document.body so it sits at the same DOM level as the
  // Radix Dialog portal and is guaranteed to be on top (z-9999 > dialog z-50).
  if (typeof document === 'undefined') return null
  return createPortal(lightboxContent, document.body)
}

// ===== Exercise Detail Dialog =====
function ExerciseDetailDialog({
  exercise,
  chapter,
  exercises,
  onClose,
}: {
  exercise: ExerciseData
  chapter: ChapterData
  exercises: ExerciseData[]
  onClose: () => void
}) {
  const { user, setSelectedExercise, openLightbox, lightbox } = useAppStore()
  const student = user as StudentUser
  const [status, setStatus] = useState(exercise.progress?.status || 'not_started')
  const [saving, setSaving] = useState(false)
  const [comments, setComments] = useState<CommentData[]>([])
  const [newComment, setNewComment] = useState('')
  const [sendingComment, setSendingComment] = useState(false)

  const currentIndex = exercises.findIndex(e => e.id === exercise.id)
  const totalExercises = exercises.length

  const [commentsLoaded, setCommentsLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (commentsLoaded) return
    const load = async () => {
      try {
        const res = await fetch('/api/comments')
        if (res.ok && !cancelled) {
          const data = await res.json()
          setComments((data.comments || []).filter((c: CommentData) => c.exercise?.id === exercise.id))
        }
      } catch { /* ignore */ }
      if (!cancelled) setCommentsLoaded(true)
    }
    load()
  }, [exercise.id, commentsLoaded])

  const refetchComments = async () => {
    try {
      const res = await fetch('/api/comments')
      if (res.ok) {
        const data = await res.json()
        setComments((data.comments || []).filter((c: CommentData) => c.exercise?.id === exercise.id))
      }
    } catch { /* ignore */ }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`/api/exercises/${exercise.id}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id, status }),
      })
      toast.success('Progression sauvegardée !')
    } catch {
      toast.error('Erreur lors de la sauvegarde.')
    }
    setSaving(false)
  }

  const handleSendComment = async () => {
    if (!newComment.trim()) return
    setSendingComment(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id, exerciseId: exercise.id, content: newComment }),
      })
      if (!res.ok) throw new Error('Comment non envoyé')
      const data = await res.json()
      setNewComment('')
      setComments((current) => [{ ...data.comment, remarks: [] }, ...current])
      toast.success('Comment envoyé.')
    } catch {
      toast.error("Erreur lors de l'envoi.")
    }
    setSendingComment(false)
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Supprimer ce commentaire et ses réponses ?')) return
    try {
      const res = await fetch(`/api/comments?id=${commentId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Erreur serveur.')
      setComments((current) => current.filter((comment) => comment.id !== commentId))
      toast.success('Commentaire supprimé.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible de supprimer le commentaire.')
    }
  }

  const goToExercise = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= totalExercises) return
    setSelectedExercise(exercises[newIndex])
  }

  // Build list of page images for this exercise
  const pageImages: { url: string; pageNum: number }[] = []
  if (exercise.pageStart) {
    const start = exercise.pageStart
    const end = student.program.code === 'pc2' ? start : (exercise.pageEnd || start)
    for (let p = start; p <= end; p++) {
      pageImages.push({ url: pageImageUrl(p, student.program.code, chapter.number, exercise.number), pageNum: p })
    }
  }

  return (
      <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => { if (lightbox.isOpen) e.preventDefault() }}
        >
          <DialogHeader>
            <DialogTitle className="text-lg">
              Ch.{chapter.number} : {chapter.title} — Ex.{exercise.number} ({exercise.number}/{totalExercises})
            </DialogTitle>
            <DialogDescription className="sr-only">
              Détail de l&apos;exercice {exercise.number} du chapitre {chapter.number}
            </DialogDescription>
          </DialogHeader>

          {pageImages.length > 0 && (
            <div className="space-y-3">
              {pageImages.map((img) => (
                <div key={img.pageNum} className="space-y-1.5">
                  <div
                    className="relative rounded-lg overflow-hidden border bg-background cursor-pointer"
                    onClick={() => openLightbox(img.url, `Page ${img.pageNum}`)}
                  >
                    <img
                      src={img.url}
                      alt={`Page ${img.pageNum} — Exercice ${exercise.number}`}
                      className="w-full h-auto object-contain"
                      loading="lazy"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => openLightbox(img.url, `Page ${img.pageNum}`)}
                  >
                    <Eye className="size-4 mr-1" /> Agrandir la page {img.pageNum}
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium">Statut</Label>
            <RadioGroup value={status} onValueChange={setStatus} className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 cursor-pointer rounded-lg border p-2 hover:bg-muted transition-colors has-[button[data-state=checked]]:border-muted-foreground">
                <RadioGroupItem value="not_started" />
                <Circle className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Non commencé</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer rounded-lg border p-2 hover:bg-muted transition-colors has-[button[data-state=checked]]:border-amber-500 dark:has-[button[data-state=checked]]:border-amber-400">
                <RadioGroupItem value="in_progress" />
                <Clock className="size-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm text-amber-700 dark:text-amber-400">En cours</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer rounded-lg border p-2 hover:bg-muted transition-colors has-[button[data-state=checked]]:border-emerald-500 dark:has-[button[data-state=checked]]:border-emerald-400">
                <RadioGroupItem value="completed" />
                <CheckCircle className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm text-emerald-700 dark:text-emerald-400">Terminé</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer rounded-lg border p-2 hover:bg-muted transition-colors has-[button[data-state=checked]]:border-red-500 dark:has-[button[data-state=checked]]:border-red-400">
                <RadioGroupItem value="difficulty" />
                <AlertTriangle className="size-4 text-red-600 dark:text-red-400" />
                <span className="text-sm text-red-700 dark:text-red-400">Difficulté</span>
              </label>
            </RadioGroup>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
              Sauvegarder
            </Button>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium text-sm">Commentaires</h4>
            {comments.map((comment) => (
              <div key={comment.id} className="space-y-2">
                <div className="flex items-start gap-2">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 text-xs">
                      {comment.student.firstName[0]}{comment.student.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {comment.student.firstName} {comment.student.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm mt-1">{comment.content}</p>
                      <Button type="button" variant="ghost" size="sm" className="shrink-0 text-destructive hover:text-destructive" onClick={(event) => { event.preventDefault(); event.stopPropagation(); void handleDeleteComment(comment.id) }}>
                        <Trash2 className="size-4" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </div>
                {comment.remarks.length > 0 && comment.remarks.map((remark) => (
                  <div key={remark.id} className="ml-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-3 border border-emerald-100 dark:border-emerald-800/50">
                    <p className="text-sm text-emerald-800 dark:text-emerald-300">{remark.content}</p>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 block">
                      {new Date(remark.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                ))}
              </div>
            ))}
            <div className="flex gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ajouter un commentaire..."
                rows={2}
              />
              <Button onClick={handleSendComment} disabled={sendingComment || !newComment.trim()} className="bg-emerald-600 hover:bg-emerald-700 self-end">
                {sendingComment ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Send className="size-4 mr-2" />}
                Envoyer le commentaire
              </Button>
            </div>
          </div>

          <DialogFooter className="flex-row justify-between">
            <Button
              variant="outline"
              onClick={() => goToExercise('prev')}
              disabled={currentIndex <= 0}
            >
              <ChevronLeft className="size-4 mr-1" /> Précédent
            </Button>
            <Button
              variant="outline"
              onClick={() => goToExercise('next')}
              disabled={currentIndex >= totalExercises - 1}
            >
              Suivant <ChevronRight className="size-4 ml-1" />
            </Button>
          </DialogFooter>

        </DialogContent>
      </Dialog>
  )
}

// ===== Auth View =====
function AuthView() {
  const { login } = useAppStore()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [showTeacherLogin, setShowTeacherLogin] = useState(false)
  const [loading, setLoading] = useState(false)

  // Login form
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form
  const [regFirstName, setRegFirstName] = useState('')
  const [regLastName, setRegLastName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regSchoolName, setRegSchoolName] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regProgramCode, setRegProgramCode] = useState<ProgramCode>('sm2')

  // Teacher login
  const [teacherPassword, setTeacherPassword] = useState('')

  // Form states are initialized to defaults to prevent autofill

  const handleLogin = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })
      if (res.ok) {
        const student = await res.json()
        toast.success(`Bienvenue ${student.firstName} !`)
        login(student, 'student')
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Identifiants incorrects.')
      }
    } catch {
      toast.error('Erreur de connexion.')
    }
    setLoading(false)
  }

  const handleRegister = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/student/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: regFirstName, lastName: regLastName, email: regEmail,
          schoolName: regSchoolName, phone: regPhone, password: regPassword, programCode: regProgramCode,
        }),
      })
      if (res.ok) {
        toast.success('Votre inscription a été envoyée. Elle sera validée par l\'enseignant.')
        setMode('login')
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || "Erreur lors de l'inscription.")
      }
    } catch {
      toast.error("Erreur lors de l'inscription.")
    }
    setLoading(false)
  }

  const handleTeacherLogin = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/teacher/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: teacherPassword }),
      })
      if (res.ok) {
        const teacher = await res.json()
        toast.success(`Bienvenue ${teacher.firstName} !`)
        login(teacher, 'teacher')
      } else {
        toast.error('Identifiants incorrects.')
      }
    } catch {
      toast.error('Erreur de connexion.')
    }
    setLoading(false)
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="flex flex-col items-center text-center gap-2">
          <div className="size-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
            <BookOpen className="size-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <CardTitle className="text-xl">Cahier d&apos;exercices et de suivi</CardTitle>
          <CardDescription>Cahier interactif</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex rounded-lg border p-1 bg-muted">
            <button
              onClick={() => { setMode('login'); setShowTeacherLogin(false) }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === 'login' ? 'bg-emerald-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => { setMode('register'); setShowTeacherLogin(false) }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === 'register' ? 'bg-emerald-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Inscription
            </button>
          </div>

          {mode === 'login' && !showTeacherLogin && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="login-email">Email</Label>
                <Input id="login-email" type="email" autoComplete="off" placeholder="votre@email.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password">Mot de passe</Label>
                <Input id="login-password" type="password" autoComplete="new-password" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleLogin() }} />
              </div>
              <Button onClick={handleLogin} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700">
                {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
                Se connecter
              </Button>
              <Button variant="outline" onClick={() => setShowTeacherLogin(true)} className="w-full">
                <GraduationCap className="size-4 mr-2" />
                Connexion enseignant
              </Button>
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-firstName">Prénom *</Label>
                  <Input id="reg-firstName" value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-lastName">Nom *</Label>
                  <Input id="reg-lastName" value={regLastName} onChange={(e) => setRegLastName(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-email">Email *</Label>
                <Input id="reg-email" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-program">Niveau scolaire *</Label>
                <select
                  id="reg-program"
                  value={regProgramCode}
                  onChange={(e) => setRegProgramCode(e.target.value as ProgramCode)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-foreground shadow-sm"
                >
                  {PROGRAMS.map((program) => <option key={program.code} value={program.code} className="bg-background text-foreground">{program.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-schoolName">Établissement</Label>
                <Input id="reg-schoolName" value={regSchoolName} onChange={(e) => setRegSchoolName(e.target.value)} />
              </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-phone">Téléphone</Label>
                <Input id="reg-phone" type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-password">Mot de passe *</Label>
                <Input id="reg-password" type="password" autoComplete="new-password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleRegister() }} />
              </div>
              <Button onClick={handleRegister} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700">
                {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
                S&apos;inscrire
              </Button>
            </div>
          )}

          {mode === 'login' && showTeacherLogin && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="teacher-password">Mot de passe enseignant</Label>
                <Input id="teacher-password" type="password" autoComplete="new-password" placeholder="••••••••" value={teacherPassword} onChange={(e) => setTeacherPassword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleTeacherLogin() }} />
              </div>
              <Button onClick={handleTeacherLogin} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700">
                {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
                Connexion
              </Button>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}

// ===== Student Dashboard =====
function StudentDashboard() {
  const { user, logout, studentTab } = useAppStore()
  const student = user as StudentUser
  const [unreadComments, setUnreadComments] = useState(0)
  useEffect(() => {
    const load = () => fetch('/api/notifications').then((r) => r.json()).then((d) => setUnreadComments(d.unread || 0)).catch(() => {})
    load(); const interval = window.setInterval(load, 1000)
    return () => window.clearInterval(interval)
  }, [])
  const markCommentsRead = () => {
    if (!unreadComments) return
    fetch('/api/notifications', { method: 'PATCH' }).then(() => setUnreadComments(0))
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
        <div>
          <span className="font-medium">{student.firstName} {student.lastName}</span>
          <p className="text-xs text-muted-foreground">{student.program.shortName}</p>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="size-4 mr-1" /> Déconnexion
          </Button>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        <Tabs defaultValue="chapters" className="w-full" onValueChange={(value) => { if (value === 'comments') markCommentsRead() }}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="chapters">Chapitres</TabsTrigger>
            <TabsTrigger value="comments" className="relative">Mes commentaires{unreadComments > 0 && <span className="ml-2 size-2 rounded-full bg-red-500" aria-label="Commentaires non lus" />}</TabsTrigger>
            <TabsTrigger value="profile">Mon profil</TabsTrigger>
          </TabsList>
          <TabsContent value="chapters"><StudentChaptersView /></TabsContent>
          <TabsContent value="comments"><StudentCommentsView /></TabsContent>
          <TabsContent value="profile"><StudentProfileView /></TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// ===== Student Chapters View =====
function StudentChaptersView() {
  const { user, selectedExercise, setSelectedExercise, openLightbox } = useAppStore()
  const student = user as StudentUser
  const [chapters, setChapters] = useState<ChapterData[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null)
  const [chapterExercises, setChapterExercises] = useState<Record<string, ExerciseData[]>>({})
  const [loadingExercises, setLoadingExercises] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`/api/chapters?studentId=${student.id}`)
        if (res.ok && !cancelled) {
          const data = await res.json()
          setChapters(data.chapters || [])
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false)
    }
    load()
  }, [student.id])

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Supprimer ce commentaire et ses réponses ?')) return
    try {
      const res = await fetch(`/api/comments?id=${commentId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Erreur serveur.')
      setComments((current) => current.filter((comment) => comment.id !== commentId))
      toast.success('Commentaire supprimé.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible de supprimer le commentaire.')
    }
  }

  const toggleChapter = async (chapter: ChapterData) => {
    if (expandedChapterId === chapter.id) {
      setExpandedChapterId(null)
      return
    }
    setExpandedChapterId(chapter.id)
    if (chapterExercises[chapter.id]) return
    setLoadingExercises(chapter.id)
    try {
      const res = await fetch(`/api/chapters/${chapter.id}/exercises?studentId=${student.id}`)
      if (res.ok) {
        const data = await res.json()
        setChapterExercises(prev => ({ ...prev, [chapter.id]: data.exercises || [] }))
      }
    } catch { /* ignore */ }
    setLoadingExercises(null)
  }

  const analyse = chapters.filter(c => c.semester === 'Analyse')
  const algebre = chapters.filter(c => c.semester === 'Algèbre')

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  const selectedChapter = expandedChapterId ? chapters.find(c => c.id === expandedChapterId) || null : null
  const exercises = selectedChapter ? (chapterExercises[selectedChapter.id] || []) : []

  return (
    <>
      <div className="space-y-4">
        <Accordion type="multiple" className="space-y-2">
          {analyse.length > 0 && (
            <AccordionItem value="analyse" className="border rounded-lg px-4">
              <AccordionTrigger className="font-semibold">Chapitres</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1">
                  {analyse.map(ch => (
                    <ChapterRowInline
                      key={ch.id}
                      chapter={ch}
                      isExpanded={expandedChapterId === ch.id}
                      isLoading={loadingExercises === ch.id}
                      exercises={chapterExercises[ch.id] || []}
                      onToggle={() => toggleChapter(ch)}
                      onExerciseClick={(ex) => setSelectedExercise(ex)}
                      onImageClick={(ex) => {
                        if (ex.pageStart) {
                          openLightbox(pageImageUrl(ex.pageStart!, student.program.code, ch.number, ex.number), `Ex.${ex.number}`)
                        }
                      }}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {algebre.length > 0 && (
            <AccordionItem value="algebre" className="border rounded-lg px-4">
              <AccordionTrigger className="font-semibold">II. Algèbre</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1">
                  {algebre.map(ch => (
                    <ChapterRowInline
                      key={ch.id}
                      chapter={ch}
                      isExpanded={expandedChapterId === ch.id}
                      isLoading={loadingExercises === ch.id}
                      exercises={chapterExercises[ch.id] || []}
                      onToggle={() => toggleChapter(ch)}
                      onExerciseClick={(ex) => setSelectedExercise(ex)}
                      onImageClick={(ex) => {
                        if (ex.pageStart) {
                          openLightbox(pageImageUrl(ex.pageStart!, student.program.code, ch.number, ex.number), `Ex.${ex.number}`)
                        }
                      }}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {chapters.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <BookOpen className="size-10 mx-auto mb-2 opacity-40" />
            <p>Aucun chapitre disponible.</p>
          </div>
        )}
      </div>

      {selectedExercise && selectedChapter && (
        <ExerciseDetailDialog
          key={selectedExercise.id}
          exercise={selectedExercise}
          chapter={selectedChapter}
          exercises={exercises}
          onClose={() => setSelectedExercise(null)}
        />
      )}
    </>
  )
}

function ChapterRowInline({ chapter, isExpanded, isLoading, exercises, onToggle, onExerciseClick, onImageClick }: {
  chapter: ChapterData
  isExpanded: boolean
  isLoading: boolean
  exercises: ExerciseData[]
  onToggle: () => void
  onExerciseClick: (ex: ExerciseData) => void
  onImageClick: (ex: ExerciseData) => void
}) {
  const allDone = chapter.completedCount === chapter.exerciseCount
  return (
    <div className="rounded-lg border border-l-4 border-l-emerald-400 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
      >
        <ChevronRight className={`size-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
        <span className="font-medium text-sm">Ch.{chapter.number}:</span>
        <span className="flex-1 text-sm truncate">{chapter.title}</span>
        <Badge variant="secondary" className={allDone ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'}>
          {chapter.completedCount}/{chapter.exerciseCount}
        </Badge>
        <Progress value={(chapter.completedCount / chapter.exerciseCount) * 100} className="w-16 h-2 hidden sm:block" />
      </button>
      {isExpanded && (
        <div className="border-t px-3 pb-3 pt-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="size-5 animate-spin text-emerald-600 dark:text-emerald-400" />
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar space-y-1.5">
              {exercises.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => onExerciseClick(ex)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-muted transition-colors"
                >
                  <span className="font-medium text-sm text-muted-foreground min-w-[40px]">Ex. {ex.number}</span>
                  <StatusBadge status={ex.progress?.status || 'not_started'} />
                  {ex.pageStart && (
                    <ImageIcon
                      className="size-4 text-muted-foreground ml-auto cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); onImageClick(ex) }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ===== Student Comments View =====
function StudentCommentsView() {
  const { user } = useAppStore()
  const student = user as StudentUser
  const [comments, setComments] = useState<CommentData[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/comments')
        if (res.ok && !cancelled) {
          const data = await res.json()
          setComments((data.comments || []).filter((c: CommentData) => c.student.id === student.id))
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false)
    }
    load()
  }, [student.id])

  const handleDeleteComment = async (commentId: string) => {
    setDeletingCommentId(commentId)
    try {
      const res = await fetch(`/api/comments?id=${commentId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Erreur serveur.')
      setComments((current) => current.filter((comment) => comment.id !== commentId))
      toast.success('Commentaire supprimé.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible de supprimer le commentaire.')
    }
    setDeletingCommentId(null)
  }

  if (loading) {
    return <div className="space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
  }

  if (comments.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <MessageSquare className="size-10 mx-auto mb-2 opacity-40" />
        <p>Aucun commentaire.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-xl">
      {comments.map((comment) => (
        <Card key={comment.id} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm mb-2">{comment.content}</p>
            <Button type="button" variant="ghost" size="sm" className="shrink-0 text-destructive hover:text-destructive" disabled={deletingCommentId === comment.id} onClick={(event) => { event.preventDefault(); event.stopPropagation(); void handleDeleteComment(comment.id) }}>
              {deletingCommentId === comment.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Supprimer
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <span>{new Date(comment.createdAt).toLocaleDateString('fr-FR')}</span>
            {comment.exercise && (
              <span>• Ch.{comment.exercise.chapter.number} — Ex.{comment.exercise.number}</span>
            )}
          </div>
          {comment.remarks.length > 0 && comment.remarks.map((remark) => (
            <div key={remark.id} className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-3 border border-emerald-100 dark:border-emerald-800/50">
              <p className="text-sm text-emerald-800 dark:text-emerald-300">{remark.content}</p>
            </div>
          ))}
        </Card>
      ))}
    </div>
  )
}

// ===== Student Profile View =====
function StudentProfileView() {
  const { user, logout } = useAppStore()
  const student = user as StudentUser
  const [confirmUnsubscribe, setConfirmUnsubscribe] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleUnsubscribe = async () => {
    if (!confirmUnsubscribe) {
      setConfirmUnsubscribe(true)
      return
    }
    setDeleting(true)
    try {
      const res = await fetch(`/api/student/unsubscribe?id=${student.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Compte supprimé.')
        logout()
      } else {
        toast.error('Erreur lors de la suppression.')
      }
    } catch {
      toast.error('Erreur lors de la suppression.')
    }
    setDeleting(false)
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="flex flex-col items-center text-center">
          <Avatar className="size-16">
            <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 text-lg">
              {student.firstName[0]}{student.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <CardTitle>{student.firstName} {student.lastName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="size-4 text-muted-foreground" />
            <span>{student.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <School className="size-4 text-muted-foreground" />
            <span>{student.className}</span>
          </div>
          {student.schoolName && (
            <div className="flex items-center gap-2 text-sm">
              <School className="size-4 text-muted-foreground" />
              <span>{student.schoolName}</span>
            </div>
          )}
          {student.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="size-4 text-muted-foreground" />
              <span>{student.phone}</span>
            </div>
          )}

        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button
            variant="destructive"
            onClick={handleUnsubscribe}
            disabled={deleting}
            className="w-full"
          >
            {deleting && <Loader2 className="size-4 mr-2 animate-spin" />}
            {confirmUnsubscribe ? 'Confirmer la suppression ?' : 'Se désabonner'}
          </Button>
          {confirmUnsubscribe && (
            <p className="text-sm text-red-600 dark:text-red-400 text-center">Cette action est irréversible. Toutes vos données seront supprimées.</p>
          )}
          <Button variant="outline" onClick={logout} className="w-full">
            <LogOut className="size-4 mr-2" /> Se déconnecter
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

// ===== Teacher Dashboard =====
function TeacherDashboard() {
  const { user, logout } = useAppStore()
  const teacher = user as TeacherUser
  const [unreadComments, setUnreadComments] = useState(0)
  useEffect(() => {
    const load = () => fetch('/api/notifications').then((r) => r.json()).then((d) => setUnreadComments(d.unread || 0)).catch(() => {})
    load(); const interval = window.setInterval(load, 1000)
    return () => window.clearInterval(interval)
  }, [])
  const markCommentsRead = () => {
    if (!unreadComments) return
    fetch('/api/notifications', { method: 'PATCH' }).then(() => setUnreadComments(0))
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
        <div className="flex items-center gap-2">
          <GraduationCap className="size-5 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium">{teacher.firstName}</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="size-4 mr-1" /> Déconnexion
          </Button>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        <Tabs defaultValue="pending" className="w-full" onValueChange={(value) => { if (value === 'comments') markCommentsRead() }}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="pending">En attente</TabsTrigger>
            <TabsTrigger value="students">Élèves</TabsTrigger>
            <TabsTrigger value="comments" className="relative">Commentaires{unreadComments > 0 && <span className="ml-2 size-2 rounded-full bg-red-500" aria-label="Commentaires non lus" />}</TabsTrigger>
            <TabsTrigger value="profile">Mon profil</TabsTrigger>
          </TabsList>
          <TabsContent value="pending"><TeacherPendingView /></TabsContent>
          <TabsContent value="students"><TeacherStudentsView /></TabsContent>
          <TabsContent value="comments"><TeacherCommentsView /></TabsContent>
          <TabsContent value="profile"><TeacherProfileView /></TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// ===== Teacher Pending View =====
function TeacherPendingView() {
  const [students, setStudents] = useState<StudentUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState<string | null>(null)
  const [programFilter, setProgramFilter] = useState('')

  const fetchPending = async () => {
    try {
      const query = programFilter ? `?program=${programFilter}` : ''
      const res = await fetch(`/api/teacher/students${query}`)
      if (res.ok) {
        const data = await res.json()
        setStudents(data.pendingStudents || [])
      }
    } catch { /* ignore */ }
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      await fetchPending()
      if (!cancelled) setLoading(false)
    }
    load()
  }, [programFilter])

  const handleAction = async (studentId: string, action: 'approved' | 'rejected') => {
    setActioning(studentId)
    try {
      const res = await fetch('/api/teacher/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, action }),
      })
      if (res.ok) {
        toast.success(action === 'approved' ? 'Élève approuvé.' : 'Inscription refusée.')
        fetchPending()
      }
    } catch {
      toast.error('Erreur.')
    }
    setActioning(null)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (students.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <CheckCircle className="size-12 mx-auto mb-3 text-emerald-500 dark:text-emerald-600" />
        <p>Aucune inscription en attente.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm">
        <option value="">Tous les niveaux</option>
        {PROGRAMS.map((program) => <option key={program.code} value={program.code}>{program.shortName}</option>)}
      </select>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {students.map(s => (
        <Card key={s.id} className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="size-10">
              <AvatarFallback className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                {s.firstName[0]}{s.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{s.firstName} {s.lastName}</p>
              <p className="text-xs font-medium text-emerald-700">{s.program.shortName}</p>
            </div>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground mb-3">
            {s.schoolName && <p>📍 {s.schoolName}</p>}
            <p>📧 {s.email}</p>
            {s.phone && <p>📱 {s.phone}</p>}
            <p>📅 {new Date(s.createdAt).toLocaleDateString('fr-FR')}</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              disabled={actioning === s.id}
              onClick={() => handleAction(s.id, 'approved')}
            >
              {actioning === s.id ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4 mr-1" />}
              Approuver
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-300"
              disabled={actioning === s.id}
              onClick={() => handleAction(s.id, 'rejected')}
            >
              <XCircle className="size-4 mr-1" />
              Refuser
            </Button>
          </div>
        </Card>
      ))}
      </div>
    </div>
  )
}

// ===== Teacher Students View =====
function TeacherStudentsView() {
  const { setSelectedStudent } = useAppStore()
  type StudentWithProgress = StudentUser & { progressCount: number; totalExercises: number }
  const [students, setStudents] = useState<StudentWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [progressDialog, setProgressDialog] = useState<StudentUser | null>(null)
  const [programFilter, setProgramFilter] = useState('')

  const fetchStudents = async () => {
    try {
      const query = programFilter ? `?program=${programFilter}` : ''
      const res = await fetch(`/api/teacher/students${query}`)
      if (res.ok) {
        const data = await res.json()
        setStudents(data.students || [])
      }
    } catch { /* ignore */ }
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      await fetchStudents()
      if (!cancelled) setLoading(false)
    }
    load()
  }, [programFilter])

  const handleDelete = async (studentId: string) => {
    if (confirmDeleteId !== studentId) {
      setConfirmDeleteId(studentId)
      return
    }
    try {
      const res = await fetch(`/api/teacher/students/${studentId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Élève supprimé.')
        setConfirmDeleteId(null)
        fetchStudents()
      }
    } catch {
      toast.error('Erreur lors de la suppression.')
    }
  }

  if (loading) {
    return <div className="space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
  }

  return (
    <>
      <select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)} className="mb-4 h-9 rounded-md border bg-background px-3 text-sm">
        <option value="">Tous les niveaux</option>
        {PROGRAMS.map((program) => <option key={program.code} value={program.code}>{program.shortName}</option>)}
      </select>
      {students.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <MessageSquare className="size-10 mx-auto mb-2 opacity-40" />
          <p>Aucun élève inscrit.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">Téléphone</TableHead>
              <TableHead>Niveau</TableHead>
              <TableHead className="hidden md:table-cell">Établissement</TableHead>
              <TableHead>Progression</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map(s => (
              <TableRow
                key={s.id}
                className="cursor-pointer"
                onClick={() => { setSelectedStudent(s); setProgressDialog(s) }}
              >
                <TableCell className="font-medium">{s.firstName} {s.lastName}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <a
                    href={`mailto:${s.email}`}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {s.email}
                  </a>
                </TableCell>
                <TableCell className="hidden md:table-cell">{s.phone || '—'}</TableCell>
                <TableCell>{s.program.shortName}</TableCell>
                <TableCell className="hidden md:table-cell">{s.schoolName || '—'}</TableCell>
                <TableCell>{s.progressCount}/{s.totalExercises}</TableCell>
                <TableCell>
                  <Button
                    variant={confirmDeleteId === s.id ? 'destructive' : 'ghost'}
                    size="icon"
                    className="size-8"
                    onClick={(e) => { e.stopPropagation(); handleDelete(s.id) }}
                  >
                    {confirmDeleteId === s.id ? (
                      <span className="text-xs font-medium">Confirmer ?</span>
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {progressDialog && (
        <ProgressDialog student={progressDialog} onClose={() => { setProgressDialog(null); setSelectedStudent(null) }} />
      )}
    </>
  )
}

// ===== Progress Dialog =====
function ProgressDialog({ student, onClose }: { student: StudentUser; onClose: () => void }) {
  const { openLightbox, lightbox } = useAppStore()
  const [progress, setProgress] = useState<{ chapter: ChapterData; exercises: ExerciseData[] }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`/api/teacher/students/${student.id}/progress`)
        if (res.ok && !cancelled) {
          const data = await res.json()
          const mapped = (data.chapters || []).map((ch: { id: string; number: number; title: string; semester: string; exerciseCount: number; completedCount: number; exercises: ExerciseData[] }) => ({
            chapter: { id: ch.id, number: ch.number, title: ch.title, semester: ch.semester, exerciseCount: ch.exerciseCount, completedCount: ch.completedCount } as ChapterData,
            exercises: ch.exercises,
          }))
          setProgress(mapped)
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false)
    }
    load()
  }, [student.id])

  const allExercises = progress.flatMap(p => p.exercises)
  const totalExercises = allExercises.length
  const completedCount = allExercises.filter(e => e.progress?.status === 'completed').length
  const inProgressCount = allExercises.filter(e => e.progress?.status === 'in_progress').length
  const difficultyCount = allExercises.filter(e => e.progress?.status === 'difficulty').length

  return (
      <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
        <DialogContent 
          className="max-w-3xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => { if (lightbox.isOpen) e.preventDefault() }}
        >
          <DialogHeader>
            <DialogTitle>Progression de {student.firstName} {student.lastName}</DialogTitle>
            <DialogDescription>Niveau : {student.program.name}</DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3 bg-muted">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{totalExercises}</p>
                </div>
                <div className="rounded-lg border p-3 bg-emerald-50 dark:bg-emerald-900/30">
                  <p className="text-xs text-muted-foreground">Terminés</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{completedCount}</p>
                </div>
                <div className="rounded-lg border p-3 bg-amber-50 dark:bg-amber-900/30">
                  <p className="text-xs text-muted-foreground">En cours</p>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{inProgressCount}</p>
                </div>
                <div className="rounded-lg border p-3 bg-red-50 dark:bg-red-900/30">
                  <p className="text-xs text-muted-foreground">Difficulté</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-400">{difficultyCount}</p>
                </div>
              </div>

              <Accordion type="multiple" className="mt-4 space-y-2">
                {progress.map(({ chapter, exercises }) => {
                  const chapterCompleted = exercises.filter(e => e.progress?.status === 'completed').length
                  return (
                    <AccordionItem key={chapter.id} value={chapter.id} className="border rounded-lg px-4">
                      <AccordionTrigger className="text-sm">
                        <div className="flex items-center gap-3 flex-1 pr-4">
                          <span>Ch.{chapter.number}: {chapter.title}</span>
                          <Badge variant="secondary" className={chapterCompleted === chapter.exerciseCount ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'}>
                            {chapterCompleted}/{chapter.exerciseCount} complétés
                          </Badge>
                          <Progress value={(chapterCompleted / chapter.exerciseCount) * 100} className="w-16 h-2" />
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-1">
                          {exercises.map(ex => (
                            <div key={ex.id} className="flex items-center gap-3 py-1">
                              <span className="text-sm min-w-[40px]">Ex.{ex.number}</span>
                              <StatusBadge status={ex.progress?.status || 'not_started'} />
                              {ex.pageStart && (
                                <ImageIcon
                                  className="size-4 text-muted-foreground cursor-pointer"
                                  onClick={() => openLightbox(pageImageUrl(ex.pageStart!, student.program.code, chapter.number, ex.number), `Ex.${ex.number}`)}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </>
          )}
        </DialogContent>
      </Dialog>
  )
}

// ===== Teacher Comments View =====
function TeacherCommentsView() {
  const [comments, setComments] = useState<CommentData[]>([])
  const [loading, setLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [sending, setSending] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/remarks')
        if (res.ok && !cancelled) {
          const data = await res.json()
          setComments(data.comments || [])
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false)
    }
    load()
  }, [])

  const refetchComments = async () => {
    try {
      const res = await fetch('/api/remarks')
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments || [])
      }
    } catch { /* ignore */ }
  }

  const handleReply = async (commentId: string, studentId: string) => {
    if (!replyContent.trim()) return
    setSending(true)
    try {
      await fetch('/api/remarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, commentId, content: replyContent }),
      })
      toast.success('Réponse envoyée.')
      setReplyContent('')
      setReplyingTo(null)
      refetchComments()
    } catch {
      toast.error("Erreur lors de l'envoi.")
    }
    setSending(false)
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Supprimer ce commentaire et toutes ses réponses ?')) return
    setDeletingId(commentId)
    try {
      const res = await fetch(`/api/comments?id=${commentId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Erreur serveur.')
      setComments((current) => current.filter((comment) => comment.id !== commentId))
      toast.success('Commentaire supprimé.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible de supprimer le commentaire.')
    }
    setDeletingId(null)
  }

  const handleDeleteRemark = async (remarkId: string, commentId: string) => {
    if (!window.confirm('Supprimer cette réponse ?')) return
    setDeletingId(remarkId)
    try {
      const res = await fetch(`/api/remarks?id=${remarkId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setComments((current) => current.map((comment) => comment.id === commentId
        ? { ...comment, remarks: comment.remarks.filter((remark) => remark.id !== remarkId) }
        : comment))
      toast.success('Réponse supprimée.')
    } catch {
      toast.error('Impossible de supprimer la réponse.')
    }
    setDeletingId(null)
  }

  if (loading) {
    return <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
  }

  if (comments.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <MessageSquare className="size-10 mx-auto mb-2 opacity-40" />
        <p>Aucun commentaire.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {comments.map((comment) => (
        <Card key={comment.id} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm mb-2">{comment.content}</p>
            <Button type="button" variant="ghost" size="sm" className="shrink-0 text-destructive hover:text-destructive" disabled={deletingId === comment.id} onClick={(event) => { event.preventDefault(); event.stopPropagation(); void handleDeleteComment(comment.id) }}>
              {deletingId === comment.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Supprimer
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
            <span className="font-medium text-foreground">{comment.student.firstName} {comment.student.lastName}</span>
            <span>• {comment.student.className}</span>
            {comment.exercise && (
              <span>• Ch.{comment.exercise.chapter.number} — Ex.{comment.exercise.number}</span>
            )}
            <span>• {new Date(comment.createdAt).toLocaleDateString('fr-FR')}</span>
          </div>

          {comment.remarks.length > 0 && (
            <div className="space-y-2 mb-3">
              {comment.remarks.map((remark) => (
                <div key={remark.id} className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-3 border border-emerald-100 dark:border-emerald-800/50">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-emerald-800 dark:text-emerald-300">{remark.content}</p>
                    <Button type="button" variant="ghost" size="sm" className="shrink-0 text-destructive hover:text-destructive" disabled={deletingId === remark.id} onClick={(event) => { event.preventDefault(); event.stopPropagation(); void handleDeleteRemark(remark.id, comment.id) }}>
                      {deletingId === remark.id ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                      Supprimer
                    </Button>
                  </div>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 block">
                    {new Date(remark.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              ))}
            </div>
          )}

          {replyingTo === comment.id ? (
            <div className="flex gap-2 mt-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Votre réponse..."
                rows={2}
              />
              <div className="flex flex-col gap-1">
                <Button size="sm" onClick={() => handleReply(comment.id, comment.student.id)} disabled={sending || !replyContent.trim()} className="bg-emerald-600 hover:bg-emerald-700">
                  {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setReplyingTo(null); setReplyContent('') }}>
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setReplyingTo(comment.id)}>
              Répondre
            </Button>
          )}
        </Card>
      ))}
    </div>
  )
}

// ===== Teacher Profile View =====
function TeacherProfileView() {
  const { user, logout } = useAppStore()
  const teacher = user as TeacherUser
  const [profile, setProfile] = useState<TeacherUser | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/teacher/profile')
        if (res.ok) {
          const data = await res.json()
          setProfile(data)
        }
      } catch { /* ignore */ }
    }
    fetchProfile()
  }, [])

  const displayTeacher = profile || teacher

  const handleChangePassword = async () => {
    setError('')
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Tous les champs sont requis.')
      return
    }
    if (newPassword.length < 4) {
      setError('Le nouveau mot de passe doit contenir au moins 4 caractères.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/teacher/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (res.ok) {
        toast.success('Mot de passe modifié.')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setError('Mot de passe actuel incorrect.')
      }
    } catch {
      setError('Erreur lors de la modification.')
    }
    setSaving(false)
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card>
        <CardHeader className="flex flex-col items-center text-center">
          <Avatar className="size-16">
            <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 text-lg">
              <GraduationCap className="size-8" />
            </AvatarFallback>
          </Avatar>
          <CardTitle>{displayTeacher.firstName} {displayTeacher.lastName}</CardTitle>
          <CardDescription>{displayTeacher.status}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm justify-center">
            <Mail className="size-4 text-muted-foreground" />
            <span>{displayTeacher.email}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Modifier le mot de passe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 p-2 rounded">{error}</p>}
          <div className="space-y-1.5">
            <Label htmlFor="current-pw">Mot de passe actuel</Label>
            <Input id="current-pw" type="password" autoComplete="new-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-pw">Nouveau mot de passe</Label>
            <Input id="new-pw" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-pw">Confirmer le mot de passe</Label>
            <Input id="confirm-pw" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <Button onClick={handleChangePassword} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700">
            {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
            Modifier le mot de passe
          </Button>
        </CardContent>
      </Card>

      <Button variant="outline" onClick={logout} className="w-full">
        <LogOut className="size-4 mr-2" /> Se déconnecter
      </Button>
    </div>
  )
}

// ===== Theme Toggle =====
function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const hasMounted = useRef<boolean | null>(null)
  if (hasMounted.current == null) { hasMounted.current = typeof window !== 'undefined' }
  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-9 text-white hover:bg-white/20 hover:text-white"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Basculer le thème"
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}

// ===== App Header =====
function AppHeader() {
  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-emerald-700 to-teal-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-3 items-center">
        <div className="flex items-center gap-3">
          <img src="/author-photo.jpg" alt="Br-Rachid" className="size-12 rounded-full border-2 border-white/40 object-cover" />
          <div className="hidden sm:block">
            <p className="font-semibold text-sm">Br-Rachid</p>
            <p className="text-xs text-emerald-100">Enseignant et encadrant de mathématiques</p>
          </div>
        </div>
        <div className="flex justify-center">
          <ThemeToggle />
        </div>
        <div className="flex justify-end">
          <img src="/wahamath-logo.png" alt="wahamath" className="h-10 hidden sm:block" />
        </div>
      </div>
    </header>
  )
}

// ===== App Footer =====
function AppFooter() {
  return (
    <footer className="mt-auto border-t bg-muted px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>© wahamath 2026</span>
        <a href="mailto:wahamath@hotmail.com" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
          Contact: wahamath@hotmail.com
        </a>
      </div>
    </footer>
  )
}

// ===== Main Home Component =====
export default function Home() {
  const { currentView, lightbox, closeLightbox, login } = useAppStore()
  useEffect(() => { fetch('/api/auth/me').then(async (res) => { if (res.ok) { const data = await res.json(); login(data.user, data.view) } }).catch(() => {}) }, [login])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: var(--muted); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--muted-foreground); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--foreground); }
      `}</style>
      <AppHeader />
      <main className="flex-1">
        {currentView === 'auth' && <AuthView />}
        {currentView === 'student' && <StudentDashboard />}
        {currentView === 'teacher' && <TeacherDashboard />}
      </main>
      <ImageLightbox
        key={lightbox.imageUrl}
        isOpen={lightbox.isOpen}
        imageUrl={lightbox.imageUrl}
        label={lightbox.label}
        onClose={closeLightbox}
      />
      <AppFooter />
    </div>
  )
}
