import { useState, useCallback, useRef } from 'react';

// Compress image to max dimensions and quality before sending to API
function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.6) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], file.name || 'image.jpg', { type: 'image/jpeg' }));
        } else {
          resolve(file);
        }
      }, 'image/jpeg', quality);
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

export default function ImageUpload({ onAnalyze, isLoading }) {
    const [preview, setPreview] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [fileName, setFileName] = useState('');
    const [showCamera, setShowCamera] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const handleFile = useCallback(async (file) => {
        if (file && file.type.startsWith('image/')) {
            setFileName(file.name);
            // Compress before sending
            const compressed = await compressImage(file);
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target.result);
            reader.readAsDataURL(compressed);
            onAnalyze(compressed);
        }
    }, [onAnalyze]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files[0];
        handleFile(file);
    }, [handleFile]);

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = () => setDragActive(false);

    const handleInputChange = (e) => {
        const file = e.target.files[0];
        handleFile(file);
    };

    const clearImage = () => {
        setPreview(null);
        setFileName('');
    };

    // --- Camera functions ---
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
            });
            streamRef.current = stream;
            setShowCamera(true);
            // Wait for ref to be attached
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            }, 100);
        } catch (err) {
            console.error('Camera access denied:', err);
            alert('Unable to access camera. Please allow camera permissions.');
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        // Resize to max 800px for API
        const maxDim = 800;
        let w = video.videoWidth;
        let h = video.videoHeight;
        if (w > maxDim || h > maxDim) {
            const ratio = Math.min(maxDim / w, maxDim / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, w, h);

        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
                const url = URL.createObjectURL(blob);
                setPreview(url);
                setFileName('Camera Capture');
                stopCamera();
                onAnalyze(file);
            }
        }, 'image/jpeg', 0.6);
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setShowCamera(false);
    };

    return (
        <div className="animate-fade-in">
            {/* Camera View */}
            {showCamera && (
                <div className="space-y-4">
                    <div className="relative rounded-2xl overflow-hidden bg-black">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full max-h-80 object-cover"
                        />
                        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                            <div className="flex items-center justify-center gap-4">
                                <button
                                    onClick={stopCamera}
                                    className="bg-black/5 dark:bg-white/10 backdrop-blur-sm border border-dark-900/10 dark:border-white/20 text-dark-900 dark:text-white p-3 rounded-full
                           hover:bg-white/20 transition-all duration-200"
                                    id="cancel-camera-btn"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                                <button
                                    onClick={capturePhoto}
                                    className="bg-white text-black p-4 rounded-full hover:bg-gray-200 transition-all duration-200
                           shadow-lg shadow-white/20 hover:scale-105 active:scale-95"
                                    id="capture-photo-btn"
                                >
                                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </button>
                                <div className="w-11"></div> {/* Spacer for centering */}
                            </div>
                        </div>
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                </div>
            )}

            {/* Upload / Camera Chooser */}
            {!preview && !showCamera && (
                <div className="space-y-4">
                    {/* Drag and drop area */}
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer
              ${dragActive
                                ? 'border-primary-400 bg-primary-500/10 scale-[1.02]'
                                : 'border-white/20 hover:border-primary-500/50 hover:bg-white/5'
                            }`}
                    >
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={handleInputChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            id="image-upload-input"
                        />
                        <div className="space-y-3">
                            <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center transition-all duration-300
                ${dragActive ? 'bg-primary-500/20' : 'bg-white/5'}`}>
                                <svg className={`w-8 h-8 transition-colors ${dragActive ? 'text-primary-400' : 'text-dark-400'}`}
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-base font-medium text-dark-900 dark:text-white">
                                    {dragActive ? 'Drop your image here' : 'Upload food image'}
                                </p>
                                <p className="text-sm text-dark-400 mt-1">
                                    Drag & drop or click to browse
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* OR divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-white/10"></div>
                        <span className="text-xs text-dark-500 uppercase tracking-widest font-medium">or</span>
                        <div className="flex-1 h-px bg-white/10"></div>
                    </div>

                    {/* Camera button */}
                    <button
                        onClick={startCamera}
                        className="w-full btn-secondary flex items-center justify-center gap-3 py-4"
                        id="open-camera-btn"
                    >
                        <svg className="w-5 h-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-dark-900 dark:text-white font-medium">Take Photo with Camera</span>
                    </button>

                    <div className="flex items-center justify-center gap-4 text-xs text-dark-500">
                        <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                            JPEG, PNG, WebP, GIF
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-500"></span>
                            Max 10MB
                        </span>
                    </div>
                </div>
            )}

            {/* Image Preview */}
            {preview && !showCamera && (
                <div className="space-y-4">
                    <div className="relative group rounded-2xl overflow-hidden">
                        <img
                            src={preview}
                            alt="Food preview"
                            className="w-full max-h-80 object-cover rounded-2xl"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                <span className="text-sm text-dark-700 dark:text-white/80 truncate">{fileName}</span>
                                <button
                                    onClick={clearImage}
                                    className="bg-red-500/80 hover:bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg 
                           transition-colors duration-200"
                                    id="clear-image-btn"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>

                    {isLoading && (
                        <div className="flex items-center justify-center gap-3 py-4">
                            <div className="spinner"></div>
                            <span className="text-primary-400 font-medium">Analyzing your food...</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
