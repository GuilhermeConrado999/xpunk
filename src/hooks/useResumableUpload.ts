import { useState, useCallback, useRef } from 'react';
import * as tus from 'tus-js-client';
import { supabase } from '@/integrations/supabase/client';

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

const SUPABASE_URL = 'https://hpycamgntrltmptgssae.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhweWNhbWdudHJsdG1wdGdzc2FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwOTA4MjMsImV4cCI6MjA3NDY2NjgyM30.XC9L-KvdnqslrvtnT1xGdcz3-dGmIiVIIsSQ0X4ahXU';

export const useResumableUpload = (options: UseResumableUploadOptions) => {
  const { bucket, onProgress, onError, onSuccess } = options;
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({ loaded: 0, total: 0, percentage: 0 });
  const uploadRef = useRef<tus.Upload | null>(null);

  const upload = useCallback(async (file: File, filePath: string): Promise<{ path: string; publicUrl: string } | null> => {
    setUploading(true);
    setProgress({ loaded: 0, total: file.size, percentage: 0 });

    try {
      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      return new Promise((resolve, reject) => {
        const tusUpload = new tus.Upload(file, {
          endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`,
          retryDelays: [0, 1000, 3000, 5000, 10000],
          chunkSize: 6 * 1024 * 1024, // 6MB chunks (Supabase recommended)
          headers: {
            authorization: `Bearer ${session.access_token}`,
            'x-upsert': 'false',
          },
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          metadata: {
            bucketName: bucket,
            objectName: filePath,
            contentType: file.type,
            cacheControl: '3600',
          },
          onError: (error) => {
            console.error('TUS Upload error:', error);
            setUploading(false);
            onError?.(error);
            reject(error);
          },
          onProgress: (bytesUploaded, bytesTotal) => {
            const progressData = {
              loaded: bytesUploaded,
              total: bytesTotal,
              percentage: Math.round((bytesUploaded / bytesTotal) * 100)
            };
            setProgress(progressData);
            onProgress?.(progressData);
          },
          onSuccess: () => {
            const { data: { publicUrl } } = supabase.storage
              .from(bucket)
              .getPublicUrl(filePath);

            setProgress({ loaded: file.size, total: file.size, percentage: 100 });
            setUploading(false);
            onSuccess?.(filePath, publicUrl);
            resolve({ path: filePath, publicUrl });
          },
        });

        uploadRef.current = tusUpload;

        // Check for previous uploads to resume
        tusUpload.findPreviousUploads().then((previousUploads) => {
          if (previousUploads.length > 0) {
            tusUpload.resumeFromPreviousUpload(previousUploads[0]);
          }
          tusUpload.start();
        });
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      setUploading(false);
      onError?.(error);
      return null;
    }
  }, [bucket, onProgress, onError, onSuccess]);

  const abort = useCallback(() => {
    if (uploadRef.current) {
      uploadRef.current.abort();
      setUploading(false);
      setProgress({ loaded: 0, total: 0, percentage: 0 });
    }
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
