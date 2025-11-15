import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { parseExcelFile, ParsedData } from '@/utils/dataParser';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onDataParsed: (data: ParsedData) => void;
}

export const FileUpload = ({ onDataParsed }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFile = useCallback(async (file: File) => {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an Excel (.xlsx, .xls) or CSV file.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setProgress(20);

    try {
      setProgress(50);
      const parsedData = await parseExcelFile(file);
      setProgress(100);

      toast({
        title: 'File parsed successfully',
        description: `Loaded ${parsedData.stats.totalRows} rows and ${parsedData.stats.totalColumns} columns.`,
      });

      onDataParsed(parsedData);
    } catch (error) {
      toast({
        title: 'Parsing failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
      }, 500);
    }
  }, [onDataParsed, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  return (
    <div className="space-y-4">
      <Card
        className={`relative border-2 border-dashed transition-all ${
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-border hover:border-primary/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="p-12 text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-6">
              {isProcessing ? (
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-12 h-12 text-primary" />
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold text-foreground">
              {isProcessing ? 'Processing your file...' : 'Upload your data file'}
            </h3>
            <p className="text-muted-foreground">
              Drag and drop or click to browse
            </p>
            <p className="text-sm text-muted-foreground">
              Supported formats: Excel (.xlsx, .xls), CSV
            </p>
          </div>

          {!isProcessing && (
            <div className="flex justify-center gap-3">
              <Button size="lg" asChild>
                <label className="cursor-pointer">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Choose File
                  <input
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileInput}
                  />
                </label>
              </Button>
            </div>
          )}

          {isProcessing && (
            <div className="max-w-md mx-auto space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Parsing data and validating...
              </p>
            </div>
          )}
        </div>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Files are processed entirely in your browser. Your data never leaves your device.
          Maximum file size: 10MB.
        </AlertDescription>
      </Alert>
    </div>
  );
};
