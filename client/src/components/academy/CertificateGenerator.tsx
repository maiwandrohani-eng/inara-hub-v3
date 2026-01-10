import { useRef } from 'react';

interface CertificateGeneratorProps {
  participantName: string;
  courseTitle: string;
  completionDate: Date;
  certificateId: string;
  score?: number;
  passingScore?: number;
}

export default function CertificateGenerator({
  participantName,
  courseTitle,
  completionDate,
  certificateId,
  score,
  passingScore,
}: CertificateGeneratorProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!certificateRef.current) return;

    const printWindow = window.open('', '', 'height=800,width=1000');
    if (!printWindow) return;

    const certificateHTML = certificateRef.current.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificate of Completion - ${courseTitle}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Georgia', serif;
              background: white;
              padding: 20px;
            }
            @media print {
              body {
                padding: 0;
              }
              .certificate {
                page-break-after: avoid;
              }
            }
            .certificate {
              width: 8.5in;
              height: 11in;
              margin: 0 auto;
              padding: 60px;
              background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
              border: 3px solid #1e40af;
              border-radius: 10px;
              text-align: center;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
              position: relative;
              overflow: hidden;
            }
            
            .certificate::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 3px;
              background: linear-gradient(to right, #1e40af, #7c3aed, #1e40af);
            }
            
            .certificate::after {
              content: '';
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              height: 3px;
              background: linear-gradient(to right, #1e40af, #7c3aed, #1e40af);
            }

            .logo {
              text-align: center;
              margin-bottom: 30px;
            }

            .logo img {
              max-width: 120px;
              height: auto;
            }

            .title {
              font-size: 48px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 20px;
              text-transform: uppercase;
              letter-spacing: 2px;
            }

            .subtitle {
              font-size: 18px;
              color: #475569;
              margin-bottom: 30px;
              font-style: italic;
            }

            .awarded-to {
              font-size: 14px;
              color: #64748b;
              margin-bottom: 10px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }

            .participant-name {
              font-size: 36px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 20px;
              border-bottom: 2px solid #7c3aed;
              padding-bottom: 10px;
            }

            .in-recognition {
              font-size: 14px;
              color: #475569;
              margin-bottom: 10px;
            }

            .course-title {
              font-size: 24px;
              font-weight: bold;
              color: #7c3aed;
              margin-bottom: 25px;
              font-style: italic;
            }

            .description {
              font-size: 12px;
              color: #64748b;
              line-height: 1.6;
              margin-bottom: 30px;
              max-width: 600px;
              margin-left: auto;
              margin-right: auto;
            }

            .details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              font-size: 12px;
              color: #475569;
              margin-bottom: 20px;
              border-top: 1px solid #e2e8f0;
              border-bottom: 1px solid #e2e8f0;
              padding: 20px 0;
            }

            .detail-item {
              text-align: left;
            }

            .detail-label {
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 5px;
            }

            .detail-value {
              color: #475569;
            }

            .score-display {
              font-size: 14px;
              color: #16a34a;
              font-weight: bold;
              margin-bottom: 5px;
            }

            .footer {
              font-size: 11px;
              color: #94a3b8;
              margin-top: 20px;
              font-style: italic;
            }

            .seal {
              display: inline-block;
              width: 80px;
              height: 80px;
              border: 2px solid #7c3aed;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-top: 10px;
              font-size: 40px;
            }

            @media print {
              body {
                background: white;
              }
              .certificate {
                box-shadow: none;
                margin: 0;
                width: 100%;
                height: 100%;
              }
            }
          </style>
        </head>
        <body>
          ${certificateHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const formattedDate = completionDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">🎓 Certificate of Completion</h2>
        <button
          onClick={handlePrint}
          className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center gap-2 font-medium"
        >
          🖨️ Print Certificate
        </button>
      </div>

      <div
        ref={certificateRef}
        className="certificate"
        style={{
          width: '8.5in',
          height: '11in',
          margin: '0 auto',
          padding: '60px',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)',
          border: '3px solid #1e40af',
          borderRadius: '10px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#1e40af',
              letterSpacing: '2px',
            }}
          >
            ⟨ INARA ⟩
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#1e40af',
            marginBottom: '20px',
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}
        >
          Certificate of Completion
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '18px',
            color: '#475569',
            marginBottom: '30px',
            fontStyle: 'italic',
          }}
        >
          This certificate is awarded to
        </div>

        {/* Participant Name */}
        <div
          style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#1e40af',
            marginBottom: '20px',
            borderBottom: '2px solid #7c3aed',
            paddingBottom: '10px',
          }}
        >
          {participantName}
        </div>

        {/* In Recognition */}
        <div
          style={{
            fontSize: '14px',
            color: '#475569',
            marginBottom: '10px',
          }}
        >
          in recognition of the successful completion of the course
        </div>

        {/* Course Title */}
        <div
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#7c3aed',
            marginBottom: '25px',
            fontStyle: 'italic',
          }}
        >
          {courseTitle}
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: '12px',
            color: '#64748b',
            lineHeight: '1.6',
            marginBottom: '30px',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          The participant has fulfilled all course requirements and demonstrated the expected level
          of engagement and understanding of the course content.
        </div>

        {/* Details */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            fontSize: '12px',
            color: '#475569',
            marginBottom: '20px',
            borderTop: '1px solid #e2e8f0',
            borderBottom: '1px solid #e2e8f0',
            padding: '20px 0',
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 'bold', color: '#1e40af', marginBottom: '5px' }}>
              Date of Completion
            </div>
            <div style={{ color: '#475569' }}>{formattedDate}</div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 'bold', color: '#1e40af', marginBottom: '5px' }}>
              Certificate ID
            </div>
            <div style={{ color: '#475569' }}>{certificateId}</div>
          </div>
          {score !== undefined && passingScore !== undefined && (
            <>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 'bold', color: '#1e40af', marginBottom: '5px' }}>
                  Assessment Score
                </div>
                <div style={{ color: '#16a34a', fontWeight: 'bold' }}>
                  {score}% ({passingScore}% required)
                </div>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 'bold', color: '#1e40af', marginBottom: '5px' }}>
                  Status
                </div>
                <div style={{ color: '#16a34a', fontWeight: 'bold' }}>✓ PASSED</div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            fontSize: '11px',
            color: '#94a3b8',
            marginTop: '20px',
            fontStyle: 'italic',
          }}
        >
          This certificate is issued in digital format and is valid without a physical signature.
        </div>

        {/* Seal */}
        <div
          style={{
            display: 'inline-flex',
            width: '80px',
            height: '80px',
            border: '2px solid #7c3aed',
            borderRadius: '50%',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '10px',
            fontSize: '40px',
          }}
        >
          ✓
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-blue-300 text-sm">
          💡 <strong>Tip:</strong> Click "Print Certificate" to open the print dialog. You can save
          it as a PDF by selecting "Save as PDF" in your printer options.
        </p>
      </div>
    </div>
  );
}
