"use client";

import {
  AlertCircle,
  ArrowLeft,
  Camera,
  Check,
  Clock,
  Edit,
  Eye,
  FileText,
  Plus,
  Save,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";

export default function EditCoursePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const locale = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [course, setCourse] = useState<any>(null);
  const [loadingCourse, setLoadingCourse] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: 0,
    discountPrice: 0,
    categoryId: "",
    tagsInput: "",
    published: false,
  });
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auth Guard
  useEffect(() => {
    if (
      !isLoading &&
      (!isAuthenticated ||
        (user?.role !== "INSTRUCTOR" && user?.role !== "ADMIN"))
    ) {
      router.push(`/${locale}/login`);
    }
  }, [isLoading, isAuthenticated, user, router, locale]);

  // Load Categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data } = await api.get("/courses/categories");
        setCategories(data);
      } catch (err) {
        console.error("Failed to load categories", err);
      } finally {
        setLoadingCategories(false);
      }
    }
    if (isAuthenticated) {
      fetchCategories();
    }
  }, [isAuthenticated]);

  // Fetch Course details helper
  const fetchCourse = async (isInitial = false) => {
    try {
      const { data } = await api.get(`/courses/${slug}`);
      setCourse(data);

      if (isInitial) {
        setFormData({
          title: data.title || "",
          description: data.description || "",
          price: data.price || 0,
          discountPrice: data.discountPrice || 0,
          categoryId: data.categoryId?._id || data.categoryId || "",
          tagsInput: (data.tags || []).join(", "),
          published: data.published || false,
        });
        setThumbnailUrl(data.thumbnail || "");
      }
    } catch (err: any) {
      setErrorMsg("Failed to load course details. Maybe you do not own it.");
    } finally {
      if (isInitial) {
        setLoadingCourse(false);
      }
    }
  };

  // Load Course Details on mount
  useEffect(() => {
    if (isAuthenticated && slug) {
      fetchCourse(true);
    }
  }, [isAuthenticated, slug]);

  // Lesson modal & form states
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [lessonFormData, setLessonFormData] = useState({
    title: "",
    videoUrl: "",
    duration: 0,
    content: "",
    isFree: false,
  });
  const [isLessonSaving, setIsLessonSaving] = useState(false);
  const [lessonErrorMsg, setLessonErrorMsg] = useState<string | null>(null);

  // Lesson Handlers
  const handleAddLessonOpen = () => {
    setEditingLesson(null);
    setLessonFormData({
      title: "",
      videoUrl: "",
      duration: 0,
      content: "",
      isFree: false,
    });
    setLessonErrorMsg(null);
    setIsLessonModalOpen(true);
  };

  const handleEditLessonOpen = (lesson: any) => {
    setEditingLesson(lesson);
    setLessonFormData({
      title: lesson.title || "",
      videoUrl: lesson.videoUrl || "",
      duration: lesson.duration || 0,
      content: lesson.content || "",
      isFree: !!lesson.isFree,
    });
    setLessonErrorMsg(null);
    setIsLessonModalOpen(true);
  };

  const handleLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLessonSaving(true);
    setLessonErrorMsg(null);

    if (!lessonFormData.title.trim()) {
      setLessonErrorMsg("Lesson title is required");
      setIsLessonSaving(false);
      return;
    }

    const payload = {
      title: lessonFormData.title.trim(),
      videoUrl: lessonFormData.videoUrl.trim() || undefined,
      duration: lessonFormData.duration
        ? Number(lessonFormData.duration)
        : undefined,
      content: lessonFormData.content.trim() || undefined,
      isFree: lessonFormData.isFree,
    };

    try {
      const courseId = course.id || course._id;
      if (editingLesson) {
        const lessonId = editingLesson.id || editingLesson._id;
        await api.patch(`/courses/lessons/${lessonId}`, payload);
      } else {
        await api.post(`/courses/${courseId}/lessons`, payload);
      }
      setIsLessonModalOpen(false);
      await fetchCourse(false); // Refetch lessons list without overwriting unsaved course forms
    } catch (err: any) {
      setLessonErrorMsg(err.response?.data?.message || "Failed to save lesson");
    } finally {
      setIsLessonSaving(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this lesson? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await api.delete(`/courses/lessons/${lessonId}`);
      await fetchCourse(false); // Reload lessons list
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to delete lesson");
    }
  };

  // Authorization Check
  const courseInstructorId =
    course?.instructorId?.id ||
    course?.instructorId?._id ||
    course?.instructorId ||
    "";
  const isAuthorized =
    !loadingCourse &&
    course &&
    (courseInstructorId === user?.sub || user?.role === "ADMIN");

  if (isLoading || loadingCategories || loadingCourse) {
    return (
      <div className="flex flex-col min-h-screen bg-base-200">
        <Navbar />
        <div className="flex justify-center items-center flex-grow">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      </div>
    );
  }

  if (!course || !isAuthorized) {
    return (
      <div className="flex flex-col min-h-screen bg-base-200">
        <Navbar />
        <div className="flex justify-center items-center flex-grow flex-col gap-4">
          <AlertCircle className="w-16 h-16 text-error" />
          <h1 className="text-2xl font-black text-base-content">
            Not Authorized
          </h1>
          <p className="text-sm text-base-content/60 font-semibold">
            You do not have permissions to edit this course.
          </p>
          <Link
            href={`/${locale}/instructor/dashboard`}
            className="btn btn-primary rounded-xl font-bold mt-2"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Handle image upload
  const handleThumbnailClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileData = new FormData();
    fileData.append("file", file);

    setIsUploading(true);
    setErrorMsg(null);

    try {
      const { data } = await api.post("/upload", fileData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setThumbnailUrl(data.url);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || "Failed to upload course thumbnail",
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Submit Course Form (PATCH)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);

    if (!formData.title.trim()) {
      setErrorMsg("Course title is required");
      setIsSaving(false);
      return;
    }
    if (!formData.description.trim()) {
      setErrorMsg("Course description is required");
      setIsSaving(false);
      return;
    }
    if (!formData.categoryId) {
      setErrorMsg("Please select a course category");
      setIsSaving(false);
      return;
    }

    const tags = formData.tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const payload = {
      title: formData.title,
      description: formData.description,
      price: Number(formData.price),
      discountPrice: formData.discountPrice
        ? Number(formData.discountPrice)
        : undefined,
      categoryId: formData.categoryId,
      tags,
      published: formData.published,
      thumbnail: thumbnailUrl || undefined,
    };

    try {
      const courseId = course.id || course._id;
      await api.patch(`/courses/${courseId}`, payload);
      router.push(`/${locale}/instructor/dashboard`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to update course");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-base-200 text-base-content font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
        {/* Back Link */}
        <Link
          href={`/${locale}/instructor/dashboard`}
          className="flex items-center gap-2 text-xs font-bold text-base-content/60 hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Page Title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-content">
            <Edit className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-base-content">
              Edit Course
            </h1>
            <p className="text-xs text-base-content/50 font-medium">
              Update your learning curriculum blueprint details
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="alert alert-error rounded-2xl shadow-sm text-xs font-bold mb-6 text-error-content">
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Course Card Form */}
        <form
          onSubmit={handleSubmit}
          className="card bg-base-100 border border-base-300 shadow-sm rounded-3xl overflow-hidden p-6 sm:p-8 space-y-6"
        >
          {/* Thumbnail Uploader Box */}
          <div>
            <label className="label text-xs font-bold text-base-content/50 uppercase tracking-wider mb-2">
              Course Thumbnail
            </label>
            <div
              onClick={handleThumbnailClick}
              className="border-2 border-dashed border-base-300 rounded-2xl aspect-video bg-base-200/50 hover:bg-base-200 cursor-pointer flex flex-col items-center justify-center relative overflow-hidden transition-colors group"
            >
              {isUploading ? (
                <span className="loading loading-spinner loading-lg text-primary" />
              ) : thumbnailUrl ? (
                <>
                  <img
                    src={thumbnailUrl}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                </>
              ) : (
                <div className="text-center p-6 flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-base-300 flex items-center justify-center text-base-content/60">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-base-content/75 mt-1">
                    Upload Course Image
                  </p>
                  <p className="text-[10px] text-base-content/40 font-semibold">
                    Supports JPG, PNG (Max 5MB)
                  </p>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>

          {/* Grid Layout Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="label text-xs font-bold text-base-content/50 uppercase tracking-wider">
                Course Title
              </label>
              <input
                type="text"
                placeholder="e.g. Mastering Advanced NextJS Systems"
                className="input input-bordered w-full rounded-xl font-semibold text-sm focus:input-primary"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="label text-xs font-bold text-base-content/50 uppercase tracking-wider">
                Description
              </label>
              <textarea
                rows={4}
                placeholder="Detailed curriculum syllabus details..."
                className="textarea textarea-bordered w-full rounded-xl font-semibold text-sm focus:textarea-primary"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="label text-xs font-bold text-base-content/50 uppercase tracking-wider">
                Category
              </label>
              <select
                className="select select-bordered w-full rounded-xl font-semibold text-sm focus:select-primary"
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value })
                }
                required
              >
                <option value="" disabled>
                  Select category
                </option>
                {categories.map((cat) => (
                  <option key={cat.id || cat._id} value={cat.id || cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags Input */}
            <div>
              <label className="label text-xs font-bold text-base-content/50 uppercase tracking-wider">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g. NextJS, Frontend, React"
                className="input input-bordered w-full rounded-xl font-semibold text-sm focus:input-primary"
                value={formData.tagsInput}
                onChange={(e) =>
                  setFormData({ ...formData, tagsInput: e.target.value })
                }
              />
            </div>

            {/* Price */}
            <div>
              <label className="label text-xs font-bold text-base-content/50 uppercase tracking-wider">
                Price ($ USD)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="input input-bordered w-full rounded-xl font-semibold text-sm focus:input-primary"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: Number(e.target.value) })
                }
                required
              />
            </div>

            {/* Discount Price */}
            <div>
              <label className="label text-xs font-bold text-base-content/50 uppercase tracking-wider">
                Discount Price ($ USD)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="input input-bordered w-full rounded-xl font-semibold text-sm focus:input-primary"
                value={formData.discountPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountPrice: Number(e.target.value),
                  })
                }
              />
            </div>

            {/* Publishing Checkbox */}
            <div className="md:col-span-2 flex items-center justify-between p-4 bg-base-200/50 rounded-2xl border border-base-300">
              <div>
                <p className="text-sm font-bold text-base-content">
                  Publish immediately
                </p>
                <p className="text-[10px] text-base-content/50 font-semibold">
                  Make this course visible to students immediately upon saving
                </p>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={formData.published}
                onChange={(e) =>
                  setFormData({ ...formData, published: e.target.checked })
                }
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 flex justify-end gap-3 border-t border-base-200">
            <Link
              href={`/${locale}/instructor/dashboard`}
              className="btn btn-ghost rounded-xl font-bold px-6"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary rounded-xl font-bold px-8 flex items-center gap-2"
              disabled={isSaving || isUploading}
            >
              <Save className="w-4 h-4" />{" "}
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>

        {/* Curriculum / Lessons Manager section */}
        <div className="card bg-base-100 border border-base-300 shadow-sm rounded-3xl overflow-hidden p-6 sm:p-8 mt-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-base-200">
            <div>
              <h2 className="text-xl font-black text-base-content">
                Course Curriculum
              </h2>
              <p className="text-xs text-base-content/50 font-medium">
                Manage course lessons, preview rights, and video learning
                content
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddLessonOpen}
              className="btn btn-primary btn-sm rounded-xl font-bold flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Add Lesson
            </button>
          </div>

          {course.lessons && course.lessons.length > 0 ? (
            <div className="space-y-4">
              {course.lessons.map((lesson: any, index: number) => (
                <div
                  key={lesson.id || lesson._id}
                  className="flex items-start sm:items-center justify-between p-4 bg-base-200/40 border border-base-300 hover:border-primary/30 rounded-2xl transition-all duration-200"
                >
                  <div className="flex items-start sm:items-center gap-4 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-base-300 text-base-content/70 font-black text-xs flex items-center justify-center shrink-0">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-base-content truncate">
                          {lesson.title}
                        </p>
                        {lesson.isFree && (
                          <span className="badge badge-success badge-sm font-bold text-[9px] uppercase tracking-wider">
                            Free Preview
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-base-content/50 font-medium">
                        {lesson.duration ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {lesson.duration}{" "}
                            mins
                          </span>
                        ) : null}
                        {lesson.videoUrl ? (
                          <span className="flex items-center gap-1 text-primary">
                            <Video className="w-3.5 h-3.5" /> Video Link
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" /> Text content
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEditLessonOpen(lesson)}
                      className="btn btn-ghost btn-xs rounded-lg text-base-content hover:bg-base-300 flex items-center justify-center p-1.5"
                      title="Edit Lesson"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteLesson(lesson.id || lesson._id)
                      }
                      className="btn btn-ghost btn-xs rounded-lg text-error hover:bg-error/10 flex items-center justify-center p-1.5"
                      title="Delete Lesson"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed border-base-300 rounded-2xl">
              <Video className="w-10 h-10 text-base-content/20 mx-auto mb-2" />
              <p className="text-sm text-base-content/40 font-bold">
                No lessons added yet
              </p>
              <p className="text-xs text-base-content/30 font-medium mt-1">
                Add your first lesson to build the syllabus
              </p>
              <button
                type="button"
                onClick={handleAddLessonOpen}
                className="btn btn-primary btn-sm rounded-xl font-bold mt-4"
              >
                Create Lesson
              </button>
            </div>
          )}
        </div>

        {/* Lesson Edit/Create Modal overlay */}
        {isLessonModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-base-100 border border-base-300 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="px-6 py-5 border-b border-base-200 flex items-center justify-between">
                <h3 className="text-lg font-black text-base-content">
                  {editingLesson ? "Edit Lesson" : "Add New Lesson"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsLessonModalOpen(false)}
                  className="btn btn-ghost btn-sm btn-circle text-base-content/50 hover:text-base-content"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleLessonSubmit} className="p-6 space-y-4">
                {lessonErrorMsg && (
                  <div className="alert alert-error rounded-xl text-xs font-bold text-error-content py-2 px-3">
                    <span>{lessonErrorMsg}</span>
                  </div>
                )}

                <div>
                  <label className="label text-xs font-bold text-base-content/50 uppercase tracking-wider">
                    Lesson Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Setting up clean workspace boilerplate"
                    className="input input-bordered w-full rounded-xl font-semibold text-sm focus:input-primary"
                    value={lessonFormData.title}
                    onChange={(e) =>
                      setLessonFormData({
                        ...lessonFormData,
                        title: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label text-xs font-bold text-base-content/50 uppercase tracking-wider">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 15"
                      className="input input-bordered w-full rounded-xl font-semibold text-sm focus:input-primary"
                      value={lessonFormData.duration || ""}
                      onChange={(e) =>
                        setLessonFormData({
                          ...lessonFormData,
                          duration: Number(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="label text-xs font-bold text-base-content/50 uppercase tracking-wider">
                      Video URL (optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://vimeo.com/..."
                      className="input input-bordered w-full rounded-xl font-semibold text-sm focus:input-primary"
                      value={lessonFormData.videoUrl}
                      onChange={(e) =>
                        setLessonFormData({
                          ...lessonFormData,
                          videoUrl: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="label text-xs font-bold text-base-content/50 uppercase tracking-wider">
                    Lesson Content / Summary
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Write notes, code snippets, or lesson instructions here..."
                    className="textarea textarea-bordered w-full rounded-xl font-semibold text-sm focus:textarea-primary"
                    value={lessonFormData.content}
                    onChange={(e) =>
                      setLessonFormData({
                        ...lessonFormData,
                        content: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-base-200/50 rounded-xl border border-base-300">
                  <div>
                    <p className="text-xs font-bold text-base-content">
                      Free Preview
                    </p>
                    <p className="text-[10px] text-base-content/40 font-semibold">
                      Allow guests to view this lesson without buying the course
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary toggle-sm"
                    checked={lessonFormData.isFree}
                    onChange={(e) =>
                      setLessonFormData({
                        ...lessonFormData,
                        isFree: e.target.checked,
                      })
                    }
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-base-200">
                  <button
                    type="button"
                    onClick={() => setIsLessonModalOpen(false)}
                    className="btn btn-ghost rounded-xl font-bold btn-sm px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary rounded-xl font-bold btn-sm px-5"
                    disabled={isLessonSaving}
                  >
                    {isLessonSaving
                      ? "Saving..."
                      : editingLesson
                        ? "Save Changes"
                        : "Create Lesson"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
