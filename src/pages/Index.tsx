import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { DataPreview } from '@/components/DataPreview';
import { DataCleaning } from '@/components/DataCleaning';
import { Dashboard } from '@/components/Dashboard';
import { ReportGenerator } from '@/components/ReportGenerator';
import { ParsedData } from '@/utils/dataParser';
import { BarChart3 } from 'lucide-react';

const Index = () => {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [cleanedData, setCleanedData] = useState<ParsedData | null>(null);

  const currentData = cleanedData || parsedData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <header className="text-center space-y-4 py-8">
          <div className="flex justify-center">
            <div className="rounded-full bg-gradient-to-br from-primary to-secondary p-4">
              <BarChart3 className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Data Analysis Platform
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload, analyze, visualize, and export your data with confidence.
            All processing happens securely in your browser.
          </p>
        </header>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto space-y-6">
          {/* File Upload */}
          {!parsedData && <FileUpload onDataParsed={setParsedData} />}

          {/* Data Preview & Analysis */}
          {currentData && (
            <>
              <DataPreview data={currentData} />
              <DataCleaning data={parsedData!} onDataCleaned={setCleanedData} />
              <Dashboard data={currentData} />
              <ReportGenerator data={currentData} />
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center py-8 text-sm text-muted-foreground border-t space-y-2">
          <p>All data processing happens client-side. Your data never leaves your device.</p>
          <p>© All rights reserved @project.saisha</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
