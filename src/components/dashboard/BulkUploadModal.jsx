import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileUp, Download } from 'lucide-react';

export default function BulkUploadModal({ isOpen, onClose, onUpload, templateHref, title = "Bulk Upload" }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setError('');
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    setUploading(true);
    setError('');
    try {
      await onUpload(file);
      onClose();
      setFile(null);
    } catch (e) {
      setError(e.message || 'Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Upload a CSV or Excel file to bulk import data. Please use the provided template to ensure the columns are mapped correctly.
          </p>
          
          <div className="flex justify-center mb-4">
            <a href={templateHref} download>
              <Button variant="outline" className="w-full">
                <Download size={16} className="mr-2" /> Download Sample Template
              </Button>
            </a>
          </div>

          <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/30 transition-colors">
            <FileUp size={32} className="text-muted-foreground mb-3" />
            <input 
              type="file" 
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
              onChange={handleFileChange}
              className="mb-3 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            {file && <span className="text-sm font-medium text-primary">Selected: {file.name}</span>}
          </div>
          {error && <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2 mt-2">{error}</div>}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={uploading}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? 'Uploading...' : 'Upload Data'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
