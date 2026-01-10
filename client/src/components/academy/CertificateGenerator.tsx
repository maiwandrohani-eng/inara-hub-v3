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
    const formattedDate = completionDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const printWindow = window.open('', '', 'height=800,width=1000');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Certificate of Completion - ${courseTitle}</title>
          <link href="https://fonts.googleapis.com/css2?family=Readex+Pro:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            html, body {
              width: 100%;
              height: 100%;
              margin: 0;
              padding: 0;
              background: white;
              font-family: 'Readex Pro', sans-serif;
            }
            
            body {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              padding: 20px;
              color-adjust: exact;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            @page {
              size: letter;
              margin: 0;
            }
            
            .certificate-container {
              width: 8.5in;
              height: 11in;
              padding: 30px 55px;
              background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
              border: 3px solid #0066CC;
              border-radius: 8px;
              text-align: center;
              color-adjust: exact;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              flex-shrink: 0;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
              position: relative;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              align-items: center;
            }
            
            .certificate-container::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-image: url('/inara-logo.png');
              background-size: 350px;
              background-position: center;
              background-repeat: no-repeat;
              opacity: 0.08;
              pointer-events: none;
              z-index: 0;
            }
            
            .certificate-content {
              position: relative;
              z-index: 1;
              width: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            
            .logo-section {
              margin-bottom: 16px;
              width: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 8px;
            }
            
            .logo-image {
              width: 140px;
              height: 140px;
              object-fit: contain;
              margin-bottom: 8px;
            }
            
            .logo-text {
              font-size: 18px;
              font-weight: 700;
              color: #000000;
              letter-spacing: 0.3px;
              line-height: 1.4;
            }
            
            .title {
              font-size: 40px;
              font-weight: 700;
              color: #0066CC;
              margin-bottom: 8px;
              margin-top: 6px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .subtitle {
              font-size: 13px;
              color: #475569;
              margin-bottom: 14px;
              font-style: italic;
            }
            
            .awarded-to {
              font-size: 12px;
              color: #475569;
              margin-bottom: 8px;
              text-transform: uppercase;
              font-weight: 600;
            }
            
            .participant-name {
              font-size: 30px;
              font-weight: 700;
              background: linear-gradient(135deg, #0066CC 0%, #E91E8C 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              margin-bottom: 12px;
              border-bottom: 3px solid;
              border-image: linear-gradient(to right, #FFC627, #E91E8C, #00C9B7, #0066CC) 1;
              padding-bottom: 8px;
              color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            
            .in-recognition {
              font-size: 12px;
              color: #475569;
              margin-bottom: 8px;
              font-weight: 500;
            }
            
            .course-title {
              font-size: 18px;
              font-weight: 700;
              background: linear-gradient(135deg, #E91E8C 0%, #FFC627 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              margin-bottom: 16px;
              font-style: italic;
              color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            
            .description {
              font-size: 10px;
              color: #64748b;
              line-height: 1.5;
              margin-bottom: 14px;
              max-width: 550px;
            }
            
            .details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              font-size: 10px;
              margin-bottom: 12px;
              border-top: 2px solid;
              border-bottom: 2px solid;
              border-image: linear-gradient(to right, #FFC627, #E91E8C, #00C9B7, #0066CC) 1;
              padding: 12px 0;
              width: 100%;
            }
            
            .detail-item {
              text-align: left;
            }
            
            .detail-label {
              font-weight: 600;
              background: linear-gradient(135deg, #0066CC 0%, #00C9B7 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              margin-bottom: 3px;
              font-size: 9px;
              color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            
            .detail-value {
              color: #475569;
              font-size: 10px;
              font-weight: 500;
            }
            
            .score-value {
              color: #16a34a;
              font-weight: 600;
            }
            
            .footer {
              font-size: 9px;
              color: #94a3b8;
              margin-top: 10px;
              margin-bottom: 8px;
              font-style: italic;
            }
            
            .seal {
              display: inline-flex;
              width: 70px;
              height: 70px;
              border: 2px solid;
              border-image: linear-gradient(135deg, #FFC627 0%, #E91E8C 25%, #00C9B7 50%, #0066CC 75%) 1;
              border-radius: 50%;
              align-items: center;
              justify-content: center;
              margin-top: 8px;
              font-size: 36px;
              color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              .certificate-container {
                margin: 0;
                box-shadow: none;
                page-break-after: avoid;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="certificate-container">
            <div class="certificate-content">
              <div class="logo-section">
                <img src="/inara-logo.png" alt="INARA Logo" class="logo-image">
                <div class="logo-text">International Network for Aid, Relief and Assistance</div>
              </div>
            
            <div class="title">Certificate of Completion</div>
            
            <div class="subtitle">This certificate is awarded to</div>
            
            <div class="participant-name">${participantName}</div>
            
            <div class="in-recognition">in recognition of the successful completion of the course</div>
            
            <div class="course-title">${courseTitle}</div>
            
            <div class="description">
              The participant has fulfilled all course requirements and demonstrated the expected level of engagement and understanding of the course content.
            </div>
            
            <div class="details">
              <div class="detail-item">
                <div class="detail-label">Date of Completion</div>
                <div class="detail-value">${formattedDate}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Certificate ID</div>
                <div class="detail-value">${certificateId}</div>
              </div>
              ${score !== undefined && passingScore !== undefined ? `
              <div class="detail-item">
                <div class="detail-label">Assessment Score</div>
                <div class="detail-value score-value">${score}% (${passingScore}% required)</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Status</div>
                <div class="detail-value score-value">✓ PASSED</div>
              </div>
              ` : ''}
            </div>
            
            <div class="footer">
              This certificate is issued in digital format and is valid without a physical signature.
            </div>
            
            <div style="text-align: center;">
              <div class="seal">✓</div>
            </div>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
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
          border: '4px solid',
          borderImage: 'linear-gradient(135deg, #FFC627 0%, #E91E8C 25%, #00C9B7 50%, #0066CC 75%) 1',
          borderRadius: '10px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <img
            src="/inara-logo.png"
            alt="INARA Logo"
            style={{
              maxWidth: '120px',
              height: 'auto',
              marginBottom: '15px',
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div
            style={{
              fontSize: '28px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #FFC627 0%, #E91E8C 25%, #00C9B7 50%, #0066CC 75%, #E91E8C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '3px',
              marginTop: '10px',
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
            color: '#0066CC',
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
            background: 'linear-gradient(135deg, #0066CC 0%, #E91E8C 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '20px',
            borderBottom: '3px solid',
            borderImage: 'linear-gradient(to right, #FFC627, #E91E8C, #00C9B7, #0066CC) 1',
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
            background: 'linear-gradient(135deg, #E91E8C 0%, #FFC627 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
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
            borderTop: '2px solid',
            borderBottom: '2px solid',
            borderImage: 'linear-gradient(to right, #FFC627, #E91E8C, #00C9B7, #0066CC) 1',
            padding: '20px 0',
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 'bold', background: 'linear-gradient(135deg, #0066CC 0%, #00C9B7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '5px' }}>
              Date of Completion
            </div>
            <div style={{ color: '#475569' }}>{formattedDate}</div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 'bold', background: 'linear-gradient(135deg, #0066CC 0%, #00C9B7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '5px' }}>
              Certificate ID
            </div>
            <div style={{ color: '#475569' }}>{certificateId}</div>
          </div>
          {score !== undefined && passingScore !== undefined && (
            <>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 'bold', background: 'linear-gradient(135deg, #0066CC 0%, #00C9B7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '5px' }}>
                  Assessment Score
                </div>
                <div style={{ color: '#16a34a', fontWeight: 'bold' }}>
                  {score}% ({passingScore}% required)
                </div>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 'bold', background: 'linear-gradient(135deg, #0066CC 0%, #00C9B7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '5px' }}>
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
            border: '3px solid',
            borderImage: 'linear-gradient(135deg, #FFC627 0%, #E91E8C 25%, #00C9B7 50%, #0066CC 75%) 1',
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
