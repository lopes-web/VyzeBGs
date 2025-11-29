
import { supabase } from './supabaseClient';

const compressImage = (base64Str: string, maxWidth = 2048, quality = 0.8): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Optional: Resize if extremely large, though 2K is usually fine.
            // Keeping original dimensions if possible, but capping at maxWidth for safety/size.
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error("Canvas context not available"));
                return;
            }

            // Draw white background for transparent PNGs converting to JPEG
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error("Compression failed"));
            }, 'image/jpeg', quality);
        };
        img.onerror = (err) => reject(err);
    });
};

export const uploadImageToStorage = async (base64Image: string, userId: string): Promise<string | null> => {
    try {
        // Compress image before upload (PNG -> JPEG 80%)
        // This reduces 4MB -> ~300-500KB
        const blob = await compressImage(base64Image);

        const fileName = `${userId}/${Date.now()}.jpg`;

        const { data, error } = await supabase.storage
            .from('generated-images')
            .upload(fileName, blob, {
                contentType: 'image/jpeg',
                upsert: false
            });

        if (error) {
            console.error('Error uploading image:', error);
            return null;
        }

        const { data: publicUrlData } = supabase.storage
            .from('generated-images')
            .getPublicUrl(fileName);

        return publicUrlData.publicUrl;
    } catch (e) {
        console.error('Upload exception:', e);
        return null;
    }
};
