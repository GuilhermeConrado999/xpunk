-- Update storage bucket for videos to increase limit to 2GB
UPDATE storage.buckets
SET file_size_limit = 2147483648 -- 2GB in bytes
WHERE id = 'videos';
