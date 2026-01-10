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
          <title>Certificate of Completion - ${courseTitle}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            html, body {
              width: 100%;
              height: 100%;
              background: white;
              font-family: 'Georgia', serif;
            }
            
            body {
              padding: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            
            @page {
              size: letter;
              margin: 0;
            }
            
            .certificate {
              width: 8.5in;
              height: 11in;
              padding: 60px;
              background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
              border: 4px solid #0066CC;
              text-align: center;
              color-adjust: exact;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              flex-shrink: 0;
            }
            
            .logo-section {
              margin-bottom: 25px;
            }
            
            .logo-text {
              font-size: 28px;
              font-weight: bold;
              background: linear-gradient(135deg, #FFC627 0%, #E91E8C 25%, #00C9B7 50%, #0066CC 75%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              letter-spacing: 3px;
              color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            
            .title {
              font-size: 42px;
              font-weight: bold;
              color: #0066CC;
              margin-bottom: 18px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            
            .awarded-to {
              font-size: 14px;
              color: #475569;
              margin-bottom: 15px;
              font-style: italic;
            }
            
            .participant-name {
              font-size: 32px;
              font-weight: bold;
              background: linear-gradient(135deg, #0066CC 0%, #E91E8C 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              margin-bottom: 15px;
              border-bottom: 3px solid;
              border-image: linear-gradient(to right, #FFC627, #E91E8C, #00C9B7, #0066CC) 1;
              padding-bottom: 12px;
              color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            
            .in-recognition {
              font-size: 13px;
              color: #475569;
              margin-bottom: 10px;
            }
            
            .course-title {
              font-size: 22px;
              font-weight: bold;
              background: linear-gradient(135deg, #E91E8C 0%, #FFC627 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              margin-bottom: 20px;
              font-style: italic;
              color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            
            .description {
              font-size: 12px;
              color: #64748b;
              line-height: 1.5;
              margin-bottom: 20px;
            }
            
            .details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 18px;
              font-size: 11px;
              margin-bottom: 20px;
              border-top: 2px solid;
              border-bottom: 2px solid;
              border-image: linear-gradient(to right, #FFC627, #E91E8C, #00C9B7, #0066CC) 1;
              padding: 18px 0;
            }
            
            .detail-item {
              text-align: left;
            }
            
            .detail-label {
              font-weight: bold;
              background: linear-gradient(135deg, #0066CC 0%, #00C9B7 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              margin-bottom: 4px;
              font-size: 10px;
              color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            
            .detail-value {
              color: #475569;
              font-size: 11px;
            }
            
            .footer {
              font-size: 10px;
              color: #94a3b8;
              margin-bottom: 15px;
              font-style: italic;
            }
            
            .seal {
              display: inline-flex;
              width: 70px;
              height: 70px;
              border: 3px solid;
              border-image: linear-gradient(135deg, #FFC627 0%, #E91E8C 25%, #00C9B7 50%, #0066CC 75%) 1;
              border-radius: 50%;
              align-items: center;
              justify-content: center;
              font-size: 36px;
              color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              .certificate {
                margin: 0;
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="certificate">
            <div class="logo-section">
              <div class="logo-text">⟨ INARA ⟩</div>
            </div>
            
            <div class="title">Certificate of Completion</div>
            
            <div class="awarded-to">This certificate is awarded to</div>
            
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
                <div class="detail-value">${score}% (${passingScore}% required)</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Status</div>
                <div class="detail-value">✓ PASSED</div>
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
          width: '100%',
          maxWidth: '900px',
          margin: '0 auto',
          padding: '60px',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)',
          border: '4px solid #0066CC',
          borderRadius: '10px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          position: 'relative',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <img
            src="/inara-logo.png"
            alt="INARA Logo"
            style={{
              maxWidth: '100px',
              height: 'auto',
              marginBottom: '10px',
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div
            style={{
              fontSize: '26px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #FFC627 0%, #E91E8C 25%, #00C9B7 50%, #0066CC 75%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '3px',
            }}
          >
            ⟨ INARA ⟩
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '42px',
            fontWeight: 'bold',
            color: '#0066CC',
            marginBottom: '18px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          Certificate of Completion
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '14px',
            color: '#475569',
            marginBottom: '15px',
            fontStyle: 'italic',
          }}
        >
          This certificate is awarded to
        </div>

        {/* Participant Name */}
        <div
          style={{
            fontSize: '32px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #0066CC 0%, #E91E8C 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '15px',
            borderBottom: '3px solid',
            borderImage: 'linear-gradient(to right, #FFC627, #E91E8C, #00C9B7, #0066CC) 1',
            paddingBottom: '12px',
          }}
        >
          {participantName}
        </div>

        {/* In Recognition */}
        <div
          style={{
            fontSize: '13px',
            color: '#475569',
            marginBottom: '10px',
          }}
        >
          in recognition of the successful completion of the course
        </div>

        {/* Course Title */}
        <div
          style={{
            fontSize: '22px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #E91E8C 0%, #FFC627 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '20px',
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
            lineHeight: '1.5',
            marginBottom: '20px',
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
            gap: '18px',
            fontSize: '11px',
            color: '#475569',
            marginBottom: '20px',
            borderTop: '2px solid',
            borderBottom: '2px solid',
            borderImage: 'linear-gradient(to right, #FFC627, #E91E8C, #00C9B7, #0066CC) 1',
            padding: '18px 0',
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <div
              style={{
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #0066CC 0%, #00C9B7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '4px',
                fontSize: '10px',
              }}
            >
              Date of Completion
            </div>
            <div style={{ color: '#475569' }}>{formattedDate}</div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div
              style={{
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #0066CC 0%, #00C9B7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '4px',
                fontSize: '10px',
              }}
            >
              Certificate ID
            </div>
            <div style={{ color: '#475569' }}>{certificateId}</div>
          </div>
          {score !== undefined && passingScore !== undefined && (
            <>
              <div style={{ textAlign: 'left' }}>
                <div
                  style={{
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #0066CC 0%, #00C9B7 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom: '4px',
                    fontSize: '10px',
                  }}
                >
                  Assessment Score
                </div>
                <div style={{ color: '#16a34a', fontWeight: 'bold' }}>
                  {score}% ({passingScore}% required)
                </div>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div
                  style={{
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #0066CC 0%, #00C9B7 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom: '4px',
                    fontSize: '10px',
                  }}
                >
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
            fontSize: '10px',
            color: '#94a3b8',
            marginBottom: '15px',
            fontStyle: 'italic',
          }}
        >
          This certificate is issued in digital format and is valid without a physical signature.
        </div>

        {/* Seal */}
        <div
          style={{
            display: 'inline-flex',
            width: '70px',
            height: '70px',
            border: '3px solid',
            borderImage: 'linear-gradient(135deg, #FFC627 0%, #E91E8C 25%, #00C9B7 50%, #0066CC 75%) 1',
            borderRadius: '50%',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '10px',
            fontSize: '36px',
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
