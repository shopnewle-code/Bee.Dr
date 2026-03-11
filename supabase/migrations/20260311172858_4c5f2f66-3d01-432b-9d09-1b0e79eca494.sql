-- Add ocr_text column to scan_results table to store extracted OCR text
ALTER TABLE public.scan_results ADD COLUMN ocr_text TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN public.scan_results.ocr_text IS 'Raw OCR text extracted from the report image using vision AI';
