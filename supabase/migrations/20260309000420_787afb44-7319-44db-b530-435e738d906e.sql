
ALTER TABLE public.scan_results
  ADD COLUMN report_type text DEFAULT 'general',
  ADD COLUMN batch_id uuid DEFAULT NULL;

CREATE INDEX idx_scan_results_batch_id ON public.scan_results(batch_id);
CREATE INDEX idx_scan_results_report_type ON public.scan_results(report_type);
