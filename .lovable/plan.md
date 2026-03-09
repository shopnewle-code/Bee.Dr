

# Multi-File Upload + Report Grouping System

## Overview
Transform the single-file upload page into a multi-file medical report upload system with per-file progress tracking, image previews, auto-categorization, and batch AI analysis.

## Changes

### 1. Rewrite `src/pages/Upload.tsx`
- Support selecting/dropping multiple files at once
- File list UI with: filename, size, type icon, preview thumbnail (for images), individual remove button, per-file upload progress bar
- 10MB per file limit, max 10 files per batch
- "Analyze All Reports" button that uploads all files and creates one `scan_results` row per file
- After upload completes, navigate to a new batch results page or sequentially process

### 2. Database: Add `report_type` column to `scan_results`
Run a migration to add:
```sql
ALTER TABLE public.scan_results
  ADD COLUMN report_type text DEFAULT 'general',
  ADD COLUMN batch_id uuid DEFAULT NULL;
```
- `report_type`: auto-detected category (blood_test, radiology, prescription, general)
- `batch_id`: groups files uploaded together for combined AI analysis

### 3. Update `src/pages/Processing.tsx`
- Accept a `batch_id` query param to show progress for all files in a batch
- Show per-file pipeline progress simultaneously

### 4. Update `src/pages/History.tsx`
- Group scan results by `report_type` with collapsible sections
- Show batch uploads grouped together
- Add type filter chips (Blood Tests, Radiology, Prescriptions, All)

### 5. Upload Page UI Design
```text
+----------------------------------+
| <- Upload Medical Reports        |
+----------------------------------+
|                                  |
|   +----------------------------+ |
|   |  Drag & drop files here    | |
|   |  or click to browse        | |
|   |  JPG, PNG, PDF up to 10MB  | |
|   +----------------------------+ |
|                                  |
|   Selected Files (3)             |
|   +----------------------------+ |
|   | [img] CBC_Report.pdf  2.1MB| |
|   |       ████████████░░  85%  | |
|   |                    [Remove]| |
|   +----------------------------+ |
|   | [img] MRI_Scan.jpg   4.3MB | |
|   |       ██████████████  100% | |
|   |                    [Remove]| |
|   +----------------------------+ |
|   | [img] Prescription.pdf 1MB | |
|   |       ██████░░░░░░░░  45%  | |
|   |                    [Remove]| |
|   +----------------------------+ |
|                                  |
|   [ Analyze 3 Reports ]         |
|                                  |
+----------------------------------+
```

### 6. File auto-categorization
Simple client-side heuristic based on filename keywords before upload:
- "blood", "cbc", "hemoglobin" -> blood_test
- "mri", "xray", "x-ray", "ct", "scan" -> radiology  
- "prescription", "rx" -> prescription
- Otherwise -> general

The AI analysis edge function will also return a detected `report_type` for more accurate categorization.

## Technical Details

- Use `Promise.allSettled` for parallel file uploads to storage bucket
- Track per-file progress via XHR (supabase storage JS client doesn't expose progress, so use `XMLHttpRequest` or `fetch` with upload tracking)
- Generate a shared `batch_id = crypto.randomUUID()` per upload session
- Each file gets its own `scan_results` row linked by `batch_id`
- Processing page checks all rows in batch before navigating to results

## Files Modified
- `src/pages/Upload.tsx` - Complete rewrite for multi-file
- `src/pages/Processing.tsx` - Batch awareness
- `src/pages/History.tsx` - Grouping by type and batch
- Database migration for `report_type` and `batch_id` columns

