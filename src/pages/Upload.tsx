import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Activity, Upload, FileImage, X, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const UploadPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((f: File) => {
    if (f.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB');
      return;
    }
    setFile(f);
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);
    try {
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('reports').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: scan, error: insertError } = await supabase
        .from('scan_results')
        .insert({ user_id: user.id, file_name: file.name, status: 'processing' })
        .select()
        .single();
      if (insertError) throw insertError;

      navigate(`/processing/${scan.id}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Activity className="w-6 h-6 text-primary" />
          <span className="text-lg font-display font-bold text-foreground">Upload Report</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Upload Your Report</h1>
          <p className="text-muted-foreground mb-6">
            Upload a photo or PDF of your medical lab report for AI analysis.
          </p>

          {!file ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                dragOver ? 'border-primary bg-accent/50' : 'border-border hover:border-primary/40'
              }`}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <FileImage className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-foreground font-medium mb-1">Drop your file here or click to browse</p>
              <p className="text-sm text-muted-foreground">Supports JPG, PNG, PDF up to 10MB</p>
            </div>
          ) : (
            <div className="border border-border rounded-xl p-6 bg-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FileImage className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-medium text-foreground truncate max-w-[200px]">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => { setFile(null); setPreview(null); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {preview && (
                <img src={preview} alt="Preview" className="w-full rounded-lg mb-4 max-h-64 object-contain bg-muted" />
              )}
              <Button onClick={handleUpload} disabled={uploading} className="w-full gradient-primary text-primary-foreground" size="lg">
                {uploading ? 'Uploading...' : 'Analyze Report'}
                <Upload className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          <div className="mt-6 p-4 rounded-lg bg-accent/30 border border-border">
            <p className="text-xs text-muted-foreground leading-relaxed">
              🔒 Your medical data is encrypted and processed securely. We do not store or share your health information with third parties. AI analysis is for informational purposes only — always consult your doctor.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default UploadPage;
