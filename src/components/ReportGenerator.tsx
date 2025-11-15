import { ParsedData } from '@/utils/dataParser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportGeneratorProps {
  data: ParsedData;
}

export const ReportGenerator = ({ data }: ReportGeneratorProps) => {
  const { toast } = useToast();

  const generatePDFReport = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Data Analysis Report', 14, 20);
    
    // File info
    doc.setFontSize(12);
    doc.text(`File: ${data.fileName}`, 14, 30);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 37);
    
    // Data Summary
    doc.setFontSize(16);
    doc.text('Data Summary', 14, 50);
    doc.setFontSize(11);
    doc.text(`Total Rows: ${data.stats.totalRows}`, 14, 58);
    doc.text(`Total Columns: ${data.stats.totalColumns}`, 14, 65);
    doc.text(`Parsing Confidence: ${data.parsingConfidence}%`, 14, 72);
    doc.text(`Duplicate Rows: ${data.stats.duplicateRows}`, 14, 79);
    
    // Issues
    if (data.issues.length > 0) {
      doc.setFontSize(16);
      doc.text('Issues Detected', 14, 92);
      doc.setFontSize(11);
      data.issues.forEach((issue, index) => {
        doc.text(`• ${issue}`, 14, 100 + (index * 7));
      });
    }
    
    // Column Information
    const columnData = data.headers.map(header => [
      header,
      data.columnTypes[header],
      String(data.stats.missingValues[header] || 0)
    ]);
    
    autoTable(doc, {
      startY: data.issues.length > 0 ? 110 + (data.issues.length * 7) : 92,
      head: [['Column', 'Type', 'Missing Values']],
      body: columnData,
      theme: 'grid',
      headStyles: { fillColor: [33, 97, 140] },
    });
    
    // Sample Data
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(16);
    doc.text('Sample Data (First 10 Rows)', 14, finalY + 10);
    
    const sampleData = data.rows.slice(0, 10).map(row => 
      row.map(cell => String(cell || '—'))
    );
    
    autoTable(doc, {
      startY: finalY + 15,
      head: [data.headers],
      body: sampleData,
      theme: 'striped',
      headStyles: { fillColor: [33, 97, 140] },
      styles: { fontSize: 8 },
    });
    
    // Insights
    const insights = generateInsights(data);
    const insightsY = (doc as any).lastAutoTable.finalY + 10;
    if (insightsY < 280) {
      doc.setFontSize(16);
      doc.text('Key Insights', 14, insightsY);
      doc.setFontSize(11);
      insights.forEach((insight, index) => {
        doc.text(`• ${insight}`, 14, insightsY + 8 + (index * 7));
      });
    }
    
    doc.save(`analysis-report-${Date.now()}.pdf`);
    
    toast({
      title: 'Report generated',
      description: 'Your PDF report has been downloaded successfully.',
    });
  };

  const generateHTMLReport = () => {
    const insights = generateInsights(data);
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Data Analysis Report</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 1200px; margin: 40px auto; padding: 20px; }
          h1 { color: #2165ac; }
          h2 { color: #3ea09d; margin-top: 30px; }
          .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
          .stat-card { padding: 15px; background: #f5f5f5; border-radius: 8px; }
          .stat-value { font-size: 24px; font-weight: bold; color: #2165ac; }
          .stat-label { color: #666; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }
          th { background: #2165ac; color: white; }
          tr:nth-child(even) { background: #f9f9f9; }
          .issue { background: #fee; padding: 10px; margin: 10px 0; border-left: 4px solid #c00; }
          .insight { background: #e0f2fe; padding: 10px; margin: 10px 0; border-left: 4px solid #2165ac; }
        </style>
      </head>
      <body>
        <h1>Data Analysis Report</h1>
        <p><strong>File:</strong> ${data.fileName}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Parsing Confidence:</strong> ${data.parsingConfidence}%</p>
        
        <h2>Data Summary</h2>
        <div class="stats">
          <div class="stat-card">
            <div class="stat-value">${data.stats.totalRows}</div>
            <div class="stat-label">Total Rows</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.stats.totalColumns}</div>
            <div class="stat-label">Total Columns</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${Object.values(data.stats.missingValues).reduce((a, b) => a + b, 0)}</div>
            <div class="stat-label">Missing Values</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.stats.duplicateRows}</div>
            <div class="stat-label">Duplicate Rows</div>
          </div>
        </div>
        
        ${data.issues.length > 0 ? `
          <h2>Issues Detected</h2>
          ${data.issues.map(issue => `<div class="issue">${issue}</div>`).join('')}
        ` : ''}
        
        <h2>Column Information</h2>
        <table>
          <thead>
            <tr>
              <th>Column</th>
              <th>Type</th>
              <th>Missing Values</th>
            </tr>
          </thead>
          <tbody>
            ${data.headers.map(header => `
              <tr>
                <td>${header}</td>
                <td>${data.columnTypes[header]}</td>
                <td>${data.stats.missingValues[header] || 0}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <h2>Sample Data (First 10 Rows)</h2>
        <table>
          <thead>
            <tr>
              ${data.headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.rows.slice(0, 10).map(row => `
              <tr>
                ${row.map(cell => `<td>${cell === null || cell === undefined || cell === '' ? '—' : cell}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <h2>Key Insights</h2>
        ${insights.map(insight => `<div class="insight">${insight}</div>`).join('')}
      </body>
      </html>
    `;
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-report-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Report generated',
      description: 'Your HTML report has been downloaded successfully.',
    });
  };

  const generateInsights = (data: ParsedData): string[] => {
    const insights: string[] = [];
    
    // Data completeness
    const totalCells = data.stats.totalRows * data.stats.totalColumns;
    const missingCells = Object.values(data.stats.missingValues).reduce((a, b) => a + b, 0);
    const completeness = ((totalCells - missingCells) / totalCells * 100).toFixed(1);
    insights.push(`Data completeness: ${completeness}% of cells contain values`);
    
    // Duplicate analysis
    if (data.stats.duplicateRows > 0) {
      const dupPercent = (data.stats.duplicateRows / data.stats.totalRows * 100).toFixed(1);
      insights.push(`${dupPercent}% of rows are duplicates and may need to be removed`);
    }
    
    // Column type distribution
    const typeCount = Object.values(data.columnTypes).reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    insights.push(`Column types: ${Object.entries(typeCount).map(([type, count]) => `${count} ${type}`).join(', ')}`);
    
    // Parsing confidence
    if (data.parsingConfidence < 90) {
      insights.push(`Parsing confidence is ${data.parsingConfidence}%, manual review recommended`);
    }
    
    return insights;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Generate Analysis Report
        </CardTitle>
        <CardDescription>
          Export a comprehensive report with data summary, statistics, and insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Button onClick={generatePDFReport} className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Download PDF Report
          </Button>
          <Button onClick={generateHTMLReport} variant="outline" className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Download HTML Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
