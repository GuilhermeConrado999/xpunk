import { useState, useCallback, useRef } from 'react';
import { uploadToR2WithProgress } from '@/lib/r2-upload';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UseResumableUploadOptions {
  bucket: string;
  onProgress?: (progress: UploadProgress) => void;
  onError?: (error: Error) => void;
  onSuccess?: (path: string, publicUrl: string) => void;
}

export const useResumableUpload = (options: UseResumableUploadOptions) => {
  const { bucket, onProgress, onError, onSuccess } = options;
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({ loaded: 0, total: 0, percentage: 0 });
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const upload = useCallback(async (file: File, filePath: string): Promise<{ path: string; publicUrl: string } | null> => {
    setUploading(true);
    setProgress({ loaded: 0, total: file.size, percentage: 0 });

    try {
      const result = await uploadToR2WithProgress(
        file,
        filePath,
        bucket,
        (loaded, total) => {
          const progressData = {
            loaded,
            total,
            percentage: Math.round((loaded / total) * 100)
          };
          setProgress(progressData);
          onProgress?.(progressData);
        }
      );

      setProgress({ loaded: file.size, total: file.size, percentage: 100 });
      setUploading(false);
      onSuccess?.(filePath, result.publicUrl);
      return { path: filePath, publicUrl: result.publicUrl };
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploading(false);
      onError?.(error);
      return null;
    }
  }, [bucket, onProgress, onError, onSuccess]);

  const abort = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort();
    }
    setUploading(false);
    setProgress({ loaded: 0, total: 0, percentage: 0 });
  }, []);

  const reset = useCallback(() => {
    setProgress({ loaded: 0, total: 0, percentage: 0 });
    setUploading(false);
  }, []);

  return {
    upload,
    uploading,
    progress,
    reset,
    abort
  };
};
