/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import { generateEditedImage, generateFilteredImage, generateAdjustedImage, generateFaceSwapImage, generateAiEditImage } from './services/geminiService';
import Header from './components/Header';
import Spinner from './components/Spinner';
import FilterPanel from './components/FilterPanel';
import AdjustmentPanel from './components/AdjustmentPanel';
import AiEditPanel from './components/AiEditPanel';
import FaceSwapPanel from './components/FaceSwapPanel';
import CropPanel from './components/CropPanel';
import ResizePanel from './components/ResizePanel';
import ColorAdjustmentPanel from './components/ColorAdjustmentPanel';
import ComparisonSlider from './components/ComparisonSlider';
import { UndoIcon, RedoIcon, CompareIcon, RotateIcon, WarningIcon, CloseIcon } from './components/icons';
import StartScreen from './components/StartScreen';

// Helper to convert a data URL string to a File object
const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

// --- Error Toast Component ---
interface ErrorToastProps {
  message: string;
  onDismiss: () => void;
}

const ErrorToast: React.FC<ErrorToastProps> = ({ message, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 w-full max-w-md p-4 z-50 animate-toast-in">
      <div className="flex items-start p-4 rounded-lg bg-red-900/80 border border-red-500/50 backdrop-blur-md shadow-2xl shadow-red-500/20">
        <div className="flex-shrink-0">
          <WarningIcon className="w-6 h-6 text-red-300" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-red-200">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={onDismiss}
            className="inline-flex text-red-300 rounded-md hover:bg-red-500/20 p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-900 focus:ring-red-500"
            aria-label="Dismiss"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};


type Tab = 'retouch' | 'ai_edit' | 'faceswap' | 'adjust' | 'filters' | 'crop' | 'resize' | 'color';

const tabDisplayNames: Record<Tab, string> = {
  retouch: 'รีทัช',
  ai_edit: 'แก้ไข AI',
  faceswap: 'สลับใบหน้า',
  adjust: 'ปรับแต่ง',
  filters: 'ฟิลเตอร์',
  crop: 'ตัดภาพ',
  resize: 'ปรับขนาด',
  color: 'ปรับสี',
};

const App: React.FC = () => {
  const [history, setHistory] = useState<File[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUiReady, setIsUiReady] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editHotspot, setEditHotspot] = useState<{ x: number, y: number } | null>(null);
  const [displayHotspot, setDisplayHotspot] = useState<{ x: number, y: number } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('retouch');
  const [secondaryImage, setSecondaryImage] = useState<File | null>(null);
  
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>();
  const [isComparingModeActive, setIsComparingModeActive] = useState<boolean>(false);
  const [imageDimensions, setImageDimensions] = useState<{width: number, height: number} | null>(null);
  const [colorAdjustments, setColorAdjustments] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
  });
  const imgRef = useRef<HTMLImageElement>(null);

  const currentImage = history[historyIndex] ?? null;
  const originalImage = history[0] ?? null;

  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);


  // Effect to create and revoke object URLs safely for the current image
  useEffect(() => {
    if (currentImage) {
      const url = URL.createObjectURL(currentImage);
      setCurrentImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCurrentImageUrl(null);
    }
  }, [currentImage]);
  
  // Effect to create and revoke object URLs safely for the original image
  useEffect(() => {
    if (originalImage) {
      const url = URL.createObjectURL(originalImage);
      setOriginalImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setOriginalImageUrl(null);
    }
  }, [originalImage]);

  // Effect to manage UI readiness after an image change, giving animations time to complete
  useEffect(() => {
    if (currentImage) {
        const timer = setTimeout(() => {
            setIsUiReady(true);
        }, 500); // Corresponds with animation durations

        return () => clearTimeout(timer);
    }
  }, [currentImage]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  
  const resetTransientStates = useCallback(() => {
    setEditHotspot(null);
    setDisplayHotspot(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setSecondaryImage(null);
    setColorAdjustments({ brightness: 100, contrast: 100, saturation: 100 });
    setIsComparingModeActive(false);
  }, []);

  const addImageToHistory = useCallback((newImageFile: File) => {
    setIsUiReady(false);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newImageFile);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    // Reset transient states after an action
    setCrop(undefined);
    setCompletedCrop(undefined);
    setSecondaryImage(null);
    setColorAdjustments({ brightness: 100, contrast: 100, saturation: 100 });
    setIsComparingModeActive(false);
  }, [history, historyIndex]);
  
  const handleUndo = useCallback(() => {
    if (canUndo) {
      setIsUiReady(false);
      setHistoryIndex(historyIndex - 1);
      resetTransientStates();
    }
  }, [canUndo, historyIndex, resetTransientStates]);
  
  const handleRedo = useCallback(() => {
    if (canRedo) {
      setIsUiReady(false);
      setHistoryIndex(historyIndex + 1);
      resetTransientStates();
    }
  }, [canRedo, historyIndex, resetTransientStates]);

  // Effect for Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        // Don't trigger shortcuts if user is typing in an input field
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            return;
        }

        if (event.metaKey || event.ctrlKey) {
            let handled = false;
            if (event.key.toLowerCase() === 'z') {
                handleUndo();
                handled = true;
            } else if (event.key.toLowerCase() === 'y') {
                handleRedo();
                handled = true;
            }

            if (handled) {
                event.preventDefault();
            }
        }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleUndo, handleRedo]);

  const handleImageUpload = useCallback((file: File) => {
    setIsUiReady(false);
    setError(null);
    setHistory([file]);
    setHistoryIndex(0);
    setActiveTab('retouch');
    resetTransientStates();
  }, [resetTransientStates]);
  
  const handleTabChange = (tab: Tab) => {
    setIsComparingModeActive(false);
    setActiveTab(tab);
  };

  const handleGenerate = useCallback(async () => {
    if (!currentImage) {
      setError('ยังไม่ได้โหลดรูปภาพเพื่อแก้ไข');
      return;
    }
    
    if (!prompt.trim()) {
        setError('กรุณาใส่คำอธิบายการแก้ไขของคุณ');
        return;
    }

    if (!editHotspot) {
        setError('กรุณาคลิกบนภาพเพื่อเลือกพื้นที่ที่ต้องการแก้ไข');
        return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
        const editedImageUrl = await generateEditedImage(currentImage, prompt, editHotspot);
        const newImageFile = dataURLtoFile(editedImageUrl, `edited-${Date.now()}.png`);
        addImageToHistory(newImageFile);
        setEditHotspot(null);
        setDisplayHotspot(null);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`สร้างรูปภาพไม่สำเร็จ ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, prompt, editHotspot, addImageToHistory]);
  
  const handleApplyFilter = useCallback(async (filterPrompt: string) => {
    if (!currentImage) {
      setError('ยังไม่ได้โหลดรูปภาพเพื่อใช้ฟิลเตอร์');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
        const filteredImageUrl = await generateFilteredImage(currentImage, filterPrompt);
        const newImageFile = dataURLtoFile(filteredImageUrl, `filtered-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`ใช้ฟิลเตอร์ไม่สำเร็จ ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);

  const applyCanvasFilter = useCallback(async (filter: 'grayscale' | 'sepia') => {
    if (!currentImage) {
      setError('ยังไม่ได้โหลดรูปภาพเพื่อใช้ฟิลเตอร์');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
        const image = new Image();
        image.src = URL.createObjectURL(currentImage);
        await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = reject;
        });
        URL.revokeObjectURL(image.src);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Cannot create canvas context");

        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        ctx.drawImage(image, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            if (filter === 'grayscale') {
                const gray = (r + g + b) / 3;
                data[i] = gray;
                data[i + 1] = gray;
                data[i + 2] = gray;
            } else if (filter === 'sepia') {
                const sepiaR = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                const sepiaG = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                const sepiaB = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
                data[i] = sepiaR;
                data[i + 1] = sepiaG;
                data[i + 2] = sepiaB;
            }
        }
        ctx.putImageData(imageData, 0, 0);

        const filteredImageUrl = canvas.toDataURL('image/png');
        const newImageFile = dataURLtoFile(filteredImageUrl, `filtered-${filter}-${Date.now()}.png`);
        addImageToHistory(newImageFile);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`ใช้ฟิลเตอร์ไม่สำเร็จ ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
}, [currentImage, addImageToHistory]);

  const handleRotate = useCallback(async () => {
    if (!currentImage) {
      setError('ยังไม่ได้โหลดรูปภาพเพื่อหมุน');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
        const image = new Image();
        image.src = URL.createObjectURL(currentImage);
        await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = reject;
        });
        URL.revokeObjectURL(image.src);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Cannot create canvas context");
        
        canvas.width = image.naturalHeight;
        canvas.height = image.naturalWidth;

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(90 * Math.PI / 180);
        ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
        
        const rotatedImageUrl = canvas.toDataURL('image/png');
        const newImageFile = dataURLtoFile(rotatedImageUrl, `rotated-${Date.now()}.png`);
        addImageToHistory(newImageFile);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`หมุนภาพไม่สำเร็จ: ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
}, [currentImage, addImageToHistory]);
  
  const handleApplyAdjustment = useCallback(async (adjustmentPrompt: string) => {
    if (!currentImage) {
      setError('ยังไม่ได้โหลดรูปภาพเพื่อปรับแต่ง');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
        const adjustedImageUrl = await generateAdjustedImage(currentImage, adjustmentPrompt, secondaryImage);
        const newImageFile = dataURLtoFile(adjustedImageUrl, `adjusted-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`ปรับแต่งไม่สำเร็จ ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory, secondaryImage]);

  const handleApplyAiEdit = useCallback(async (editPrompt: string) => {
    if (!currentImage) {
      setError('ยังไม่ได้โหลดรูปภาพเพื่อแก้ไข');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
        const editedImageUrl = await generateAiEditImage(currentImage, editPrompt);
        const newImageFile = dataURLtoFile(editedImageUrl, `ai-edited-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`แก้ไขภาพด้วย AI ไม่สำเร็จ: ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);

  const handleApplyFaceSwap = useCallback(async () => {
    if (!currentImage || !secondaryImage) {
      setError('กรุณาอัปโหลดทั้งภาพต้นฉบับและภาพเป้าหมายเพื่อทำการสลับใบหน้า');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const swappedImageUrl = await generateFaceSwapImage(currentImage, secondaryImage);
      const newImageFile = dataURLtoFile(swappedImageUrl, `faceswap-${Date.now()}.png`);
      addImageToHistory(newImageFile);
    } catch (err)
 {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`สลับใบหน้าไม่สำเร็จ ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentImage, secondaryImage, addImageToHistory]);

  const handleApplyCrop = useCallback(() => {
    if (!completedCrop || !imgRef.current) {
        setError('กรุณาเลือกพื้นที่ที่จะตัด');
        return;
    }

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        setError('ไม่สามารถประมวลผลการตัดภาพได้');
        return;
    }

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = completedCrop.width * pixelRatio;
    canvas.height = completedCrop.height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height,
    );
    
    const croppedImageUrl = canvas.toDataURL('image/png');
    const newImageFile = dataURLtoFile(croppedImageUrl, `cropped-${Date.now()}.png`);
    addImageToHistory(newImageFile);

  }, [completedCrop, addImageToHistory]);

  const handleApplyResize = useCallback(async (width: number, height: number) => {
    if (!currentImage) {
      setError('ยังไม่ได้โหลดรูปภาพเพื่อปรับขนาด');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
        const image = new Image();
        image.src = URL.createObjectURL(currentImage);
        await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = reject;
        });
        URL.revokeObjectURL(image.src);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Cannot create canvas context");
        
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(image, 0, 0, width, height);
        
        const resizedImageUrl = canvas.toDataURL('image/png');
        const newImageFile = dataURLtoFile(resizedImageUrl, `resized-${Date.now()}.png`);
        addImageToHistory(newImageFile);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`ปรับขนาดภาพไม่สำเร็จ: ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);
  
  const handleApplyColorAdjustments = useCallback(async () => {
    if (!currentImage) {
      setError('No image loaded to adjust.');
      return;
    }
  
    const { brightness, contrast, saturation } = colorAdjustments;
    if (brightness === 100 && contrast === 100 && saturation === 100) {
      return; // No change to apply
    }
  
    setIsLoading(true);
    setError(null);
  
    try {
      const image = new Image();
      image.src = URL.createObjectURL(currentImage);
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });
      URL.revokeObjectURL(image.src);
  
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Cannot create canvas context");
  
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
  
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      ctx.drawImage(image, 0, 0);
  
      const adjustedDataUrl = canvas.toDataURL('image/png');
      const newImageFile = dataURLtoFile(adjustedDataUrl, `color-adjusted-${Date.now()}.png`);
      addImageToHistory(newImageFile);
  
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to apply color adjustments: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentImage, colorAdjustments, addImageToHistory]);

  const handleReset = useCallback(() => {
    if (history.length > 0) {
      setIsUiReady(false);
      setHistoryIndex(0);
      setError(null);
      resetTransientStates();
    }
  }, [history, resetTransientStates]);

  const handleUploadNew = useCallback(() => {
      setHistory([]);
      setHistoryIndex(-1);
      setError(null);
      setPrompt('');
      resetTransientStates();
  }, [resetTransientStates]);

  const handleDownload = useCallback(() => {
      if (currentImage) {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(currentImage);
          link.download = `edited-${currentImage.name}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
      }
  }, [currentImage]);
  
  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      handleImageUpload(files[0]);
    }
  };
  
  const handleSecondaryImageUpload = useCallback((file: File) => {
    setSecondaryImage(file);
  }, []);
  
  const handleClearSecondaryImage = useCallback(() => {
      setSecondaryImage(null);
  }, []);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (activeTab !== 'retouch' || !isUiReady) return;
    
    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();

    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    setDisplayHotspot({ x: offsetX, y: offsetY });

    const { naturalWidth, naturalHeight, clientWidth, clientHeight } = img;
    const scaleX = naturalWidth / clientWidth;
    const scaleY = naturalHeight / clientHeight;

    const originalX = Math.round(offsetX * scaleX);
    const originalY = Math.round(offsetY * scaleY);

    setEditHotspot({ x: originalX, y: originalY });
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setImageDimensions({ width: naturalWidth, height: naturalHeight });
  };

  const getFilterStyle = () => {
    if (activeTab !== 'color' || isComparingModeActive) return {};
    const { brightness, contrast, saturation } = colorAdjustments;
    if (brightness === 100 && contrast === 100 && saturation === 100) {
        return {};
    }
    return {
        filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
    };
  };

  const renderContent = () => {
    if (!currentImageUrl) {
      return <StartScreen onFileSelect={handleFileSelect} />;
    }

    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6 animate-fade-in">
        <div className="relative w-full shadow-2xl rounded-xl overflow-hidden bg-black/20">
            {/* Global Spinner */}
            {isLoading && activeTab !== 'retouch' && (
                <div className="absolute inset-0 bg-black/70 z-30 flex flex-col items-center justify-center gap-4 animate-fade-in">
                    <Spinner />
                    <p className="text-gray-300">AI กำลังใช้เวทมนตร์...</p>
                </div>
            )}

            {isComparingModeActive && originalImageUrl && currentImageUrl ? (
                <ComparisonSlider 
                    originalImageUrl={originalImageUrl} 
                    editedImageUrl={currentImageUrl}
                />
            ) : (
                <>
                    {activeTab === 'crop' ? (
                        <ReactCrop 
                            crop={crop} 
                            onChange={c => setCrop(c)} 
                            onComplete={c => setCompletedCrop(c)}
                            aspect={aspect}
                            className="max-h-[60vh]"
                        >
                            <img 
                                ref={imgRef}
                                key={`crop-${currentImageUrl}`}
                                src={currentImageUrl} 
                                alt="Crop this image"
                                onLoad={handleImageLoad}
                                className="w-full h-auto object-contain max-h-[60vh] rounded-xl animate-image-load"
                            />
                        </ReactCrop>
                    ) : (
                        <img
                            ref={imgRef}
                            key={currentImageUrl}
                            src={currentImageUrl}
                            alt="Current"
                            onLoad={handleImageLoad}
                            onClick={handleImageClick}
                            style={getFilterStyle()}
                            className={`w-full h-auto object-contain max-h-[60vh] rounded-xl animate-image-load ${activeTab === 'retouch' ? 'cursor-crosshair transition-transform duration-300 ease-out hover:scale-[1.02]' : ''} ${isLoading && activeTab === 'retouch' ? 'opacity-50 transition-opacity duration-300' : ''}`}
                        />
                    )}
                </>
            )}

            {/* Localized Spinner for Retouch */}
            {isLoading && activeTab === 'retouch' && displayHotspot && (
                <div
                    className="absolute z-20 flex items-center justify-center"
                    style={{ left: `${displayHotspot.x}px`, top: `${displayHotspot.y}px`, transform: 'translate(-50%, -50%)' }}
                >
                    <Spinner className="h-10 w-10 text-blue-400" />
                </div>
            )}

            {/* Hotspot Marker */}
            {activeTab === 'retouch' && displayHotspot && !isLoading && (
                <div
                    className="absolute w-6 h-6 border-2 border-blue-400 rounded-full bg-blue-500/30 shadow-lg animate-hotspot-pop pointer-events-none"
                    style={{
                        left: `${displayHotspot.x}px`,
                        top: `${displayHotspot.y}px`,
                    }}
                />
            )}
        </div>

        <div className={`w-full max-w-2xl flex flex-col gap-4 transition-opacity duration-300 ${isUiReady ? 'opacity-100' : 'opacity-60'}`}>
            <div className="flex items-center gap-4">
                <button
                    onClick={handleUndo}
                    disabled={!canUndo || isLoading || !isUiReady}
                    className="group flex items-center gap-2 bg-white/10 text-gray-200 font-semibold py-2 px-4 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    aria-label="ย้อนกลับ"
                    title="ย้อนกลับ (Ctrl+Z)"
                >
                    <UndoIcon className="w-5 h-5 transition-transform duration-150 ease-in-out group-active:scale-90" />
                    ย้อนกลับ
                </button>
                <button
                    onClick={handleRedo}
                    disabled={!canRedo || isLoading || !isUiReady}
                    className="group flex items-center gap-2 bg-white/10 text-gray-200 font-semibold py-2 px-4 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    aria-label="ทำซ้ำ"
                    title="ทำซ้ำ (Ctrl+Y)"
                >
                    <RedoIcon className="w-5 h-5 transition-transform duration-150 ease-in-out group-active:scale-90" />
                    ทำซ้ำ
                </button>
                <div className="flex-grow" />
                
                <button
                    onClick={handleRotate}
                    disabled={isLoading || !isUiReady}
                    className="flex items-center gap-2 bg-white/10 text-gray-200 font-semibold py-2 px-4 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="หมุนภาพ"
                    title="หมุน 90°"
                >
                    <RotateIcon className="w-5 h-5" />
                </button>
                
                <button
                    onClick={() => setIsComparingModeActive(prev => !prev)}
                    disabled={isLoading || history.length < 2 || !isUiReady}
                    className={`flex items-center gap-2 text-gray-200 font-semibold py-2 px-4 rounded-md transition-all duration-200 ease-in-out active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${isComparingModeActive ? 'bg-blue-600 text-white' : 'bg-white/10 hover:bg-white/20'}`}
                    aria-label="เปรียบเทียบกับต้นฉบับ"
                    title="เปรียบเทียบ"
                >
                    <CompareIcon className="w-5 h-5" />
                </button>
            </div>
            
            <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-2 flex flex-wrap items-center justify-center gap-2 backdrop-blur-sm">
                {(Object.keys(tabDisplayNames) as Tab[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => handleTabChange(tab)}
                        disabled={isLoading || !isUiReady}
                        className={`px-4 py-2 rounded-md text-base font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 ${
                            activeTab === tab 
                            ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20' 
                            : 'bg-transparent hover:bg-white/10 text-gray-300'
                        }`}
                    >
                        {tabDisplayNames[tab]}
                    </button>
                ))}
            </div>

            <div className="w-full">
                {activeTab === 'retouch' && (
                    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col gap-4 animate-tool-panel backdrop-blur-sm">
                        <h3 className="text-lg font-semibold text-center text-gray-300">รีทัชภาพ</h3>
                        <p className="text-sm text-center text-gray-400 -mt-2">คลิกบนภาพเพื่อเลือกจุด จากนั้นอธิบายสิ่งที่คุณต้องการแก้ไข</p>
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="เช่น 'ลบคนนี้ออก' หรือ 'เปลี่ยนสีดอกไม้เป็นสีแดง'"
                            className="w-full bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition disabled:cursor-not-allowed disabled:opacity-60 text-base"
                            disabled={isLoading || !isUiReady}
                        />
                        <button
                            onClick={handleGenerate}
                            className="w-full bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
                            disabled={isLoading || !prompt.trim() || !editHotspot || !isUiReady}
                        >
                            สร้าง
                        </button>
                    </div>
                )}
                {activeTab === 'ai_edit' && <AiEditPanel onApplyAiEdit={handleApplyAiEdit} isLoading={isLoading || !isUiReady} />}
                {activeTab === 'faceswap' && <FaceSwapPanel onApplyFaceSwap={handleApplyFaceSwap} isLoading={isLoading || !isUiReady} secondaryImage={secondaryImage} onSecondaryImageUpload={handleSecondaryImageUpload} onClearSecondaryImage={handleClearSecondaryImage} />}
                {activeTab === 'adjust' && <AdjustmentPanel onApplyAdjustment={handleApplyAdjustment} isLoading={isLoading || !isUiReady} secondaryImage={secondaryImage} onSecondaryImageUpload={handleSecondaryImageUpload} onClearSecondaryImage={handleClearSecondaryImage} />}
                {activeTab === 'filters' && <FilterPanel onApplyFilter={handleApplyFilter} onApplyClientFilter={applyCanvasFilter} isLoading={isLoading || !isUiReady} />}
                {activeTab === 'crop' && <CropPanel onApplyCrop={handleApplyCrop} onSetAspect={setAspect} isLoading={isLoading || !isUiReady} isCropping={!!completedCrop} />}
                {activeTab === 'resize' && imageDimensions && <ResizePanel onApplyResize={handleApplyResize} isLoading={isLoading || !isUiReady} originalWidth={imageDimensions.width} originalHeight={imageDimensions.height} />}
                {activeTab === 'color' && <ColorAdjustmentPanel adjustments={colorAdjustments} onAdjustmentChange={setColorAdjustments} onApply={handleApplyColorAdjustments} isLoading={isLoading || !isUiReady} />}
            </div>
            
            <div className="flex items-center justify-center gap-4 mt-4">
                <button
                    onClick={handleReset}
                    disabled={history.length <= 1 || isLoading || !isUiReady}
                    className="text-sm font-semibold text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    รีเซ็ตทั้งหมด
                </button>
                <button
                    onClick={handleUploadNew}
                    disabled={isLoading}
                    className="text-sm font-semibold text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                >
                    อัปโหลดภาพใหม่
                </button>
                <button
                    onClick={handleDownload}
                    disabled={isLoading || !currentImage}
                    className="text-base font-bold text-green-300 bg-green-500/10 hover:bg-green-500/20 py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    ดาวน์โหลด
                </button>
            </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col items-center p-4 md:p-6">
      <Header />
      <main className="w-full flex-grow flex items-center justify-center">
        {renderContent()}
      </main>
      {error && <ErrorToast message={error} onDismiss={() => setError(null)} />}
    </div>
  );
};

export default App;
