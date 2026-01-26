import { useState, useCallback } from 'react';
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

export const useResumableUpload = (options: UseResumableUploadOptions) => {
  const { bucket, onProgress, onError, onSuccess } = options;
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({ loaded: 0, total: 0, percentage: 0 });

  const upload = useCallback(async (file: File, filePath: string): Promise<{ path: string; publicUrl: string } | null> => {
    setUploading(true);
    setProgress({ loaded: 0, total: file.size, percentage: 0 });

    try {
      // Para arquivos menores que 6MB, usar upload padrão
      if (file.size < 6 * 1024 * 1024) {
        const { error } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        setProgress({ loaded: file.size, total: file.size, percentage: 100 });
        onSuccess?.(filePath, publicUrl);
        return { path: filePath, publicUrl };
      }

      // Para arquivos maiores, usar upload em chunks com XMLHttpRequest
      // O Supabase SDK não expõe progresso diretamente, então vamos usar o método resumable

      const CHUNK_SIZE = 6 * 1024 * 1024; // 6MB chunks
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      let uploadedBytes = 0;

      // Primeiro, tentar criar o upload
      const { data: sessionData, error: sessionError } = await supabase.storage
        .from(bucket)
        .createSignedUploadUrl(filePath);

      if (sessionError) {
        // Se não suportar signed upload, usar método alternativo com chunks menores
        // Fazemos upload direto com monitoramento de progresso via fetch
        const formData = new FormData();
        formData.append('', file);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Usuário não autenticado');

        const response = await new Promise<Response>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const progressData = {
                loaded: e.loaded,
                total: e.total,
                percentage: Math.round((e.loaded / e.total) * 100)
              };
              setProgress(progressData);
              onProgress?.(progressData);
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(new Response(xhr.responseText, { status: xhr.status }));
            } else {
              reject(new Error(xhr.responseText || 'Upload failed'));
            }
          });

          xhr.addEventListener('error', () => reject(new Error('Network error')));
          xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

          const supabaseUrl = 'https://hpycamgntrltmptgssae.supabase.co';
          xhr.open('POST', `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`);
          xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
          xhr.setRequestHeader('x-upsert', 'false');
          xhr.send(file);
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText);
        }

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        setProgress({ loaded: file.size, total: file.size, percentage: 100 });
        onSuccess?.(filePath, publicUrl);
        return { path: filePath, publicUrl };
      }

      // Usar signed URL para upload
      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progressData = {
              loaded: e.loaded,
              total: e.total,
              percentage: Math.round((e.loaded / e.total) * 100)
            };
            setProgress(progressData);
            onProgress?.(progressData);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(new Response(xhr.responseText, { status: xhr.status }));
          } else {
            reject(new Error(xhr.responseText || 'Upload failed'));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Network error')));
        xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

        xhr.open('PUT', sessionData.signedUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setProgress({ loaded: file.size, total: file.size, percentage: 100 });
      onSuccess?.(filePath, publicUrl);
      return { path: filePath, publicUrl };

    } catch (error: any) {
      console.error('Upload error:', error);
      onError?.(error);
      return null;
    } finally {
      setUploading(false);
    }
  }, [bucket, onProgress, onError, onSuccess]);

  const reset = useCallback(() => {
    setProgress({ loaded: 0, total: 0, percentage: 0 });
    setUploading(false);
  }, []);

  return {
    upload,
    uploading,
    progress,
    reset
  };
};
