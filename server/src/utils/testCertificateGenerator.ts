// Certificate generator for test completion
import PDFDocument from 'pdfkit';
import { randomBytes } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export async function generateTestCompletionCertificate(
  user: {
    firstName: string;
    lastName: string;
    email: string;
    country?: string | null;
    department?: string | null;
    role?: string | null;
    passportId?: string;
  },
  test: {
    title: string;
    score?: number;
    maxScore?: number;
    passed?: boolean;
  },
  completionDate: Date
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Page setup
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 50;
      const borderWidth = 3;

      // INARA Theme Colors
      const inaraBlue = '#1e40af';
      const inaraLightBlue = '#3b82f6';

      // Decorative border
      doc.rect(margin, margin, pageWidth - (margin * 2), pageHeight - (margin * 2))
         .lineWidth(borderWidth)
         .stroke(inaraBlue);

      // Add INARA logo
      const possiblePaths = [
        path.join(process.cwd(), 'server', 'public', 'uploads', 'inara-logo.png'),
        path.join(process.cwd(), 'client', 'public', 'inara-logo.png'),
        path.join(process.cwd(), 'inara-logo.png'),
        path.join(__dirname, '..', '..', 'public', 'uploads', 'inara-logo.png'),
      ];

      let logoFile = '';
      for (const logoPath of possiblePaths) {
        if (fs.existsSync(logoPath)) {
          logoFile = logoPath;
          break;
        }
      }

      doc.y = margin + 40;

      if (logoFile) {
        try {
          const logoSize = 90;
          const logoX = (pageWidth - logoSize) / 2;
          const logoBuffer = fs.readFileSync(logoFile);
          doc.image(logoBuffer, logoX, doc.y, {
            width: logoSize,
            height: logoSize,
            fit: [logoSize, logoSize],
            align: 'center'
          });
          doc.y += logoSize + 25;
        } catch (error: any) {
          console.error('Error adding logo:', error);
        }
      }

      // Header
      doc.fontSize(20)
         .fillColor(inaraBlue)
         .font('Helvetica-Bold')
         .text('INARA TEST COMPLETION CERTIFICATE', { align: 'center' });

      doc.moveDown(1);

      // Decorative line
      const lineY1 = doc.y;
      doc.moveTo(margin + 50, lineY1)
         .lineTo(pageWidth - margin - 50, lineY1)
         .lineWidth(1)
         .stroke(inaraBlue);

      doc.moveDown(1.5);

      // Certificate Title
      doc.fontSize(18)
         .fillColor('#111827')
         .font('Helvetica-Bold')
         .text('CERTIFICATE OF TEST COMPLETION', { align: 'center' });

      doc.moveDown(2);

      // Certificate Body
      doc.fontSize(14)
         .fillColor('#374151')
         .font('Helvetica')
         .text('This is to certify that', { align: 'center' });

      doc.moveDown(1);

      // Decorative line
      const lineY2 = doc.y;
      doc.moveTo(margin + 50, lineY2)
         .lineTo(pageWidth - margin - 50, lineY2)
         .lineWidth(1)
         .stroke(inaraBlue);

      doc.moveDown(1.5);

      // Staff Member Name
      const roleWords = ['ADMIN', 'ADMINISTRATOR', 'CEO', 'DIRECTOR', 'MANAGER', 'STAFF'];
      let cleanedFirstName = user.firstName || '';
      let cleanedLastName = user.lastName || '';

      const cleanNamePart = (namePart: string) => {
        if (!namePart) return '';
        const upperNamePart = namePart.toUpperCase();
        for (const roleWord of roleWords) {
          if (upperNamePart.includes(roleWord)) {
            return '';
          }
        }
        return namePart;
      };

      cleanedFirstName = cleanNamePart(user.firstName || '');
      cleanedLastName = cleanNamePart(user.lastName || '');

      let fullName = `${cleanedFirstName} ${cleanedLastName}`.trim();
      if (!fullName && user.firstName) {
        fullName = user.firstName;
      }
      if (!fullName) {
        fullName = '[STAFF NAME]';
      }

      doc.fontSize(22)
         .fillColor(inaraBlue)
         .font('Helvetica-Bold')
         .text(fullName.toUpperCase(), { align: 'center' });

      doc.moveDown(1);

      // Staff Details
      doc.fontSize(11)
         .fillColor('#374151')
         .font('Helvetica')
         .text(`Passport / National ID: ${user.passportId || '[ ID NUMBER ]'}`, { align: 'center' });

      doc.moveDown(0.5);
      doc.text(`Country Office: ${user.country || '[ COUNTRY ]'}`, { align: 'center' });

      doc.moveDown(0.5);
      doc.text(`Department / Role: ${user.department || '[ POSITION / DEPARTMENT ]'}`, { align: 'center' });

      doc.moveDown(1);

      // Decorative line
      const lineY3 = doc.y;
      doc.moveTo(margin + 50, lineY3)
         .lineTo(pageWidth - margin - 50, lineY3)
         .lineWidth(1)
         .stroke(inaraBlue);

      doc.moveDown(1.5);

      // Completion Statement
      doc.fontSize(12)
         .fillColor('#374151')
         .font('Helvetica')
         .text('has successfully completed the following test:', { align: 'center' });

      doc.moveDown(1);

      // Test Title
      doc.fontSize(16)
         .fillColor(inaraBlue)
         .font('Helvetica-Bold')
         .text(test.title, { align: 'center' });

      doc.moveDown(1);

      // Test Score (if available)
      if (test.score !== undefined && test.maxScore !== undefined) {
        doc.fontSize(12)
           .fillColor('#374151')
           .font('Helvetica')
           .text(`Score: ${test.score} / ${test.maxScore} (${((test.score / test.maxScore) * 100).toFixed(1)}%)`, { align: 'center' });
        
        if (test.passed !== undefined) {
          doc.moveDown(0.5);
          doc.fontSize(12)
             .fillColor(test.passed ? '#059669' : '#dc2626')
             .font('Helvetica-Bold')
             .text(test.passed ? 'PASSED' : 'NOT PASSED', { align: 'center' });
        }
      }

      doc.moveDown(1.5);

      // Decorative line
      const lineY4 = doc.y;
      doc.moveTo(margin + 50, lineY4)
         .lineTo(pageWidth - margin - 50, lineY4)
         .lineWidth(1)
         .stroke(inaraBlue);

      doc.moveDown(1.5);

      // Certificate Reference
      doc.fontSize(14)
         .fillColor(inaraBlue)
         .font('Helvetica-Bold')
         .text('CERTIFICATE REFERENCE', { align: 'center' });

      doc.moveDown(1);

      const certificateId = `INARA-TEST-${completionDate.getFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`;
      const validUntil = new Date(completionDate);
      validUntil.setFullYear(validUntil.getFullYear() + 1);

      doc.fontSize(10)
         .fillColor('#374151')
         .font('Helvetica')
         .text(`Certificate ID: ${certificateId}`, { align: 'center' });

      doc.moveDown(0.5);
      doc.text(`Issue Date: ${completionDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}`, { align: 'center' });

      doc.moveDown(0.5);
      doc.text(`Valid Until: ${validUntil.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}`, { align: 'center' });

      doc.moveDown(1.5);

      // Decorative line
      const lineY5 = doc.y;
      doc.moveTo(margin + 50, lineY5)
         .lineTo(pageWidth - margin - 50, lineY5)
         .lineWidth(1)
         .stroke(inaraBlue);

      doc.moveDown(1.5);

      // Authorized By
      doc.fontSize(14)
         .fillColor(inaraBlue)
         .font('Helvetica-Bold')
         .text('AUTHORIZED BY', { align: 'center' });

      doc.moveDown(1);

      doc.fontSize(12)
         .fillColor('#374151')
         .font('Helvetica-Bold')
         .text('INARA Global Governance & Compliance Office', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

