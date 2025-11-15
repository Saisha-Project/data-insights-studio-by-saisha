import { ParsedData } from '@/utils/dataParser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Database, Table } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DataPreviewProps {
  data: ParsedData;
}

export const DataPreview = ({ data }: DataPreviewProps) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'success';
    if (confidence >= 70) return 'warning';
    return 'destructive';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'numeric': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'date': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'text': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Parsing Confidence */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Data Quality Report
              </CardTitle>
              <CardDescription>{data.fileName}</CardDescription>
            </div>
            <Badge 
              variant={getConfidenceColor(data.parsingConfidence) as any}
              className="text-lg px-4 py-2"
            >
              {data.parsingConfidence}% Confidence
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Rows</p>
              <p className="text-2xl font-bold">{data.stats.totalRows}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Columns</p>
              <p className="text-2xl font-bold">{data.stats.totalColumns}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Missing Values</p>
              <p className="text-2xl font-bold">
                {Object.values(data.stats.missingValues).reduce((a, b) => a + b, 0)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Duplicates</p>
              <p className="text-2xl font-bold">{data.stats.duplicateRows}</p>
            </div>
          </div>

          {data.issues.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Issues Detected:</h4>
              {data.issues.map((issue, index) => (
                <Alert key={index} variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{issue}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {data.issues.length === 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-success" />
              <AlertDescription>No issues detected. Data appears clean and ready for analysis.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Column Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table className="w-5 h-5" />
            Column Information
          </CardTitle>
          <CardDescription>
            Detected data types and missing value counts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.headers.map((header, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{header}</span>
                  <Badge className={getTypeColor(data.columnTypes[header])}>
                    {data.columnTypes[header]}
                  </Badge>
                </div>
                {data.stats.missingValues[header] > 0 && (
                  <Badge variant="outline" className="text-warning">
                    {data.stats.missingValues[header]} missing
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Preview Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Preview</CardTitle>
          <CardDescription>First 10 rows of your dataset</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full rounded-md border">
            <div className="min-w-max">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold border-b">#</th>
                    {data.headers.map((header, index) => (
                      <th key={index} className="px-4 py-3 text-left font-semibold border-b whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.slice(0, 10).map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 text-muted-foreground">{rowIndex + 1}</td>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-3 whitespace-nowrap">
                          {cell === null || cell === undefined || cell === '' ? (
                            <span className="text-muted-foreground italic">—</span>
                          ) : (
                            String(cell)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
