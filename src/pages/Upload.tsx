import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Activity, Upload, FileImage, FileText, X, ArrowLeft, Image, File, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface UploadFile {
  file: File;
  id: string;
  preview: string | null;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  reportType: string;
}

const MAX_FILES = 10;
const MAX_SIZE = 10 * 1024 * 1024;

function detectReportType(name: string): string {
  const n = name.toLowerCase();
  if (/blood|cbc|hemoglobin|hematology|wbc|rbc|platelet/.test(n)) return 'blood_test';
  if (/mri|xray|x-ray|ct|scan|radiology|ultrasound/.test(n)) return 'radiology';
  if (/prescription|rx|presc/.test(n)) return 'prescription';
  return 'general';
}

function reportTypeLabel(type: string) {
  const map: Record<string, string> = {
    blood_test: '🩸 Blood Test',
    radiology: '📡 Radiology',
    prescription: '💊 Prescription',
    general: '📄 General',
  };
  return map[type] || '📄 General';
}

const UploadPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    
    setFiles(prev => {
      const remaining = MAX_FILES - prev.length;
      if (remaining <= 0) {
        toast.error(`Maximum ${MAX_FILES} files allowed`);
        return prev;
      }
      
      const toAdd = arr.slice(0, remaining);
      if (arr.length > remaining) {
        toast.warning(`Only ${remaining} more file(s) can be added`);
      }

      const mapped: UploadFile[] = toAdd
        .filter(f => {
          if (f.size > MAX_SIZE) {
            toast.error(`${f.name} exceeds 10MB limit`);
            return false;
          }
          return true;
        })
        .map(f => {
          const id = crypto.randomUUID();
          let preview: string | null = null;
          if (f.type.startsWith('image/')) {
            preview = URL.createObjectURL(f);
          }
          return {
            file: f,
            id,
            preview,
            progress: 0,
            status: 'pending' as const,
            reportType: detectReportType(f.name),
          };
        });

      return [...prev, ...mapped];
    });
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const f = prev.find(x => x.id === id);
      if (f?.preview) URL.revokeObjectURL(f.preview);
      return prev.filter(x => x.id !== id);
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const handleUpload = async () => {
    if (!files.length || !user) return;
    setUploading(true);
    const batchId = crypto.randomUUID();

    try {
      const results: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const uf = files[i];
        setFiles(prev => prev.map(f => f.id === uf.id ? { ...f, status: 'uploading', progress: 10 } : f));

        const filePath = `${user.id}/${Date.now()}_${uf.file.name}`;
        const { error: uploadError } = await supabase.storage.from('reports').upload(filePath, uf.file);
        
        if (uploadError) {
          setFiles(prev => prev.map(f => f.id === uf.id ? { ...f, status: 'error', progress: 0 } : f));
          toast.error(`Failed to upload ${uf.file.name}`);
          continue;
        }

        setFiles(prev => prev.map(f => f.id === uf.id ? { ...f, progress: 60 } : f));

        const { data: scan, error: insertError } = await supabase
          .from('scan_results')
          .insert({
            user_id: user.id,
            file_name: uf.file.name,
            status: 'processing',
            report_type: uf.reportType,
            batch_id: batchId,
          })
          .select()
          .single();

        if (insertError) {
          setFiles(prev => prev.map(f => f.id === uf.id ? { ...f, status: 'error' } : f));
          toast.error(`Failed to save ${uf.file.name}`);
          continue;
        }

        setFiles(prev => prev.map(f => f.id === uf.id ? { ...f, status: 'done', progress: 100 } : f));
        results.push(scan.id);
      }

      if (results.length > 0) {
        toast.success(`${results.length} report(s) uploaded successfully`);
        navigate(`/processing/${results[0]}?batch=${batchId}`);
      } else {
        toast.error('No files were uploaded successfully');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const FileIcon = ({ type }: { type: string }) => {
    if (type.startsWith('image/')) return <Image className="w-5 h-5 text-primary" />;
    if (type === 'application/pdf') return <FileText className="w-5 h-5 text-destructive" />;
    return <File className="w-5 h-5 text-muted-foreground" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Activity className="w-6 h-6 text-primary" />
          <span className="text-lg font-display font-bold text-foreground">Upload Reports</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Upload Medical Reports</h1>
          <p className="text-muted-foreground mb-6">
            Upload multiple photos or PDFs of your lab reports for batch AI analysis.
          </p>

          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer mb-6 ${
              dragOver ? 'border-primary bg-accent/50 scale-[1.02]' : 'border-border hover:border-primary/40'
            }`}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept="image/*,.pdf"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
            <FileImage className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium mb-1">Drop files here or click to browse</p>
            <p className="text-xs text-muted-foreground">JPG, PNG, PDF • Up to 10MB each • Max {MAX_FILES} files</p>
          </div>

          {/* File List */}
          <AnimatePresence>
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-foreground">
                    Selected Files ({files.length}/{MAX_FILES})
                  </p>
                  {!uploading && (
                    <button
                      onClick={() => setFiles([])}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {files.map((uf) => (
                    <motion.div
                      key={uf.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      className="border border-border rounded-xl p-3 bg-card"
                    >
                      <div className="flex items-center gap-3">
                        {/* Thumbnail or Icon */}
                        {uf.preview ? (
                          <button
                            onClick={() => setPreviewUrl(uf.preview)}
                            className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0 relative group"
                          >
                            <img src={uf.preview} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors flex items-center justify-center">
                              <Eye className="w-4 h-4 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </button>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                            <FileIcon type={uf.file.type} />
                          </div>
                        )}

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{uf.file.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {(uf.file.size / 1024 / 1024).toFixed(1)} MB
                            </span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-accent text-accent-foreground">
                              {reportTypeLabel(uf.reportType)}
                            </span>
                          </div>
                        </div>

                        {/* Status / Remove */}
                        {!uploading ? (
                          <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => removeFile(uf.id)}>
                            <X className="w-4 h-4" />
                          </Button>
                        ) : (
                          <span className={`text-xs font-medium shrink-0 ${
                            uf.status === 'done' ? 'text-success' : uf.status === 'error' ? 'text-destructive' : 'text-muted-foreground'
                          }`}>
                            {uf.status === 'done' ? '✓' : uf.status === 'error' ? '✗' : `${uf.progress}%`}
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {uploading && uf.status !== 'pending' && (
                        <div className="mt-2">
                          <Progress value={uf.progress} className="h-1.5" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Analyze Button */}
          {files.length > 0 && (
            <Button
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
              className="w-full gradient-primary text-primary-foreground"
              size="lg"
            >
              {uploading ? 'Uploading...' : `Analyze ${files.length} Report${files.length > 1 ? 's' : ''}`}
              <Upload className="w-4 h-4 ml-2" />
            </Button>
          )}

          {/* Privacy Note */}
          <div className="mt-6 p-4 rounded-lg bg-accent/30 border border-border">
            <p className="text-xs text-muted-foreground leading-relaxed">
              🔒 Your medical data is encrypted and processed securely. We do not store or share your health information with third parties. AI analysis is for informational purposes only — always consult your doctor.
            </p>
          </div>
        </motion.div>
      </main>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/80 flex items-center justify-center p-6"
            onClick={() => setPreviewUrl(null)}
          >
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={previewUrl}
              alt="Preview"
              className="max-w-full max-h-full rounded-xl object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploadPage;
