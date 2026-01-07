import PDFDocument from 'pdfkit';
import { randomBytes } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export async function generateOrientationCertificate(
  user: { 
    firstName: string; 
    lastName: string; 
    email: string;
    country?: string | null;
    department?: string | null;
    role?: string | null;
    passportId?: string;
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
      const inaraBlue = '#1e40af';      // Primary blue
      const inaraLightBlue = '#3b82f6';  // Light blue
      
      // Decorative border with INARA blue
      doc.rect(margin, margin, pageWidth - (margin * 2), pageHeight - (margin * 2))
         .lineWidth(borderWidth)
         .stroke(inaraBlue);

      // Add INARA logo at the top center
      // Try multiple paths to find the logo
      const possiblePaths = [
        path.join(process.cwd(), 'server', 'public', 'uploads', 'inara-logo.png'),
        path.join(process.cwd(), 'client', 'public', 'inara-logo.png'),
        path.join(process.cwd(), 'inara-logo.png'),
        path.join(__dirname, '..', '..', 'public', 'uploads', 'inara-logo.png'),
        path.join(__dirname, '..', '..', '..', 'client', 'public', 'inara-logo.png'),
      ];
      
      let logoFile = '';
      let logoExists = false;
      
      // Check each possible path (only in non-Vercel environments)
      if (!process.env.VERCEL) {
        for (const logoPath of possiblePaths) {
          if (fs.existsSync(logoPath)) {
            logoExists = true;
            logoFile = logoPath;
            console.log('✅ Found INARA logo at:', logoFile);
            break;
          }
        }
      }

      // Header with logo - positioned with more space from top edge
      doc.y = margin + 40; // Increased from 20 to 40 for more space from top
      
      if (logoExists && logoFile && !process.env.VERCEL) {
        try {
          // Add logo at the top center - make it more prominent
          const logoSize = 90; // Increased size for better visibility
          const logoX = (pageWidth - logoSize) / 2; // Center horizontally
          
          // Read the logo file as buffer to ensure it's accessible
          const logoBuffer = fs.readFileSync(logoFile);
          
          // Add logo with proper error handling
          doc.image(logoBuffer, logoX, doc.y, { 
            width: logoSize, 
            height: logoSize,
            fit: [logoSize, logoSize],
            align: 'center'
          });
          
          doc.y += logoSize + 25; // Increased spacing after logo (from 20 to 25)
          console.log('✅ INARA logo added to certificate successfully at position:', logoX, doc.y - logoSize - 25);
        } catch (error: any) {
          console.warn('⚠️ Error adding logo to certificate (continuing without logo):', error.message);
          // Continue without logo if there's an error
        }
      } else {
        // In Vercel or if logo not found, continue without logo
        if (process.env.VERCEL) {
          console.log('ℹ️ Running in Vercel - logo will be skipped (filesystem not available)');
        } else {
          console.log('ℹ️ INARA logo not found - certificate will be generated without logo');
        }
      }

      // Header text
      doc.fontSize(20)
         .fillColor(inaraBlue)
         .font('Helvetica-Bold')
         .text('INARA STAFF ONBOARDING & ORIENTATION CERTIFICATE', { align: 'center' });

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
         .text('CERTIFICATE OF OFFICIAL INSTITUTIONAL READINESS', { align: 'center' });

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
         .stroke('#1e40af');

      doc.moveDown(1.5);

      // Staff Member Name (only first and last name, no role)
      // Clean the name - remove any role text that might be in firstName or lastName
      let firstName = (user.firstName || '').trim();
      let lastName = (user.lastName || '').trim();
      
      // Remove common role suffixes if they appear in the name fields
      const roleSuffixes = ['ADMIN', 'ADMINISTRATOR', 'CEO', 'DIRECTOR', 'MANAGER', 'STAFF'];
      firstName = firstName.replace(new RegExp(`\\s*(${roleSuffixes.join('|')})\\s*$`, 'i'), '').trim();
      lastName = lastName.replace(new RegExp(`\\s*(${roleSuffixes.join('|')})\\s*$`, 'i'), '').trim();
      
      // Only use firstName if lastName is empty or contains role words
      const fullName = lastName && !roleSuffixes.some(role => lastName.toUpperCase().includes(role))
        ? `${firstName} ${lastName}`.trim().toUpperCase()
        : firstName.toUpperCase();
      
      doc.fontSize(22)
         .fillColor(inaraBlue)
         .font('Helvetica-Bold')
         .text(fullName, { align: 'center' });

      doc.moveDown(1);

      // Staff Details
      doc.fontSize(11)
         .fillColor('#374151')
         .font('Helvetica')
         .text(`Passport / National ID: ${user.passportId || '[ ID NUMBER ]'}`, { align: 'center' });
      
      doc.moveDown(0.5);
      doc.text(`Country Office: ${user.country || '[ COUNTRY ]'}`, { align: 'center' });
      
      doc.moveDown(0.5);
      // Department field is now free text (can contain role, department, or both)
      const deptRole = user.department || '[ POSITION / DEPARTMENT ]';
      doc.text(`Department / Role: ${deptRole}`, { align: 'center' });

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
         .text('has successfully completed all mandatory onboarding, institutional orientation,', { align: 'center' });
      
      doc.moveDown(0.5);
      doc.text('safeguarding awareness, code of conduct acknowledgement, and compliance', { align: 'center' });
      
      doc.moveDown(0.5);
      doc.text('requirements of:', { align: 'center' });

      doc.moveDown(1);
      
      // Decorative line
      const lineY4 = doc.y;
      doc.moveTo(margin + 50, lineY4)
         .lineTo(pageWidth - margin - 50, lineY4)
         .lineWidth(1)
         .stroke(inaraBlue);

      doc.moveDown(1.5);

      // INARA Name
      doc.fontSize(18)
         .fillColor(inaraBlue)
         .font('Helvetica-Bold')
         .text('INARA', { align: 'center' });
      
      doc.moveDown(0.5);
      doc.fontSize(12)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text('International Network for Aid, Relief and Assistance', { align: 'center' });

      doc.moveDown(1.5);
      
      doc.fontSize(12)
         .fillColor('#374151')
         .font('Helvetica')
         .text('and is hereby recognized as an Officially Authorized INARA Staff Member,', { align: 'center' });
      
      doc.moveDown(0.5);
      doc.text('having demonstrated full understanding of:', { align: 'center' });

      doc.moveDown(1);
      
      // Decorative line
      const lineY5 = doc.y;
      doc.moveTo(margin + 50, lineY5)
         .lineTo(pageWidth - margin - 50, lineY5)
         .lineWidth(1)
         .stroke(inaraBlue);

      doc.moveDown(1);

      // Bullet Points
      const bulletPoints = [
        "INARA's mission, values, and humanitarian principles",
        'Safeguarding and accountability standards',
        'Internal policies and code of conduct',
        'Operational compliance and ethical responsibilities',
        'Institutional systems and reporting frameworks',
      ];

      doc.fontSize(11)
         .fillColor('#374151')
         .font('Helvetica');
      
      bulletPoints.forEach((point, index) => {
        doc.text(`• ${point}`, margin + 60, doc.y, {
          width: pageWidth - (margin * 2) - 120,
        });
        if (index < bulletPoints.length - 1) {
          doc.moveDown(0.4);
        }
      });

      doc.moveDown(1.5);
      
      // Decorative line
      const lineY6 = doc.y;
      doc.moveTo(margin + 50, lineY6)
         .lineTo(pageWidth - margin - 50, lineY6)
         .lineWidth(1)
         .stroke('#1e40af');

      doc.moveDown(1.5);

      // STATUS GRANTED Section
      doc.fontSize(14)
         .fillColor(inaraBlue)
         .font('Helvetica-Bold')
         .text('STATUS GRANTED', { align: 'center' });

      doc.moveDown(1);

      doc.fontSize(11)
         .fillColor('#374151')
         .font('Helvetica')
         .text('The above-named individual is formally cleared and authorized to:', { align: 'center' });

      doc.moveDown(1);

      const authorizations = [
        'Access INARA operational systems',
        'Represent INARA in professional capacity',
        'Participate in INARA humanitarian programs',
        'Engage with beneficiaries, partners, and donors',
        "Operate under INARA's global governance and compliance framework",
      ];

      authorizations.forEach((auth, index) => {
        const currentY = doc.y;
        doc.fontSize(11)
           .fillColor(inaraBlue)
           .font('Helvetica-Bold')
           .text('✔', margin + 60, currentY);
        
        doc.fontSize(11)
           .fillColor('#374151')
           .font('Helvetica')
           .text(auth, margin + 80, currentY, {
             width: pageWidth - (margin * 2) - 140 
           });
        
        if (index < authorizations.length - 1) {
          doc.moveDown(0.5);
        }
      });

      doc.moveDown(1.5);
      
      // Decorative line
      const lineY7 = doc.y;
      doc.moveTo(margin + 50, lineY7)
         .lineTo(pageWidth - margin - 50, lineY7)
         .lineWidth(1)
         .stroke(inaraBlue);

      doc.moveDown(1.5);

      // CERTIFICATE REFERENCE Section
      doc.fontSize(14)
         .fillColor(inaraBlue)
         .font('Helvetica-Bold')
         .text('CERTIFICATE REFERENCE', { align: 'center' });

      doc.moveDown(1);

      // Generate certificate ID
      const certificateId = `INARA-OR-${completionDate.getFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`;
      const validUntil = new Date(completionDate);
      validUntil.setFullYear(validUntil.getFullYear() + 1); // Valid for 1 year

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

      doc.moveDown(1);
      
      doc.fontSize(9)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text('This certificate remains valid only while the holder maintains active compliance', { align: 'center' });
      
      doc.moveDown(0.3);
      doc.text("with INARA's mandatory training, safeguarding, and policy recertification requirements.", { align: 'center' });

      doc.moveDown(1.5);
      
      // Decorative line
      const lineY8 = doc.y;
      doc.moveTo(margin + 50, lineY8)
         .lineTo(pageWidth - margin - 50, lineY8)
         .lineWidth(1)
         .stroke(inaraBlue);

      doc.moveDown(1.5);

      // AUTHORIZED BY Section
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

