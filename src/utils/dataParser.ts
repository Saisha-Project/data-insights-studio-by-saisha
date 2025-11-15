import * as XLSX from 'xlsx';

export interface ParsedData {
  headers: string[];
  rows: any[][];
  fileName: string;
  fileType: string;
  parsingConfidence: number;
  issues: string[];
  columnTypes: { [key: string]: string };
  stats: DataStats;
}

export interface DataStats {
  totalRows: number;
  totalColumns: number;
  missingValues: { [key: string]: number };
  duplicateRows: number;
}

export const parseExcelFile = async (file: File): Promise<ParsedData> => {
  const issues: string[] = [];
  let confidence = 100;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (jsonData.length === 0) {
          issues.push('File appears to be empty');
          confidence -= 50;
        }

        // Extract headers and rows
        const headers = (jsonData[0] as any[]).map((h, i) => h || `Column_${i + 1}`);
        const rows = jsonData.slice(1) as any[][];

        // Detect column types
        const columnTypes = detectColumnTypes(headers, rows);

        // Calculate stats
        const stats = calculateStats(headers, rows);

        // Check for issues
        if (stats.missingValues && Object.keys(stats.missingValues).length > 0) {
          const totalMissing = Object.values(stats.missingValues).reduce((a, b) => a + b, 0);
          if (totalMissing > 0) {
            issues.push(`${totalMissing} missing values detected`);
            confidence -= Math.min(20, totalMissing / rows.length * 100);
          }
        }

        if (stats.duplicateRows > 0) {
          issues.push(`${stats.duplicateRows} duplicate rows found`);
          confidence -= Math.min(10, stats.duplicateRows / rows.length * 50);
        }

        resolve({
          headers,
          rows,
          fileName: file.name,
          fileType: file.type || 'application/vnd.ms-excel',
          parsingConfidence: Math.max(0, Math.round(confidence)),
          issues,
          columnTypes,
          stats,
        });
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error}`));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });
};

const detectColumnTypes = (headers: string[], rows: any[][]): { [key: string]: string } => {
  const types: { [key: string]: string } = {};
  
  headers.forEach((header, colIndex) => {
    const values = rows.map(row => row[colIndex]).filter(v => v !== null && v !== undefined && v !== '');
    
    if (values.length === 0) {
      types[header] = 'empty';
      return;
    }

    const numericCount = values.filter(v => !isNaN(Number(v))).length;
    const dateCount = values.filter(v => !isNaN(Date.parse(String(v)))).length;
    
    if (numericCount / values.length > 0.8) {
      types[header] = 'numeric';
    } else if (dateCount / values.length > 0.8) {
      types[header] = 'date';
    } else {
      types[header] = 'text';
    }
  });

  return types;
};

const calculateStats = (headers: string[], rows: any[][]): DataStats => {
  const missingValues: { [key: string]: number } = {};
  const rowSet = new Set<string>();
  let duplicateRows = 0;

  headers.forEach((header, colIndex) => {
    const missing = rows.filter(row => {
      const value = row[colIndex];
      return value === null || value === undefined || value === '';
    }).length;
    
    if (missing > 0) {
      missingValues[header] = missing;
    }
  });

  rows.forEach(row => {
    const rowString = JSON.stringify(row);
    if (rowSet.has(rowString)) {
      duplicateRows++;
    } else {
      rowSet.add(rowString);
    }
  });

  return {
    totalRows: rows.length,
    totalColumns: headers.length,
    missingValues,
    duplicateRows,
  };
};

export const cleanData = (
  data: ParsedData,
  options: {
    trimWhitespace?: boolean;
    removeDuplicates?: boolean;
    fillMissing?: 'mean' | 'median' | 'mode' | 'remove';
    dropEmptyColumns?: boolean;
  }
): ParsedData => {
  let { headers, rows } = data;
  const cleaningIssues: string[] = [...data.issues];

  // Trim whitespace
  if (options.trimWhitespace) {
    rows = rows.map(row => 
      row.map(cell => typeof cell === 'string' ? cell.trim() : cell)
    );
    cleaningIssues.push('Whitespace trimmed');
  }

  // Remove duplicates
  if (options.removeDuplicates) {
    const uniqueRows = new Map<string, any[]>();
    rows.forEach(row => {
      const key = JSON.stringify(row);
      if (!uniqueRows.has(key)) {
        uniqueRows.set(key, row);
      }
    });
    const beforeCount = rows.length;
    rows = Array.from(uniqueRows.values());
    if (beforeCount !== rows.length) {
      cleaningIssues.push(`Removed ${beforeCount - rows.length} duplicate rows`);
    }
  }

  // Fill missing values
  if (options.fillMissing && options.fillMissing !== 'remove') {
    headers.forEach((header, colIndex) => {
      const columnValues = rows.map(row => row[colIndex]).filter(v => v !== null && v !== undefined && v !== '');
      
      if (data.columnTypes[header] === 'numeric' && columnValues.length > 0) {
        const numbers = columnValues.map(Number);
        let fillValue: number;
        
        if (options.fillMissing === 'mean') {
          fillValue = numbers.reduce((a, b) => a + b, 0) / numbers.length;
        } else if (options.fillMissing === 'median') {
          numbers.sort((a, b) => a - b);
          fillValue = numbers[Math.floor(numbers.length / 2)];
        } else {
          fillValue = 0;
        }

        rows = rows.map(row => {
          if (row[colIndex] === null || row[colIndex] === undefined || row[colIndex] === '') {
            row[colIndex] = fillValue;
          }
          return row;
        });
      }
    });
    cleaningIssues.push(`Filled missing values using ${options.fillMissing}`);
  }

  return {
    ...data,
    headers,
    rows,
    issues: cleaningIssues,
    stats: calculateStats(headers, rows),
  };
};
