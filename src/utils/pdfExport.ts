import { jsPDF } from 'jspdf';

export interface ReportFilterMetadata {
  scopeMode?: 'unfiltered-sample';
  programmeName: string;
  categoryFilter: string;
  statusFilter: string;
  generatedBy: string;
  totalRecords: number;
  workspaceType: 'coordinator' | 'leadership' | 'operations';
}

export interface KpiSummaryMetric {
  label: string;
  value: string;
  status?: string;
  subtitle?: string;
}

export const generateInstitutionalPdf = (
  meta: ReportFilterMetadata,
  metrics: KpiSummaryMetric[],
  records: Array<{
    id: string;
    title: string;
    category?: string;
    priority?: string;
    status: string;
    assigneeOrArtist?: string;
    dueDateOrProgress?: string;
  }>
): jsPDF => {
  if (requiresBrowserPrint(meta, metrics, records)) throw new Error('Use the bilingual print view for this report.');
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // ~210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // ~297mm
  const margin = 16;
  const contentWidth = pageWidth - margin * 2; // ~178mm

  // Colors
  const inkColor = [28, 28, 30] as const; // Sadu ink #1C1C1E
  const charcoalColor = [44, 44, 46] as const;
  const brickColor = [168, 67, 54] as const; // Sadu brick #A84336
  const goldColor = [212, 185, 150] as const; // Sadu gold #D4B996
  const linenColor = [247, 244, 239] as const; // Sadu linen #F7F4EF
  const sandColor = [238, 232, 222] as const;
  const mutedColor = [115, 115, 120] as const;

  let y = margin;

  // 1. Top Decorative Sadu Header Line
  doc.setFillColor(...brickColor);
  doc.rect(margin, y, contentWidth, 3, 'F');
  y += 7;

  // 2. Official Header Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...inkColor);
  doc.text('SADU ART PLATFORM', margin, y);

  // Subtitle / Authority
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.text('CULTURAL INITIATIVES & BIENNALE COMMISSION LEDGER', margin, y + 4.5);

  // Reference & Timestamp on Right
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toISOString().slice(11, 19);
  const refNumber = `REF: SADU-DOC-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...brickColor);
  doc.text(refNumber, pageWidth - margin, y, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedColor);
  doc.text(`DATE: ${dateStr} ${timeStr} UTC`, pageWidth - margin, y + 4.5, { align: 'right' });
  doc.text(`SEC LEVEL: INSTITUTIONAL INTERNAL`, pageWidth - margin, y + 8.5, { align: 'right' });

  y += 14;

  // Divider line
  doc.setDrawColor(...goldColor);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // 3. Document Title & Context Box
  doc.setFillColor(...linenColor);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');
  doc.setDrawColor(...goldColor);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...charcoalColor);
  doc.text(`EXECUTIVE AUDIT REPORT: ${meta.programmeName.toUpperCase()}`, margin + 5, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.text(`Active Workspace: ${meta.workspaceType.toUpperCase()}`, margin + 5, y + 12);
  doc.text(`Category Filter: ${meta.categoryFilter.toUpperCase()}`, margin + 65, y + 12);
  doc.text(`Status Filter: ${meta.statusFilter.toUpperCase()}`, margin + 125, y + 12);

  doc.text(`Records in Scope: ${records.length} Items`, margin + 5, y + 17.5);
  doc.text(`Prepared By: ${meta.generatedBy}`, margin + 65, y + 17.5);
  doc.text(`Status: SAMPLE / UNAPPROVED`, margin + 125, y + 17.5);

  y += 28;

  // 4. Executive KPI Metrics Snapshot
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...inkColor);
  doc.text('EXECUTIVE KPI BENCHMARK SNAPSHOT', margin, y);
  y += 4;

  const cardGap = 3;
  const cardWidth = (contentWidth - cardGap * (metrics.length - 1)) / metrics.length;
  const cardHeight = 18;

  metrics.forEach((metric, idx) => {
    const cardX = margin + idx * (cardWidth + cardGap);
    
    // Background
    doc.setFillColor(...sandColor);
    doc.roundedRect(cardX, y, cardWidth, cardHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(...goldColor);
    doc.setLineWidth(0.3);
    doc.roundedRect(cardX, y, cardWidth, cardHeight, 1.5, 1.5, 'D');

    // Title
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...mutedColor);
    doc.text(metric.label.slice(0, 24), cardX + 3, y + 4.5);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...charcoalColor);
    doc.text(metric.value, cardX + 3, y + 11);

    // Subtitle
    if (metric.subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(...mutedColor);
      doc.text(metric.subtitle.slice(0, 26), cardX + 3, y + 15.5);
    }
  });

  y += cardHeight + 8;

  // 5. Itemized Records Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...inkColor);
  doc.text(`AUDITED DATA RECORDS (${records.length} ITEMS MATCHING ACTIVE FILTER)`, margin, y);
  y += 4;

  // Table Headers
  const colWidths = [18, 24, 60, 34, 22, 20]; // Total: 178mm
  const headers = ['REF/ID', 'CATEGORY', 'ITEM / REQUIREMENT TITLE', 'RESPONSIBLE', 'DUE / PROG', 'STATUS'];

  doc.setFillColor(...charcoalColor);
  doc.rect(margin, y, contentWidth, 6.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);

  let curX = margin;
  headers.forEach((h, i) => {
    doc.text(h, curX + 2, y + 4.5);
    curX += colWidths[i];
  });

  y += 6.5;

  // Table Rows
  const maxRowsPerPage = 22;
  let rowCountOnPage = 0;

  records.forEach((row, index) => {
    const values = [row.id, row.category || 'General', row.title, row.assigneeOrArtist || '-', row.dueDateOrProgress || '-', row.status];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    const cells = values.map((text, i) => doc.splitTextToSize(text, colWidths[i] - 4));
    const rowHeight = Math.max(6.5, ...cells.map(lines => lines.length * 3 + 3.5));
    // Reserve space for this entire wrapped row.
    if (y + rowHeight > pageHeight - 20) {
      doc.addPage();
      y = margin + 5;
      rowCountOnPage = 0;

      // Repeat Table Header on new page
      doc.setFillColor(...charcoalColor);
      doc.rect(margin, y, contentWidth, 6.5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);

      let hX = margin;
      headers.forEach((h, i) => {
        doc.text(h, hX + 2, y + 4.5);
        hX += colWidths[i];
      });

      y += 6.5;
    }

    const isEven = index % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 246, isEven ? 255 : 242);
    doc.rect(margin, y, contentWidth, rowHeight, 'F');
    doc.setDrawColor(...goldColor);
    doc.setLineWidth(0.15);
    doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);

    doc.setFont('courier', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...mutedColor);

    // ID
    curX = margin;
    doc.text(cells[0], curX + 2, y + 4.5);

    // Category
    curX += colWidths[0];
    doc.setFont('helvetica', 'normal');
    doc.text(cells[1], curX + 2, y + 4.5);

    // Title
    curX += colWidths[1];
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...charcoalColor);
    doc.text(cells[2], curX + 2, y + 4.5);

    // Assignee/Artist
    curX += colWidths[2];
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedColor);
    doc.text(cells[3], curX + 2, y + 4.5);

    // Due / Progress
    curX += colWidths[3];
    doc.text(cells[4], curX + 2, y + 4.5);

    // Status
    curX += colWidths[4];
    doc.setFont('helvetica', 'bold');
    if (row.status.toLowerCase().includes('critical') || row.status.toLowerCase().includes('escalated')) {
      doc.setTextColor(...brickColor);
    } else if (row.status.toLowerCase().includes('resolved') || row.status.toLowerCase().includes('completed')) {
      doc.setTextColor(40, 120, 80);
    } else {
      doc.setTextColor(...charcoalColor);
    }
    doc.text(cells[5], curX + 2, y + 4.5);

    y += rowHeight;
    rowCountOnPage++;
  });

  // Footer / Institutional Sign-off Block
  if (y > pageHeight - 35) {
    doc.addPage();
    y = margin + 10;
  } else {
    y += 8;
  }

  doc.setDrawColor(...goldColor);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // Verification stamps & signature lines
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...charcoalColor);
  doc.text('DEMONSTRATION OUTPUT - NOT AN APPROVAL:', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...mutedColor);
  doc.text('This report contains sample data from a browser-only prototype.', margin, y + 4);
  doc.text('No identity, delegation, payment, signature, or institutional compliance has been verified.', margin, y + 7.5);

  // Illustrative review columns
  const sigY = y + 14;
  doc.setDrawColor(...mutedColor);
  doc.setLineWidth(0.3);

  // Sig 1
  doc.line(margin, sigY, margin + 45, sigY);
  doc.text('Proposed coordination review', margin, sigY + 3.5);

  // Sig 2
  doc.line(margin + 65, sigY, margin + 110, sigY);
  doc.text('Proposed technical review', margin + 65, sigY + 3.5);

  // Sig 3
  doc.line(margin + 130, sigY, margin + 175, sigY);
  doc.text('Proposed records review', margin + 130, sigY + 3.5);

  // Bottom footer page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...mutedColor);
    doc.text(`SADU ART PLATFORM • SAMPLE REPORT • PAGE ${i} OF ${totalPages}`, margin, pageHeight - 6);
    doc.text(`DOC-ID: ${refNumber}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  return doc;
};

export const downloadInstitutionalPdfReport = (
  meta: ReportFilterMetadata,
  metrics: KpiSummaryMetric[],
  records: Array<{
    id: string;
    title: string;
    category?: string;
    priority?: string;
    status: string;
    assigneeOrArtist?: string;
    dueDateOrProgress?: string;
  }>
) => {
  const doc = generateInstitutionalPdf(meta, metrics, records);
  const cleanName = meta.programmeName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const filename = `sadu-kpi-report-${cleanName}-${meta.statusFilter}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
};

// Built-in PDF fonts cannot safely render Arabic or mixed-script content.
export function requiresBrowserPrint(...values: unknown[]): boolean {
  // Keep the baseline notice and dedicated dimensions column in the rendered export.
  if (values.some(value => typeof value === 'object' && value !== null && 'scopeMode' in value && value.scopeMode === 'unfiltered-sample')) return true;
  return /[^\x00-\x7F]/.test(JSON.stringify(values));
}
