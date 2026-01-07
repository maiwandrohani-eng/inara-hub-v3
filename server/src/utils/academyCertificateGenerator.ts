// INARA Academy - Certificate Generator
// Generates branded PDF certificates for course completion

import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

interface CertificateData {
  fullName: string;
  courseTitle: string;
  completionDate: Date;
  expiryDate?: Date;
  score?: number;
  passingScore: number;
  passed: boolean;
  certificateNumber: string;
  signedBy?: string;
}

/**
 * Generate a branded PDF certificate for course completion
 * Returns a buffer instead of writing to file (for R2 upload)
 */
export async function generateAcademyCertificate(
  data: CertificateData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      // Collect PDF data in memory
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Background color
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#1a1a2e');

      // Header with INARA branding
      doc.fillColor('#ffffff')
        .fontSize(32)
        .font('Helvetica-Bold')
        .text('INARA ACADEMY', 50, 80, { align: 'center' });

      doc.fillColor('#60a5fa')
        .fontSize(16)
        .font('Helvetica')
        .text('Official Learning & Certification Platform', 50, 120, { align: 'center' });

      // Decorative line
      doc.strokeColor('#60a5fa')
        .lineWidth(2)
        .moveTo(100, 160)
        .lineTo(doc.page.width - 100, 160)
        .stroke();

      // Certificate Title
      doc.fillColor('#ffffff')
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('CERTIFICATE OF COMPLETION', 50, 200, { align: 'center' });

      // Certificate text
      doc.fillColor('#e5e7eb')
        .fontSize(14)
        .font('Helvetica')
        .text('This is to certify that', 50, 260, { align: 'center' });

      // Recipient name
      doc.fillColor('#60a5fa')
        .fontSize(28)
        .font('Helvetica-Bold')
        .text(data.fullName.toUpperCase(), 50, 290, { align: 'center' });

      // Course completion text
      doc.fillColor('#e5e7eb')
        .fontSize(14)
        .font('Helvetica')
        .text('has successfully completed the course', 50, 340, { align: 'center' });

      // Course title
      doc.fillColor('#ffffff')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text(data.courseTitle, 50, 370, { align: 'center', width: doc.page.width - 100 });

      // Score and details
      if (data.score !== undefined) {
        doc.fillColor('#e5e7eb')
          .fontSize(12)
          .font('Helvetica')
          .text(`Final Score: ${data.score}% (Passing: ${data.passingScore}%)`, 50, 420, { align: 'center' });
      }

      // Completion date
      doc.fillColor('#e5e7eb')
        .fontSize(12)
        .font('Helvetica')
        .text(
          `Completed on: ${data.completionDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}`,
          50,
          450,
          { align: 'center' }
        );

      // Expiry date if applicable
      if (data.expiryDate) {
        doc.fillColor('#fbbf24')
          .fontSize(11)
          .font('Helvetica-Oblique')
          .text(
            `Certificate expires on: ${data.expiryDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}`,
            50,
            480,
            { align: 'center' }
          );
      }

      // Certificate number
      doc.fillColor('#9ca3af')
        .fontSize(10)
        .font('Helvetica')
        .text(`Certificate Number: ${data.certificateNumber}`, 50, 520, { align: 'center' });

      // Signature section
      const signatureY = 580;
      doc.fillColor('#e5e7eb')
        .fontSize(12)
        .font('Helvetica')
        .text('Signed by:', 100, signatureY);

      if (data.signedBy) {
        doc.fillColor('#ffffff')
          .fontSize(14)
          .font('Helvetica-Bold')
          .text(data.signedBy, 100, signatureY + 25);
      } else {
        doc.fillColor('#ffffff')
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('INARA Academy Director', 100, signatureY + 25);
      }

      doc.fillColor('#e5e7eb')
        .fontSize(10)
        .font('Helvetica')
        .text(
          data.completionDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          100,
          signatureY + 50
        );

      // Footer
      doc.fillColor('#6b7280')
        .fontSize(9)
        .font('Helvetica')
        .text(
          'This certificate is issued by INARA (International Network for Aid, Relief and Assistance)',
          50,
          doc.page.height - 80,
          { align: 'center' }
        );

      doc.fillColor('#6b7280')
        .fontSize(8)
        .font('Helvetica')
        .text('For verification, contact academy@inara.org', 50, doc.page.height - 60, { align: 'center' });

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate unique certificate number
 */
export function generateCertificateNumber(trainingId: string, userId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const trainingShort = trainingId.substring(0, 6).toUpperCase();
  const userShort = userId.substring(0, 6).toUpperCase();
  return `INARA-${trainingShort}-${userShort}-${timestamp}`;
}

