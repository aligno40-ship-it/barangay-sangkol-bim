import React, { useState, useRef, useEffect } from 'react';
import { useBarangay } from '../context/BarangayContext';
import { SystemUser } from '../types';
import {
  compressImageFile,
  captureVideoFrame,
  AVATAR_PRESETS,
} from '../utils/imageUtils';
import {
  Camera,
  Upload,
  Trash2,
  Image as ImageIcon,
  Check,
  X,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Shield,
  CheckCircle2,
  VideoOff,
  User,
} from 'lucide-react';

interface UserProfilePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: SystemUser;
  title?: string;
  subtitle?: string;
  userName?: string;
  userRole?: string;
  initialAvatar?: string;
  onSaveAvatar?: (avatarDataUrl: string) => void;
}

export const UserProfilePhotoModal: React.FC<UserProfilePhotoModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  title,
  subtitle,
  userName,
  userRole,
  initialAvatar,
  onSaveAvatar,
}) => {
  const { currentUser, updateUser } = useBarangay();

  const activeUser = targetUser || currentUser;
  const effectiveName = userName || activeUser.name;
  const effectiveRole = userRole || activeUser.role;
  const effectiveInitialAvatar = initialAvatar !== undefined ? initialAvatar : (activeUser.avatar || '');

  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'presets'>('upload');
  const [previewUrl, setPreviewUrl] = useState<string>(effectiveInitialAvatar);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Camera State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Synchronize initial avatar when opened
  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(effectiveInitialAvatar);
      setErrorMessage(null);
      setSuccessMessage(null);
    } else {
      stopCamera();
    }
  }, [isOpen, effectiveInitialAvatar]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera capture is not supported on this browser or device.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        'Unable to access camera. Please allow camera permissions or use the file upload option.'
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleTabChange = (tab: 'upload' | 'camera' | 'presets') => {
    setActiveTab(tab);
    setErrorMessage(null);
    if (tab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
  };

  // Handle File Processing
  const processFile = async (file: File) => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select a valid image file (JPG, PNG, WebP, GIF).');
        setIsLoading(false);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('Image size is too large (max 10MB). Please select a smaller photo.');
        setIsLoading(false);
        return;
      }

      const compressed = await compressImageFile(file, 400, 0.88);
      setPreviewUrl(compressed);
      setIsLoading(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process image file.');
      setIsLoading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const captured = captureVideoFrame(videoRef.current, 400);
    if (captured) {
      setPreviewUrl(captured);
      stopCamera();
      setActiveTab('upload');
    }
  };

  const handleSelectPreset = (url: string) => {
    setPreviewUrl(url);
    setErrorMessage(null);
  };

  const handleRemovePhoto = () => {
    setPreviewUrl('');
    setErrorMessage(null);
  };

  const handleSave = () => {
    setIsLoading(true);
    try {
      if (onSaveAvatar) {
        onSaveAvatar(previewUrl);
      } else {
        updateUser(activeUser.id, { avatar: previewUrl });
      }

      setSuccessMessage('Profile picture updated successfully!');
      setTimeout(() => {
        setIsLoading(false);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage('Failed to save profile picture: ' + err.message);
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 z-10 animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {title || (targetUser && targetUser.id !== currentUser.id ? `Profile Photo: ${effectiveName}` : 'Profile Picture')}
              </h3>
              <p className="text-xs text-slate-500">
                {subtitle || 'Upload a personal photo, take a snapshot, or pick a verified avatar.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-700 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Main Content: Avatar Preview & Methods */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* Left Column: Live Previews in Different Contexts (Header, Sidebar, Full) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Photo Preview
            </p>

            {/* Circular Large Preview */}
            <div className="relative group">
              <div className="w-28 h-28 rounded-full ring-4 ring-white shadow-md overflow-hidden bg-slate-800 flex items-center justify-center">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={effectiveName}
                    className="w-full h-full object-cover"
                    onError={() => setPreviewUrl('')}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white font-black text-3xl bg-gradient-to-tr from-indigo-700 to-indigo-500">
                    {effectiveName.charAt(0)}
                  </div>
                )}
              </div>

              {previewUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute -top-1 -right-1 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-md transition-transform hover:scale-110 cursor-pointer"
                  title="Remove Profile Photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* User Info Capsule */}
            <div className="text-center w-full">
              <p className="text-xs font-bold text-slate-900 truncate">{effectiveName}</p>
              {targetUser?.username && <p className="text-[10px] text-slate-500 font-mono truncate">@{targetUser.username}</p>}
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                <Shield className="w-2.5 h-2.5" />
                <span>{effectiveRole}</span>
              </span>
            </div>

            {/* Context Badge Simulations */}
            <div className="w-full pt-2 border-t border-slate-200/60 space-y-2">
              <p className="text-[10px] font-semibold text-slate-400 text-center uppercase">
                Display Simulations
              </p>
              
              {/* Header pill simulation */}
              <div className="p-2 bg-slate-900 rounded-xl flex items-center gap-2 text-white">
                <div className="w-6 h-6 rounded-full overflow-hidden bg-emerald-700 shrink-0 flex items-center justify-center text-[10px] font-bold">
                  {previewUrl ? (
                    <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    effectiveName.charAt(0)
                  )}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-[10px] font-bold text-white truncate leading-tight">{effectiveName}</p>
                  <p className="text-[8px] text-emerald-400 truncate leading-tight">Card / Badge</p>
                </div>
              </div>

              {/* Sidebar simulation */}
              <div className="p-2 bg-white border border-slate-200 rounded-xl flex items-center gap-2">
                <div className="w-6 h-6 rounded-full overflow-hidden bg-indigo-600 shrink-0 flex items-center justify-center text-white text-[10px] font-bold">
                  {previewUrl ? (
                    <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    effectiveName.charAt(0)
                  )}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-[10px] font-bold text-slate-900 truncate leading-tight">{effectiveName}</p>
                  <p className="text-[8px] text-slate-500 truncate leading-tight">Registry Profile</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Upload / Camera / Presets Tabs */}
          <div className="md:col-span-7 space-y-4">
            {/* Tabs Selector */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => handleTabChange('upload')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('camera')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'camera'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Webcam</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('presets')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'presets'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gallery</span>
              </button>
            </div>

            {/* TAB 1: FILE UPLOAD */}
            {activeTab === 'upload' && (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                  className="hidden"
                />

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50/70 scale-98'
                      : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/30'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100/70 text-indigo-600 flex items-center justify-center shadow-xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Click to choose image or drag & drop here
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Supports JPG, PNG, WebP or GIF (Auto-cropped to square)
                    </p>
                  </div>
                  <span className="mt-1 px-3 py-1 bg-white border border-slate-200 text-indigo-600 rounded-xl text-[11px] font-bold shadow-2xs hover:bg-indigo-50">
                    Browse Device Files
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Images are automatically compressed to ensure lightning-fast system loading.</span>
                </div>
              </div>
            )}

            {/* TAB 2: LIVE CAMERA / WEBCAM */}
            {activeTab === 'camera' && (
              <div className="space-y-3">
                {cameraError ? (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-2">
                    <VideoOff className="w-8 h-8 text-rose-500 mx-auto" />
                    <p className="text-xs font-bold text-rose-800">{cameraError}</p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 cursor-pointer"
                    >
                      Retry Camera
                    </button>
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 aspect-4/3 flex items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />

                    {/* Circular viewfinder overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-40 h-40 rounded-full border-2 border-dashed border-white/80 shadow-2xl" />
                    </div>

                    <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2 z-10">
                      <button
                        type="button"
                        onClick={handleCapturePhoto}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold shadow-lg flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Capture Photo</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: AVATAR GALLERY */}
            {activeTab === 'presets' && (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-500">
                  Select a standardized official portrait or community avatar:
                </p>

                <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1">
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected = previewUrl === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset.url)}
                        className={`relative rounded-xl overflow-hidden border-2 p-1 text-center transition-all cursor-pointer flex flex-col items-center gap-1 group ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 scale-102 ring-2 ring-indigo-200'
                            : 'border-slate-200 hover:border-indigo-300 bg-white'
                        }`}
                        title={preset.description}
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200">
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-800 line-clamp-1 leading-tight">
                          {preset.name.split('/')[0]}
                        </span>
                        {isSelected && (
                          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleRemovePhoto}
            disabled={!previewUrl}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset to Initials</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all hover:shadow-md cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>Save Profile Photo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
