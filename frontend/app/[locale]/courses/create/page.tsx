'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { BookOpen, Camera, ArrowLeft, Save, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function CreateCoursePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    discountPrice: 0,
    categoryId: '',
    tagsInput: '',
    published: false,
  });
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auth Guard
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user?.role !== 'INSTRUCTOR' && user?.role !== 'ADMIN'))) {
      router.push(`/${locale}/login`);
    }
  }, [isLoading, isAuthenticated, user, router, locale]);

  // Load Categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data } = await api.get('/courses/categories');
        setCategories(data);
        if (data.length > 0) {
          setFormData((prev) => ({ ...prev, categoryId: data[0].id || data[0]._id }));
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      } finally {
        setLoadingCategories(false);
      }
    }
    if (isAuthenticated) {
      fetchCategories();
    }
  }, [isAuthenticated]);

  if (isLoading || !user || loadingCategories) {
    return (
      <div className="flex flex-col min-h-screen bg-base-200">
        <Navbar />
        <div className="flex justify-center items-center flex-grow">
          <span className="loading loading-spinner loading-lg text-primary" />
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
    fileData.append('file', file);

    setIsUploading(true);
    setErrorMsg(null);

    try {
      const { data } = await api.post('/upload', fileData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setThumbnailUrl(data.url);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to upload course thumbnail');
    } finally {
      setIsUploading(false);
    }
  };

  // Submit Course Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);

    if (!formData.title.trim()) {
      setErrorMsg('Course title is required');
      setIsSaving(false);
      return;
    }
    if (!formData.description.trim()) {
      setErrorMsg('Course description is required');
      setIsSaving(false);
      return;
    }
    if (!formData.categoryId) {
      setErrorMsg('Please select a course category');
      setIsSaving(false);
      return;
    }

    const tags = formData.tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const payload = {
      title: formData.title,
      description: formData.description,
      price: Number(formData.price),
      discountPrice: formData.discountPrice ? Number(formData.discountPrice) : undefined,
      categoryId: formData.categoryId,
      tags,
      published: formData.published,
      thumbnail: thumbnailUrl || undefined,
    };

    try {
      await api.post('/courses', payload);
      router.push(`/${locale}/instructor/dashboard`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create course');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-base-200 text-base-content font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
        
        {/* Back Link */}
        <Link href={`/${locale}/instructor/dashboard`} className="flex items-center gap-2 text-xs font-bold text-base-content/60 hover:text-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Page Title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-content">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-base-content">Create New Course</h1>
            <p className="text-xs text-base-content/50 font-medium">Design your learning curriculum circle blueprint</p>
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="alert alert-error rounded-2xl shadow-sm text-xs font-bold mb-6 text-error-content">
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Course Card Form */}
        <form onSubmit={handleSubmit} className="card bg-base-100 border border-base-300 shadow-sm rounded-3xl overflow-hidden p-6 sm:p-8 space-y-6">
          
          {/* Thumbnail Uploader Box */}
          <div>
            <label className="label text-xs font-bold text-base-content/50 uppercase tracking-wider mb-2">Course Thumbnail</label>
            <div 
              onClick={handleThumbnailClick}
              className="border-2 border-dashed border-base-300 rounded-2xl aspect-video bg-base-200/50 hover:bg-base-200 cursor-pointer flex flex-col items-center justify-center relative overflow-hidden transition-colors group"
            >
              {isUploading ? (
                <span className="loading loading-spinner loading-lg text-primary" />
              ) : thumbnailUrl ? (
                <>
                  <img src={thumbnailUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                </>
              ) : (
                <div className="text-center p-6 flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-base-300 flex items-center justify-center text-base-content/60">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-base-content/75 mt-1">Upload Course Image</p>
                  <p className="text-[10px] text-base-content/40 font-semibold">Supports JPG, PNG (Max 5MB)</p>
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
              <label className="label text-xs font-bold text-base-content/50 uppercase tracking-wider">Course Title</label>
              <input 
                type="text" 
                placeholder="e.g. Mastering Advanced NextJS Systems"
                className="input input-bordered w-full rounded-xl font-semibold text-sm focus:input-primary"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="label text-xs font-bold text-base-content/50 uppercase tracking-wider">Description</label>
              <textarea 
                rows={4}
                placeholder="Detailed curriculum syllabus details..."
                className="textarea textarea-bordered w-full rounded-xl font-semibold text-sm focus:textarea-primary"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="label text-xs font-bold text-base-content/50 uppercase tracking-wider">Category</label>
              <select 
                className="select select-bordered w-full rounded-xl font-semibold text-sm focus:select-primary"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id || cat._id} value={cat.id || cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags Input */}
            <div>
              <label className="label text-xs font-bold text-base-content/50 uppercase tracking-wider">Tags (comma-separated)</label>
              <input 
                type="text" 
                placeholder="e.g. NextJS, Frontend, React"
                className="input input-bordered w-full rounded-xl font-semibold text-sm focus:input-primary"
                value={formData.tagsInput}
                onChange={(e) => setFormData({ ...formData, tagsInput: e.target.value })}
              />
            </div>

            {/* Price */}
            <div>
              <label className="label text-xs font-bold text-base-content/50 uppercase tracking-wider">Price ($ USD)</label>
              <input 
                type="number" 
                min="0"
                step="0.01"
                placeholder="0.00"
                className="input input-bordered w-full rounded-xl font-semibold text-sm focus:input-primary"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                required
              />
            </div>

            {/* Discount Price */}
            <div>
              <label className="label text-xs font-bold text-base-content/50 uppercase tracking-wider">Discount Price ($ USD)</label>
              <input 
                type="number" 
                min="0"
                step="0.01"
                placeholder="0.00"
                className="input input-bordered w-full rounded-xl font-semibold text-sm focus:input-primary"
                value={formData.discountPrice}
                onChange={(e) => setFormData({ ...formData, discountPrice: Number(e.target.value) })}
              />
            </div>

            {/* Publishing Checkbox */}
            <div className="md:col-span-2 flex items-center justify-between p-4 bg-base-200/50 rounded-2xl border border-base-300">
              <div>
                <p className="text-sm font-bold text-base-content">Publish Immediately</p>
                <p className="text-[10px] text-base-content/50 font-semibold">Make this course visible to students immediately upon creation</p>
              </div>
              <input 
                type="checkbox" 
                className="toggle toggle-primary"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              />
            </div>

          </div>

          {/* Form Actions */}
          <div className="pt-4 flex justify-end gap-3 border-t border-base-200">
            <Link href={`/${locale}/instructor/dashboard`} className="btn btn-ghost rounded-xl font-bold px-6">
              Cancel
            </Link>
            <button 
              type="submit" 
              className="btn btn-primary rounded-xl font-bold px-8 flex items-center gap-2"
              disabled={isSaving || isUploading}
            >
              <Save className="w-4 h-4" /> {isSaving ? 'Creating...' : 'Create Course'}
            </button>
          </div>

        </form>

      </main>
    </div>
  );
}
