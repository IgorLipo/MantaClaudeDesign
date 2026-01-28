/**
 * Export utilities for CSV and PDF generation
 * Demo-only implementation with in-browser file generation
 */

import { toast } from "sonner";

interface ExportOptions {
  filename: string;
  title?: string;
}

/**
 * Export data to CSV file
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; label: string }[],
  options: ExportOptions
): void {
  try {
    // Build CSV header
    const header = columns.map(col => `"${col.label}"`).join(',');
    
    // Build CSV rows
    const rows = data.map(row => 
      columns.map(col => {
        const value = row[col.key];
        // Escape quotes and wrap in quotes
        const stringValue = value?.toString() ?? '';
        return `"${stringValue.replace(/"/g, '""')}"`;
      }).join(',')
    );
    
    const csvContent = [header, ...rows].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${options.filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("CSV Exported", {
      description: `${options.filename}.csv has been downloaded.`,
    });
  } catch (error) {
    toast.error("Export Failed", {
      description: "Unable to generate CSV file.",
    });
    console.error("CSV export error:", error);
  }
}

/**
 * Export view to PDF using browser print
 * This creates a styled HTML page and triggers print dialog
 */
export function exportToPDF(
  content: { title: string; sections: { heading: string; data: string[][] }[] },
  options: ExportOptions
): void {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Export Failed", {
        description: "Please allow popups to export PDF.",
      });
      return;
    }
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>${options.title || options.filename}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Inter', system-ui, sans-serif;
      padding: 40px;
      color: #1e293b;
      line-height: 1.6;
    }
    
    .header {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .header h1 {
      font-size: 24px;
      font-weight: 600;
      color: #0f172a;
    }
    
    .header p {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
    }
    
    .section {
      margin-bottom: 30px;
    }
    
    .section h2 {
      font-size: 16px;
      font-weight: 600;
      color: #334155;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    
    th, td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    
    th {
      background: #f8fafc;
      font-weight: 600;
      color: #475569;
    }
    
    tr:hover {
      background: #f8fafc;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-size: 10px;
      color: #94a3b8;
      text-align: center;
    }
    
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${content.title}</h1>
    <p>Generated on ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}</p>
  </div>
  
  ${content.sections.map(section => `
    <div class="section">
      <h2>${section.heading}</h2>
      <table>
        <thead>
          <tr>
            ${section.data[0]?.map(header => `<th>${header}</th>`).join('') || ''}
          </tr>
        </thead>
        <tbody>
          ${section.data.slice(1).map(row => `
            <tr>
              ${row.map(cell => `<td>${cell}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('')}
  
  <div class="footer">
    <p>Finance Pulse • Confidential Report</p>
  </div>
  
  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() {
        window.close();
      };
    };
  </script>
</body>
</html>`;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    toast.success("PDF Export", {
      description: "Print dialog opened. Save as PDF to download.",
    });
  } catch (error) {
    toast.error("Export Failed", {
      description: "Unable to generate PDF.",
    });
    console.error("PDF export error:", error);
  }
}

/**
 * Quick export for simple table data
 */
export function quickExportCSV(
  headers: string[],
  rows: string[][],
  filename: string
): void {
  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  toast.success("CSV Exported", {
    description: `${filename}.csv has been downloaded.`,
  });
}

/**
 * Export chart data
 */
export function exportChartData(
  chartName: string,
  data: { label: string; value: number | string }[]
): void {
  quickExportCSV(
    ['Label', 'Value'],
    data.map(d => [d.label, d.value.toString()]),
    `${chartName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}`
  );
}
