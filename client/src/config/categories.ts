// Standard NGO Categories and Subcategories (Client-side)

export const libraryCategories = {
  'Program Management': [
    'Project Design',
    'Implementation',
    'Monitoring & Evaluation',
    'Case Management',
    'Community Engagement',
    'Partnership Management',
  ],
  'Safeguarding & Protection': [
    'Child Protection',
    'Gender-Based Violence',
    'Protection Mainstreaming',
    'PSEA (Prevention of Sexual Exploitation and Abuse)',
    'Case Management',
    'Safe Programming',
  ],
  'Human Resources': [
    'Recruitment',
    'Performance Management',
    'Staff Development',
    'Code of Conduct',
    'Disciplinary Procedures',
    'Compensation & Benefits',
  ],
  'Finance & Accounting': [
    'Budgeting',
    'Financial Reporting',
    'Donor Compliance',
    'Internal Controls',
    'Audit',
    'Cash Management',
  ],
  'Procurement & Logistics': [
    'Procurement Procedures',
    'Vendor Management',
    'Asset Management',
    'Fleet Management',
    'Warehouse Management',
    'Supply Chain',
  ],
  'MEAL (Monitoring, Evaluation, Accountability & Learning)': [
    'Data Collection',
    'Data Analysis',
    'Reporting',
    'Feedback Mechanisms',
    'Learning & Adaptation',
    'Impact Assessment',
  ],
  'Security & Safety': [
    'Security Protocols',
    'Risk Assessment',
    'Crisis Management',
    'Emergency Response',
    'Travel Safety',
    'Office Safety',
  ],
  'Communications & Advocacy': [
    'Media Relations',
    'Social Media',
    'Advocacy Strategies',
    'Public Relations',
    'Branding Guidelines',
    'Content Development',
  ],
  'Grants & Partnerships': [
    'Proposal Development',
    'Donor Relations',
    'Partnership Agreements',
    'Sub-grant Management',
    'Compliance',
    'Reporting',
  ],
  'Information Technology': [
    'IT Policies',
    'Data Management',
    'Cybersecurity',
    'System Administration',
    'User Support',
    'Digital Tools',
  ],
  'Research & Learning': [
    'Research Methodology',
    'Academic Papers',
    'Case Studies',
    'Best Practices',
    'Lessons Learned',
    'Impact Studies',
  ],
  'Governance & Compliance': [
    'Board Governance',
    'Legal Compliance',
    'Ethics',
    'Transparency',
    'Accountability',
    'Regulatory Requirements',
  ],
};

export const trainingCategories = {
  'Safeguarding': [
    'Child Protection',
    'PSEA (Prevention of Sexual Exploitation and Abuse)',
    'Gender-Based Violence',
    'Protection Mainstreaming',
    'Safe Programming',
    'Reporting Mechanisms',
  ],
  'Human Resources': [
    'Recruitment & Selection',
    'Performance Management',
    'Staff Development',
    'Code of Conduct',
    'Disciplinary Procedures',
    'Workplace Harassment',
  ],
  'Finance & Accounting': [
    'Budget Management',
    'Financial Reporting',
    'Donor Compliance',
    'Internal Controls',
    'Audit Preparation',
    'Cash Management',
  ],
  'Program Management': [
    'Project Design',
    'Project Implementation',
    'Monitoring & Evaluation',
    'Case Management',
    'Community Engagement',
    'Partnership Management',
  ],
  'MEAL (Monitoring, Evaluation, Accountability & Learning)': [
    'Data Collection Methods',
    'Data Analysis',
    'Report Writing',
    'Feedback Mechanisms',
    'Learning & Adaptation',
    'Impact Assessment',
  ],
  'Procurement & Logistics': [
    'Procurement Procedures',
    'Vendor Management',
    'Asset Management',
    'Fleet Management',
    'Warehouse Management',
    'Supply Chain',
  ],
  'Security & Safety': [
    'Security Awareness',
    'Risk Assessment',
    'Crisis Management',
    'Emergency Response',
    'Travel Safety',
    'First Aid',
  ],
  'Communications': [
    'Media Relations',
    'Social Media Management',
    'Advocacy',
    'Public Speaking',
    'Report Writing',
    'Documentation',
  ],
  'Grants & Partnerships': [
    'Proposal Writing',
    'Donor Relations',
    'Partnership Management',
    'Sub-grant Management',
    'Compliance',
    'Reporting',
  ],
  'Information Technology': [
    'IT Security',
    'Data Management',
    'Digital Tools',
    'System Usage',
    'Cybersecurity',
    'Software Training',
  ],
  'Leadership & Management': [
    'Team Leadership',
    'Strategic Planning',
    'Change Management',
    'Conflict Resolution',
    'Decision Making',
    'Time Management',
  ],
  'Orientation & Onboarding': [
    'New Staff Orientation',
    'Organizational Culture',
    'Systems Overview',
    'Policies & Procedures',
    'Role-Specific Training',
  ],
};

