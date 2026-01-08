import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

interface CertificateViewerProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: {
    firstName: string;
    lastName: string;
    passportId: string;
    country: string;
    department: string;
  }) => Promise<void>;
  completionDate: Date;
}

export default function CertificateViewer({
  isOpen,
  onClose,
  onComplete,
  completionDate,
}: CertificateViewerProps) {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    passportId: '',
    country: user?.country || '',
    department: user?.department || user?.role || '',
  });

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: prev.firstName || user.firstName || '',
        lastName: prev.lastName || user.lastName || '',
        country: prev.country || user.country || '',
        department: prev.department || user.department || user.role || '',
      }));
    }
  }, [user]);

  // Generate certificate ID
  const certificateId = `INARA-OR-${completionDate.getFullYear()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const validUntil = new Date(completionDate);
  validUntil.setFullYear(validUntil.getFullYear() + 1);

  const handlePrint = () => {
    window.print();
  };

  const handleComplete = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert('Please enter your first name and last name.');
      return;
    }
    if (!formData.passportId.trim()) {
      alert('Please enter your Passport/National ID number.');
      return;
    }
    try {
      await onComplete(formData);
    } catch (error: any) {
      alert(error.message || 'Failed to complete orientation');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: letter;
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          .certificate-container,
          .certificate-container * {
            visibility: visible;
          }
          .certificate-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            page-break-after: avoid;
          }
          .certificate-container > div:first-child {
            display: none !important;
          }
          .certificate-actions,
          .certificate-actions * {
            display: none !important;
          }
          .certificate-form-fields {
            border: none !important;
            border-bottom: 1px solid #000 !important;
            background: transparent !important;
            padding: 2px 4px !important;
            margin: 0 !important;
            box-shadow: none !important;
            outline: none !important;
          }
          .certificate-form-fields:focus {
            border-bottom: 2px solid #000 !important;
          }
        }
      `}</style>
      
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
          {/* Actions Bar */}
          <div className="certificate-actions bg-gray-800 p-4 flex justify-between items-center rounded-t-lg">
            <h2 className="text-xl font-bold text-white">Orientation Certificate</h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Print to PDF</span>
              </button>
              <button
                onClick={handleComplete}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Complete Orientation
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>

          {/* Certificate */}
          <div className="certificate-container bg-white p-8 relative" style={{ minHeight: '11in', width: '8.5in' }}>
            {/* Watermark Logo Background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
              <img 
                src="/inara-logo.png" 
                alt="INARA Watermark" 
                className="opacity-5 object-contain"
                style={{
                  width: '600px',
                  height: '600px'
                }}
                onError={(e) => {
                  // Try alternative paths
                  const img = e.target as HTMLImageElement;
                  if (img.src.includes('/inara-logo.png')) {
                    img.src = '/assets/inara-logo.png';
                  } else {
                    img.style.display = 'none';
                  }
                }}
              />
            </div>

            {/* Border */}
            <div className="border-4 border-blue-800 p-12 h-full relative" style={{ minHeight: '10.5in', zIndex: 1 }}>
              {/* Logo */}
              <div className="text-center mb-6">
                <img 
                  src="/inara-logo.png" 
                  alt="INARA Logo" 
                  className="mx-auto h-20 w-20 object-contain"
                  onError={(e) => {
                    // Try alternative paths
                    const img = e.target as HTMLImageElement;
                    if (img.src.includes('/inara-logo.png')) {
                      img.src = '/assets/inara-logo.png';
                    } else {
                      img.style.display = 'none';
                    }
                  }}
                />
              </div>

              {/* Header */}
              <h1 className="text-2xl font-bold text-blue-800 text-center mb-4">
                INARA STAFF ONBOARDING & ORIENTATION CERTIFICATE
              </h1>
              
              <div className="border-t-2 border-blue-800 my-4"></div>

              {/* Certificate Title */}
              <h2 className="text-xl font-bold text-gray-900 text-center mb-6">
                CERTIFICATE OF OFFICIAL INSTITUTIONAL READINESS
              </h2>

              {/* Certificate Body */}
              <p className="text-base text-gray-700 text-center mb-4">
                This is to certify that
              </p>

              <div className="border-t border-blue-800 my-4"></div>

              {/* Name Fields */}
              <div className="text-center mb-4">
                <div className="flex justify-center gap-2 mb-2">
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="certificate-form-fields text-2xl font-bold text-blue-800 text-center border-b-2 border-blue-800 focus:outline-none focus:border-blue-600 min-w-[150px]"
                    placeholder="First Name"
                    style={{ maxWidth: '200px' }}
                  />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="certificate-form-fields text-2xl font-bold text-blue-800 text-center border-b-2 border-blue-800 focus:outline-none focus:border-blue-600 min-w-[150px]"
                    placeholder="Last Name"
                    style={{ maxWidth: '200px' }}
                  />
                </div>
              </div>

              {/* Staff Details */}
              <div className="text-center space-y-2 mb-4">
                <div>
                  <span className="text-sm text-gray-700">Passport / National ID: </span>
                  <input
                    type="text"
                    value={formData.passportId}
                    onChange={(e) => setFormData({ ...formData, passportId: e.target.value })}
                    className="certificate-form-fields text-sm text-gray-700 border-b border-gray-400 focus:outline-none focus:border-blue-600 min-w-[200px]"
                    placeholder="[ ID NUMBER ]"
                    required
                  />
                </div>
                <div>
                  <span className="text-sm text-gray-700">Country Office: </span>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="certificate-form-fields text-sm text-gray-700 border-b border-gray-400 focus:outline-none focus:border-blue-600 min-w-[200px]"
                    placeholder="[ COUNTRY ]"
                  />
                </div>
                <div>
                  <span className="text-sm text-gray-700">Department / Role: </span>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="certificate-form-fields text-sm text-gray-700 border-b border-gray-400 focus:outline-none focus:border-blue-600 min-w-[250px]"
                    placeholder="[ POSITION / DEPARTMENT ]"
                  />
                </div>
              </div>

              <div className="border-t border-blue-800 my-4"></div>

              {/* Completion Statement */}
              <p className="text-sm text-gray-700 text-center leading-relaxed mb-2">
                has successfully completed all mandatory onboarding, institutional orientation,
              </p>
              <p className="text-sm text-gray-700 text-center leading-relaxed mb-2">
                safeguarding awareness, code of conduct acknowledgement, and compliance
              </p>
              <p className="text-sm text-gray-700 text-center leading-relaxed mb-4">
                requirements of:
              </p>

              <div className="border-t border-blue-800 my-4"></div>

              {/* INARA Name */}
              <h3 className="text-xl font-bold text-blue-800 text-center mb-2">
                INARA
              </h3>
              <p className="text-sm text-gray-600 text-center mb-4">
                International Network for Aid, Relief and Assistance
              </p>

              <p className="text-sm text-gray-700 text-center leading-relaxed mb-2">
                and is hereby recognized as an Officially Authorized INARA Staff Member,
              </p>
              <p className="text-sm text-gray-700 text-center leading-relaxed mb-4">
                having demonstrated full understanding of:
              </p>

              <div className="border-t border-blue-800 my-4"></div>

              {/* Bullet Points */}
              <div className="text-sm text-gray-700 space-y-2 mb-4 pl-8">
                <p>• INARA's mission, values, and humanitarian principles</p>
                <p>• Safeguarding and accountability standards</p>
                <p>• Internal policies and code of conduct</p>
                <p>• Operational compliance and ethical responsibilities</p>
                <p>• Institutional systems and reporting frameworks</p>
              </div>

              <div className="border-t border-blue-800 my-4"></div>

              {/* STATUS GRANTED */}
              <h3 className="text-lg font-bold text-blue-800 text-center mb-4">
                STATUS GRANTED
              </h3>

              <p className="text-sm text-gray-700 text-center mb-4">
                The above-named individual is formally cleared and authorized to:
              </p>

              <div className="text-sm text-gray-700 space-y-2 mb-4 pl-8">
                <p className="flex items-start">
                  <span className="text-blue-800 font-bold mr-2">✔</span>
                  <span>Access INARA operational systems</span>
                </p>
                <p className="flex items-start">
                  <span className="text-blue-800 font-bold mr-2">✔</span>
                  <span>Represent INARA in professional capacity</span>
                </p>
                <p className="flex items-start">
                  <span className="text-blue-800 font-bold mr-2">✔</span>
                  <span>Participate in INARA humanitarian programs</span>
                </p>
                <p className="flex items-start">
                  <span className="text-blue-800 font-bold mr-2">✔</span>
                  <span>Engage with beneficiaries, partners, and donors</span>
                </p>
                <p className="flex items-start">
                  <span className="text-blue-800 font-bold mr-2">✔</span>
                  <span>Operate under INARA's global governance and compliance framework</span>
                </p>
              </div>

              <div className="border-t border-blue-800 my-4"></div>

              {/* CERTIFICATE REFERENCE */}
              <h3 className="text-lg font-bold text-blue-800 text-center mb-4">
                CERTIFICATE REFERENCE
              </h3>

              <div className="text-xs text-gray-700 text-center space-y-1 mb-4">
                <p>Certificate ID: {certificateId}</p>
                <p>Issue Date: {completionDate.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
                <p>Valid Until: {validUntil.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
              </div>

              <p className="text-xs text-gray-600 text-center leading-relaxed mb-2">
                This certificate remains valid only while the holder maintains active compliance
              </p>
              <p className="text-xs text-gray-600 text-center leading-relaxed mb-4">
                with INARA's mandatory training, safeguarding, and policy recertification requirements.
              </p>

              <div className="border-t border-blue-800 my-4"></div>

              {/* AUTHORIZED BY */}
              <h3 className="text-lg font-bold text-blue-800 text-center mb-4">
                AUTHORIZED BY
              </h3>

              <p className="text-base font-bold text-gray-900 text-center">
                INARA Global Governance & Compliance Office
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
