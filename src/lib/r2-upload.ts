import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = "https://hpycamgntrltmptgssae.supabase.co";

interface UploadResult {
    publicUrl: string;
}

/**
 * Upload a file to Cloudflare R2 via presigned URL.
 * Uses the Supabase Edge Function to generate the presigned URL securely.
 */
export async function uploadToR2(
    file: File,
    path: string,
    bucket: string
): Promise<UploadResult> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Usuário não autenticado');

    const fullPath = `${bucket}/${path}`;

    // Get presigned URL from Edge Function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-r2-url`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
            action: 'upload',
            path: fullPath,
            contentType: file.type,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao gerar URL de upload');
    }

    const { uploadUrl, publicUrl } = await response.json();

    // Upload directly to R2 via presigned URL
    const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': file.type,
        },
        body: file,
    });

    if (!uploadResponse.ok) {
        throw new Error(`Erro ao fazer upload para R2 (status ${uploadResponse.status})`);
    }

    return { publicUrl };
}

/**
 * Upload a file to R2 with progress tracking via XMLHttpRequest.
 * Useful for large files (videos).
 */
export async function uploadToR2WithProgress(
    file: File,
    path: string,
    bucket: string,
    onProgress?: (loaded: number, total: number) => void
): Promise<UploadResult> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Usuário não autenticado');

    const fullPath = `${bucket}/${path}`;

    // Get presigned URL from Edge Function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-r2-url`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
            action: 'upload',
            path: fullPath,
            contentType: file.type,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao gerar URL de upload');
    }

    const { uploadUrl, publicUrl } = await response.json();

    // Upload with XHR for progress tracking
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) {
                onProgress(e.loaded, e.total);
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve({ publicUrl });
            } else {
                reject(new Error(`Upload falhou com status ${xhr.status}`));
            }
        };

        xhr.onerror = () => reject(new Error('Erro de rede durante o upload'));
        xhr.ontimeout = () => reject(new Error('Timeout durante o upload'));

        xhr.send(file);
    });
}

/**
 * Delete a file from R2.
 */
export async function deleteFromR2(path: string, bucket: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Usuário não autenticado');

    const fullPath = `${bucket}/${path}`;

    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-r2-url`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
            action: 'delete',
            path: fullPath,
        }),
    });

    if (!response.ok) {
        console.error('Erro ao deletar arquivo do R2:', await response.text());
    }
}

/**
 * Extracts the relative file path from a storage URL.
 * Works with both old Supabase URLs and new R2 URLs.
 * 
 * Example:
 *   extractPathFromUrl('https://xxx.supabase.co/.../thumbnails/user/file.jpg', 'thumbnails')
 *   → 'user/file.jpg'
 */
export function extractPathFromUrl(url: string, bucket: string): string | null {
    const marker = `/${bucket}/`;
    const index = url.indexOf(marker);
    if (index === -1) return null;
    return url.substring(index + marker.length);
}