export const policyCategories = {
  'Human Resources': [
    'Recruitment',
    'Performance Management',
    'Code of Conduct',
    'Disciplinary Procedures',
    'Leave Policies',
    'Compensation & Benefits',
    'Staff Development',
    'Workplace Harassment',
  ],
  'Finance & Accounting': [
    'Financial Management',
    'Budgeting',
    'Financial Reporting',
    'Donor Compliance',
    'Internal Controls',
    'Cash Management',
    'Expense Policies',
  ],
  'Procurement & Logistics': [
    'Procurement Procedures',
    'Vendor Management',
    'Asset Management',
    'Fleet Management',
    'Warehouse Management',
    'Inventory Control',
  ],
  'Safeguarding & Protection': [
    'Child Protection',
    'PSEA (Prevention of Sexual Exploitation and Abuse)',
    'Gender-Based Violence',
    'Protection Mainstreaming',
    'Case Management',
    'Safe Programming',
  ],
  'Program Management': [
    'Project Design',
    'Implementation',
    'Monitoring & Evaluation',
    'Case Management',
    'Community Engagement',
    'Partnership Management',
  ],
  'MEAL (Monitoring, Evaluation, Accountability & Learning)': [
    'Data Collection',
    'Data Management',
    'Reporting',
    'Feedback Mechanisms',
    'Learning & Adaptation',
    'Data Protection',
  ],
  'Security & Safety': [
    'Security Protocols',
    'Risk Assessment',
    'Crisis Management',
    'Emergency Response',
    'Travel Safety',
    'Office Safety',
  ],
  'Communications & Advocacy': [
    'Media Relations',
    'Social Media',
    'Advocacy',
    'Branding',
    'Content Development',
    'External Communications',
  ],
  'Grants & Partnerships': [
    'Proposal Development',
    'Donor Relations',
    'Partnership Agreements',
    'Sub-grant Management',
    'Compliance',
    'Reporting',
  ],
  'Information Technology': [
    'IT Security',
    'Data Management',
    'Cybersecurity',
    'System Usage',
    'Software Licensing',
    'Data Protection',
  ],
  'Governance & Compliance': [
    'Board Governance',
    'Legal Compliance',
    'Ethics',
    'Transparency',
    'Accountability',
    'Regulatory Requirements',
  ],
  'Operations': [
    'Office Management',
    'Facilities Management',
    'Travel Policies',
    'Administrative Procedures',
    'Document Management',
    'Records Management',
  ],
};

// Helper functions
export function getAllLibraryCategories(): string[] {
  return Object.keys(libraryCategories);
}

export function getLibrarySubcategories(category: string): string[] {
  return libraryCategories[category as keyof typeof libraryCategories] || [];
}

export function getAllTrainingCategories(): string[] {
  return Object.keys(trainingCategories);
}

export function getTrainingSubcategories(category: string): string[] {
  return trainingCategories[category as keyof typeof trainingCategories] || [];
}

export function getAllPolicyCategories(): string[] {
  return Object.keys(policyCategories);
}

export function getPolicySubcategories(category: string): string[] {
  return policyCategories[category as keyof typeof policyCategories] || [];
}

