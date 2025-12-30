// Export utilities for PDF and print functionality

export function printPage() {
  window.print();
}

export function exportToPDF(elementId: string, filename: string = 'document.pdf') {
  // This would use a library like jsPDF or html2pdf
  // For now, we'll use the browser's print to PDF functionality
  const element = document.getElementById(elementId);
  if (!element) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>${filename}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .no-print { display: none; }
          h1, h2, h3 { color: #000; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

export function downloadAsText(content: string, filename: string = 'document.txt') {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function shareLink(url: string, title: string) {
  if (navigator.share) {
    navigator.share({
      title,
      url,
    }).catch(() => {
      // Fallback to clipboard
      copyToClipboard(url);
    });
  } else {
    copyToClipboard(url);
  }
}

export function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    // Could show a toast notification
    console.log('Copied to clipboard');
  });
}

