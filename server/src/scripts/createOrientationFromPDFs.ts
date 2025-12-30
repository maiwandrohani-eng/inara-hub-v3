import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// PDF files and their corresponding questions (at least 10 questions per guideline)
const orientationPDFs = [
  {
    filename: 'Beneficiary Communication copy.pdf',
    title: 'Beneficiary Communication',
    description: 'Learn about effective communication with beneficiaries',
    questions: [
      {
        id: 'bc-1',
        question: 'What is the primary goal of beneficiary communication?',
        type: 'multiple_choice',
        options: [
          'To inform beneficiaries about programs',
          'To ensure transparency and accountability',
          'To collect feedback and complaints',
          'All of the above'
        ],
        correctAnswer: 'All of the above',
        required: true
      },
      {
        id: 'bc-2',
        question: 'Which communication channels should be used for beneficiary communication?',
        type: 'checkbox',
        options: [
          'Face-to-face meetings',
          'Community notice boards',
          'SMS and phone calls',
          'Social media',
          'Radio announcements'
        ],
        correctAnswer: ['Face-to-face meetings', 'Community notice boards', 'SMS and phone calls', 'Radio announcements'],
        required: true
      },
      {
        id: 'bc-3',
        question: 'How should complaints from beneficiaries be handled?',
        type: 'text',
        correctAnswer: 'Complaints should be handled promptly, confidentially, and with respect. They should be documented, investigated, and responded to within agreed timeframes.',
        required: true
      },
      {
        id: 'bc-4',
        question: 'What information should be communicated to beneficiaries?',
        type: 'checkbox',
        options: [
          'Program objectives and activities',
          'Eligibility criteria',
          'How to access services',
          'Complaint mechanisms',
          'All of the above'
        ],
        correctAnswer: ['All of the above'],
        required: true
      },
      {
        id: 'bc-5',
        question: 'When should beneficiaries be informed about program changes?',
        type: 'multiple_choice',
        options: [
          'Only at the end of the program',
          'As soon as possible when changes occur',
          'Only if they ask',
          'Never'
        ],
        correctAnswer: 'As soon as possible when changes occur',
        required: true
      },
      {
        id: 'bc-6',
        question: 'What is the importance of two-way communication with beneficiaries?',
        type: 'text',
        correctAnswer: 'Two-way communication ensures beneficiaries can provide feedback, voice concerns, and participate in decision-making, leading to more effective and accountable programs.',
        required: true
      },
      {
        id: 'bc-7',
        question: 'Which language(s) should be used for beneficiary communication?',
        type: 'multiple_choice',
        options: [
          'Only English',
          'Only the local language',
          'Languages that beneficiaries understand',
          'Any language'
        ],
        correctAnswer: 'Languages that beneficiaries understand',
        required: true
      },
      {
        id: 'bc-8',
        question: 'What should be done if a beneficiary cannot read or write?',
        type: 'text',
        correctAnswer: 'Alternative communication methods should be used such as verbal communication, visual aids, community meetings, or assistance from trusted community members.',
        required: true
      },
      {
        id: 'bc-9',
        question: 'How often should beneficiary feedback be collected?',
        type: 'multiple_choice',
        options: [
          'Once at the beginning',
          'Only at the end',
          'Regularly throughout the program',
          'Never'
        ],
        correctAnswer: 'Regularly throughout the program',
        required: true
      },
      {
        id: 'bc-10',
        question: 'What is the role of community leaders in beneficiary communication?',
        type: 'text',
        correctAnswer: 'Community leaders can help facilitate communication, ensure messages reach all community members, and help translate or explain information in culturally appropriate ways.',
        required: true
      },
      {
        id: 'bc-11',
        question: 'Should beneficiary communication be documented?',
        type: 'multiple_choice',
        options: [
          'No, it is not necessary',
          'Yes, all communication should be documented',
          'Only complaints need documentation',
          'Only verbal communication needs documentation'
        ],
        correctAnswer: 'Yes, all communication should be documented',
        required: true
      },
      {
        id: 'bc-12',
        question: 'What makes communication with beneficiaries effective?',
        type: 'checkbox',
        options: [
          'Clear and simple language',
          'Timely information',
          'Accessible formats',
          'Cultural sensitivity',
          'All of the above'
        ],
        correctAnswer: ['All of the above'],
        required: true
      }
    ]
  },
  {
    filename: 'Child Protection and Safeguarding copy.pdf',
    title: 'Child Protection and Safeguarding',
    description: 'Essential guidelines for protecting children in our programs',
    questions: [
      {
        id: 'cp-1',
        question: 'What is the minimum age for child protection concerns to be reported?',
        type: 'multiple_choice',
        options: [
          'Any age',
          'Under 18 years',
          'Under 16 years',
          'Under 14 years'
        ],
        correctAnswer: 'Under 18 years',
        required: true
      },
      {
        id: 'cp-2',
        question: 'Which of the following are signs of child abuse?',
        type: 'checkbox',
        options: [
          'Unexplained injuries',
          'Sudden changes in behavior',
          'Fear of certain adults',
          'Poor hygiene',
          'All of the above'
        ],
        correctAnswer: ['All of the above'],
        required: true
      },
      {
        id: 'cp-3',
        question: 'What should you do if you suspect child abuse?',
        type: 'text',
        correctAnswer: 'Report immediately to the designated child protection focal point or supervisor. Do not investigate yourself. Ensure the child is safe and document your concerns.',
        required: true
      },
      {
        id: 'cp-4',
        question: 'Who is responsible for child protection?',
        type: 'multiple_choice',
        options: [
          'Only child protection specialists',
          'Only supervisors',
          'Everyone in the organization',
          'Only program managers'
        ],
        correctAnswer: 'Everyone in the organization',
        required: true
      },
      {
        id: 'cp-5',
        question: 'What should you do if a child discloses abuse to you?',
        type: 'checkbox',
        options: [
          'Listen carefully and believe the child',
          'Promise to keep it secret',
          'Report immediately',
          'Ask detailed questions',
          'Reassure the child'
        ],
        correctAnswer: ['Listen carefully and believe the child', 'Report immediately', 'Reassure the child'],
        required: true
      },
      {
        id: 'cp-6',
        question: 'What is the difference between child protection and child safeguarding?',
        type: 'text',
        correctAnswer: 'Child protection refers to preventing and responding to harm, while child safeguarding refers to proactive measures to create safe environments and prevent harm from occurring.',
        required: true
      },
      {
        id: 'cp-7',
        question: 'When should background checks be conducted?',
        type: 'multiple_choice',
        options: [
          'Only for senior staff',
          'Before hiring anyone who works with children',
          'Only if requested',
          'Never'
        ],
        correctAnswer: 'Before hiring anyone who works with children',
        required: true
      },
      {
        id: 'cp-8',
        question: 'What are the key principles of child protection?',
        type: 'checkbox',
        options: [
          'Best interests of the child',
          'Non-discrimination',
          'Right to participation',
          'Right to survival and development',
          'All of the above'
        ],
        correctAnswer: ['All of the above'],
        required: true
      },
      {
        id: 'cp-9',
        question: 'How should child protection concerns be documented?',
        type: 'text',
        correctAnswer: 'Documentation should be factual, objective, timely, and confidential. Include what was observed, when, where, and who was involved. Store securely and share only with authorized personnel.',
        required: true
      },
      {
        id: 'cp-10',
        question: 'What is the role of a child protection focal point?',
        type: 'multiple_choice',
        options: [
          'To investigate all cases',
          'To receive reports and coordinate responses',
          'To keep all information secret',
          'To work alone'
        ],
        correctAnswer: 'To receive reports and coordinate responses',
        required: true
      },
      {
        id: 'cp-11',
        question: 'What should be included in child-safe programming?',
        type: 'checkbox',
        options: [
          'Risk assessments',
          'Child-friendly spaces',
          'Trained staff',
          'Complaint mechanisms',
          'All of the above'
        ],
        correctAnswer: ['All of the above'],
        required: true
      },
      {
        id: 'cp-12',
        question: 'How can staff ensure they are following child protection standards?',
        type: 'text',
        correctAnswer: 'By completing mandatory training, following organizational policies and procedures, reporting concerns promptly, and maintaining appropriate boundaries with children.',
        required: true
      }
    ]
  },
  {
    filename: 'PSEA Guidelines for Employees copy.pdf',
    title: 'PSEA Guidelines for Employees',
    description: 'Prevention of Sexual Exploitation and Abuse guidelines',
    questions: [
      {
        id: 'psea-1',
        question: 'What does PSEA stand for?',
        type: 'multiple_choice',
        options: [
          'Prevention of Sexual Exploitation and Abuse',
          'Protection of Staff and Employees Association',
          'Program Support and Evaluation Assessment',
          'None of the above'
        ],
        correctAnswer: 'Prevention of Sexual Exploitation and Abuse',
        required: true
      },
      {
        id: 'psea-2',
        question: 'Which behaviors are prohibited under PSEA?',
        type: 'checkbox',
        options: [
          'Sexual activity with beneficiaries',
          'Exchange of money or goods for sexual favors',
          'Sexual harassment of colleagues',
          'All of the above'
        ],
        correctAnswer: ['All of the above'],
        required: true
      },
      {
        id: 'psea-3',
        question: 'What is the reporting mechanism for PSEA violations?',
        type: 'text',
        correctAnswer: 'Report immediately to the PSEA focal point, supervisor, or through the confidential reporting mechanism. Reports can be made anonymously and will be investigated promptly.',
        required: true
      },
      {
        id: 'psea-4',
        question: 'Who can be a victim of sexual exploitation and abuse?',
        type: 'multiple_choice',
        options: [
          'Only women',
          'Only children',
          'Anyone in a position of vulnerability',
          'Only beneficiaries'
        ],
        correctAnswer: 'Anyone in a position of vulnerability',
        required: true
      },
      {
        id: 'psea-5',
        question: 'What is the difference between sexual exploitation and sexual abuse?',
        type: 'text',
        correctAnswer: 'Sexual exploitation involves abuse of power for sexual purposes (e.g., exchanging aid for sex), while sexual abuse involves any sexual act without consent.',
        required: true
      },
      {
        id: 'psea-6',
        question: 'What should staff do if they witness PSEA violations?',
        type: 'checkbox',
        options: [
          'Ignore it',
          'Report immediately',
          'Document what was observed',
          'Protect the victim',
          'Keep it confidential'
        ],
        correctAnswer: ['Report immediately', 'Document what was observed', 'Protect the victim'],
        required: true
      },
      {
        id: 'psea-7',
        question: 'When should PSEA training be completed?',
        type: 'multiple_choice',
        options: [
          'Only once',
          'Before starting work and regularly thereafter',
          'Only if requested',
          'Never'
        ],
        correctAnswer: 'Before starting work and regularly thereafter',
        required: true
      },
      {
        id: 'psea-8',
        question: 'What are the consequences of PSEA violations?',
        type: 'text',
        correctAnswer: 'Consequences include immediate termination, potential criminal prosecution, and being barred from working in the humanitarian sector. The organization will fully cooperate with law enforcement.',
        required: true
      },
      {
        id: 'psea-9',
        question: 'What should be included in PSEA risk assessments?',
        type: 'checkbox',
        options: [
          'Power dynamics',
          'Vulnerability factors',
          'Reporting mechanisms',
          'Prevention measures',
          'All of the above'
        ],
        correctAnswer: ['All of the above'],
        required: true
      },
      {
        id: 'psea-10',
        question: 'How can staff prevent PSEA?',
        type: 'text',
        correctAnswer: 'By maintaining professional boundaries, treating all people with respect and dignity, reporting concerns, completing training, and following organizational policies.',
        required: true
      },
      {
        id: 'psea-11',
        question: 'What is the zero-tolerance policy for PSEA?',
        type: 'multiple_choice',
        options: [
          'Some violations are acceptable',
          'No violations will be tolerated under any circumstances',
          'Only serious violations matter',
          'It depends on the situation'
        ],
        correctAnswer: 'No violations will be tolerated under any circumstances',
        required: true
      },
      {
        id: 'psea-12',
        question: 'Who is responsible for preventing PSEA?',
        type: 'multiple_choice',
        options: [
          'Only PSEA focal points',
          'Only management',
          'All staff members',
          'Only security staff'
        ],
        correctAnswer: 'All staff members',
        required: true
      }
    ]
  },
  {
    filename: 'Office Communication  copy.pdf',
    title: 'Office Communication',
    description: 'Guidelines for effective workplace communication',
    questions: [
      {
        id: 'oc-1',
        question: 'What is the preferred method for urgent communication?',
        type: 'multiple_choice',
        options: [
          'Email',
          'Phone call',
          'WhatsApp',
          'In-person meeting'
        ],
        correctAnswer: 'Phone call',
        required: true
      },
      {
        id: 'oc-2',
        question: 'Which communication principles should be followed?',
        type: 'checkbox',
        options: [
          'Be clear and concise',
          'Respect cultural differences',
          'Maintain confidentiality',
          'Respond promptly',
          'All of the above'
        ],
        correctAnswer: ['All of the above'],
        required: true
      },
      {
        id: 'oc-3',
        question: 'How should sensitive information be communicated?',
        type: 'text',
        correctAnswer: 'Sensitive information should be communicated in person or through secure channels, maintaining confidentiality and only sharing with authorized personnel.',
        required: true
      },
      {
        id: 'oc-4',
        question: 'What is the expected response time for emails?',
        type: 'multiple_choice',
        options: [
          'Within 24 hours',
          'Within 48 hours',
          'Within a week',
          'Whenever convenient'
        ],
        correctAnswer: 'Within 24 hours',
        required: true
      },
      {
        id: 'oc-5',
        question: 'What should be included in professional emails?',
        type: 'checkbox',
        options: [
          'Clear subject line',
          'Professional greeting',
          'Concise message',
          'Appropriate closing',
          'All of the above'
        ],
        correctAnswer: ['All of the above'],
        required: true
      },
      {
        id: 'oc-6',
        question: 'How should conflicts be communicated?',
        type: 'text',
        correctAnswer: 'Conflicts should be addressed directly, respectfully, and in a timely manner. Use "I" statements, focus on the issue not the person, and seek resolution through dialogue.',
        required: true
      },
      {
        id: 'oc-7',
        question: 'When should meetings be scheduled?',
        type: 'multiple_choice',
        options: [
          'Without notice',
          'With advance notice and agenda',
          'Only for emergencies',
          'Never'
        ],
        correctAnswer: 'With advance notice and agenda',
        required: true
      },
      {
        id: 'oc-8',
        question: 'What is the importance of active listening?',
        type: 'text',
        correctAnswer: 'Active listening ensures understanding, shows respect, prevents misunderstandings, and helps build trust and effective working relationships.',
        required: true
      },
      {
        id: 'oc-9',
        question: 'How should feedback be given?',
        type: 'checkbox',
        options: [
          'Constructively',
          'Privately when possible',
          'With specific examples',
          'In a timely manner',
          'All of the above'
        ],
        correctAnswer: ['All of the above'],
        required: true
      },
      {
        id: 'oc-10',
        question: 'What should you do if you receive unclear instructions?',
        type: 'text',
        correctAnswer: 'Ask for clarification immediately rather than making assumptions. Request specific examples or additional information to ensure understanding.',
        required: true
      },
      {
        id: 'oc-11',
        question: 'How should cross-cultural communication be handled?',
        type: 'multiple_choice',
        options: [
          'Ignore cultural differences',
          'Be aware of and respect cultural differences',
          'Force your own culture',
          'Avoid communication'
        ],
        correctAnswer: 'Be aware of and respect cultural differences',
        required: true
      },
      {
        id: 'oc-12',
        question: 'What is the role of non-verbal communication?',
        type: 'text',
        correctAnswer: 'Non-verbal communication (body language, tone, gestures) can reinforce or contradict verbal messages. Be aware of cultural differences in non-verbal communication.',
        required: true
      }
    ]
  },
  {
    filename: 'Comprehensive Guide for Becoming a good leader copy.pdf',
    title: 'Leadership Guide',
    description: 'Essential skills and practices for effective leadership',
    questions: [
      {
        id: 'lead-1',
        question: 'What are key qualities of a good leader?',
        type: 'checkbox',
        options: [
          'Empathy',
          'Communication skills',
          'Decision-making ability',
          'Accountability',
          'All of the above'
        ],
        correctAnswer: ['All of the above'],
        required: true
      },
      {
        id: 'lead-2',
        question: 'How should leaders handle conflicts in the workplace?',
        type: 'text',
        correctAnswer: 'Leaders should address conflicts promptly, listen to all parties, remain neutral, facilitate dialogue, and work towards mutually acceptable solutions.',
        required: true
      },
      {
        id: 'lead-3',
        question: 'What is servant leadership?',
        type: 'multiple_choice',
        options: [
          'Leaders who serve themselves',
          'Leaders who prioritize the needs of their team',
          'Leaders who avoid responsibility',
          'Leaders who work alone'
        ],
        correctAnswer: 'Leaders who prioritize the needs of their team',
        required: true
      },
      {
        id: 'lead-4',
        question: 'How should leaders provide feedback?',
        type: 'text',
        correctAnswer: 'Feedback should be specific, timely, constructive, and focused on behavior and outcomes rather than personal attributes. It should be given regularly, not just during reviews.',
        required: true
      },
      {
        id: 'lead-5',
        question: 'What is the importance of delegation?',
        type: 'checkbox',
        options: [
          'Develops team members',
          'Increases efficiency',
          'Builds trust',
          'Allows focus on strategic tasks',
          'All of the above'
        ],
        correctAnswer: ['All of the above'],
        required: true
      },
      {
        id: 'lead-6',
        question: 'How should leaders handle mistakes?',
        type: 'text',
        correctAnswer: 'Leaders should acknowledge mistakes, take responsibility, learn from them, and use them as teaching opportunities for the team.',
        required: true
      },
      {
        id: 'lead-7',
        question: 'What is emotional intelligence in leadership?',
        type: 'multiple_choice',
        options: [
          'Ignoring emotions',
          'Understanding and managing emotions effectively',
          'Only showing positive emotions',
          'Avoiding emotional situations'
        ],
        correctAnswer: 'Understanding and managing emotions effectively',
        required: true
      },
      {
        id: 'lead-8',
        question: 'How should leaders motivate their team?',
        type: 'checkbox',
        options: [
          'Through recognition',
          'By providing growth opportunities',
          'By setting clear goals',
          'By creating a positive environment',
          'All of the above'
        ],
        correctAnswer: ['All of the above'],
        required: true
      },
      {
        id: 'lead-9',
        question: 'What is the role of vision in leadership?',
        type: 'text',
        correctAnswer: 'A clear vision provides direction, inspires action, aligns team efforts, and helps team members understand how their work contributes to larger goals.',
        required: true
      },
      {
        id: 'lead-10',
        question: 'How should leaders handle team diversity?',
        type: 'text',
        correctAnswer: 'Leaders should value diversity, create inclusive environments, leverage different perspectives, and ensure all team members feel respected and heard.',
        required: true
      },
      {
        id: 'lead-11',
        question: 'What is the importance of leading by example?',
        type: 'multiple_choice',
        options: [
          'It is not important',
          'It sets standards and builds credibility',
          'It is only for junior staff',
          'It creates confusion'
        ],
        correctAnswer: 'It sets standards and builds credibility',
        required: true
      },
      {
        id: 'lead-12',
        question: 'How should leaders handle change?',
        type: 'text',
        correctAnswer: 'Leaders should communicate the need for change clearly, involve the team in planning, address concerns, provide support during transition, and celebrate successes.',
        required: true
      }
    ]
  },
  {
    filename: 'Comprehensive Guide for conflict free working enviroment copy.pdf',
    title: 'Conflict-Free Working Environment',
    description: 'Creating and maintaining a harmonious workplace',
    questions: [
      {
        id: 'conflict-1',
        question: 'What are common causes of workplace conflicts?',
        type: 'checkbox',
        options: [
          'Miscommunication',
          'Different work styles',
          'Resource competition',
          'Personality clashes',
          'All of the above'
        ],
        correctAnswer: ['All of the above'],
        required: true
      },
      {
        id: 'conflict-2',
        question: 'What steps should be taken to resolve conflicts?',
        type: 'text',
        correctAnswer: 'Identify the issue, listen to all parties, find common ground, explore solutions together, agree on a resolution, and follow up to ensure it is working.',
        required: true
      },
      {
        id: 'conflict-3',
        question: 'When should conflicts be addressed?',
        type: 'multiple_choice',
        options: [
          'When they become serious',
          'As soon as they arise',
          'Only at team meetings',
          'Never'
        ],
        correctAnswer: 'As soon as they arise',
        required: true
      },
      {
        id: 'conflict-4',
        question: 'What is the role of mediation in conflict resolution?',
        type: 'text',
        correctAnswer: 'Mediation involves a neutral third party helping conflicting parties communicate, understand each other\'s perspectives, and find mutually acceptable solutions.',
        required: true
      },
      {
        id: 'conflict-5',
        question: 'How can conflicts be prevented?',
        type: 'checkbox',
        options: [
          'Clear communication',
          'Defined roles and responsibilities',
          'Regular team building',
          'Open feedback channels',
          'All of the above'
        ],
        correctAnswer: ['All of the above'],
        required: true
      },
      {
        id: 'conflict-6',
        question: 'What should you do if you are involved in a conflict?',
        type: 'text',
        correctAnswer: 'Stay calm, listen to the other person\'s perspective, express your own views respectfully, focus on the issue not the person, and seek resolution through dialogue or mediation.',
        required: true
      },
      {
        id: 'conflict-7',
        question: 'What is the difference between conflict and disagreement?',
        type: 'multiple_choice',
        options: [
          'They are the same',
          'Disagreement is healthy debate, conflict is destructive',
          'Conflict is always bad',
          'Disagreement is always bad'
        ],
        correctAnswer: 'Disagreement is healthy debate, conflict is destructive',
        required: true
      },
      {
        id: 'conflict-8',
        question: 'How should team conflicts be handled?',
        type: 'text',
        correctAnswer: 'Team conflicts should be addressed openly but respectfully, with all parties present, focusing on solutions rather than blame, and with management support if needed.',
        required: true
      },
      {
        id: 'conflict-9',
        question: 'What are signs of unresolved conflict?',
        type: 'checkbox',
        options: [
          'Reduced communication',
          'Decreased productivity',
          'Increased tension',
          'Team members avoiding each other',
          'All of the above'
        ],
        correctAnswer: ['All of the above'],
        required: true
      },
      {
        id: 'conflict-10',
        question: 'How can a positive work environment be maintained?',
        type: 'text',
        correctAnswer: 'By promoting respect, open communication, collaboration, recognizing contributions, addressing issues promptly, and creating opportunities for team building.',
        required: true
      },
      {
        id: 'conflict-11',
        question: 'What is the importance of addressing conflicts early?',
        type: 'multiple_choice',
        options: [
          'It is not important',
          'It prevents escalation and maintains team harmony',
          'It makes things worse',
          'It is only for managers'
        ],
        correctAnswer: 'It prevents escalation and maintains team harmony',
        required: true
      },
      {
        id: 'conflict-12',
        question: 'How should cultural conflicts be handled?',
        type: 'text',
        correctAnswer: 'Cultural conflicts should be addressed with sensitivity, respect for different perspectives, education about cultural differences, and finding common ground.',
        required: true
      }
    ]
  },
  {
    filename: 'Guide for Teamwork and Collaboration copy.pdf',
    title: 'Teamwork and Collaboration',
    description: 'Best practices for working effectively in teams',
    questions: [
      {
        id: 'team-1',
        question: 'What are benefits of effective teamwork?',
        type: 'checkbox',
        options: [
          'Increased productivity',
          'Better problem-solving',
          'Improved morale',
          'Knowledge sharing',
          'All of the above'
        ],
        correctAnswer: ['All of the above'],
        required: true
      },
      {
        id: 'team-2',
        question: 'How can you contribute to effective teamwork?',
        type: 'text',
        correctAnswer: 'By communicating openly, respecting others, sharing knowledge, supporting team members, meeting commitments, and being flexible and collaborative.',
        required: true
      },
      {
        id: 'team-3',
        question: 'What is the importance of clear roles in a team?',
        type: 'multiple_choice',
        options: [
          'It is not important',
          'It prevents confusion and ensures accountability',
          'It limits creativity',
          'It creates conflict'
        ],
        correctAnswer: 'It prevents confusion and ensures accountability',
        required: true
      },
      {
        id: 'team-4',
        question: 'How should team decisions be made?',
        type: 'text',
        correctAnswer: 'Team decisions should involve input from all members, consider different perspectives, be based on facts and data, and aim for consensus when possible.',
        required: true
      },
      {
        id: 'team-5',
        question: 'What makes a team effective?',
        type: 'checkbox',
        options: [
          'Clear goals',
          'Open communication',
          'Mutual respect',
          'Shared accountability',
          'All of the above'
        ],
        correctAnswer: ['All of the above'],
        required: true
      },
      {
        id: 'team-6',
        question: 'How should conflicts within a team be handled?',
        type: 'text',
        correctAnswer: 'Team conflicts should be addressed directly, respectfully, and collaboratively. Focus on the issue, listen to all perspectives, and work together to find solutions.',
        required: true
      },
      {
        id: 'team-7',
        question: 'What is the role of trust in teamwork?',
        type: 'multiple_choice',
        options: [
          'It is not important',
          'It is essential for effective collaboration',
          'It only matters for leaders',
          'It creates problems'
        ],
        correctAnswer: 'It is essential for effective collaboration',
        required: true
      },
      {
        id: 'team-8',
        question: 'How can team members support each other?',
        type: 'checkbox',
        options: [
          'Sharing knowledge',
          'Offering help when needed',
          'Celebrating successes together',
          'Providing constructive feedback',
          'All of the above'
        ],
        correctAnswer: ['All of the above'],
        required: true
      },
      {
        id: 'team-9',
        question: 'What is the importance of regular team communication?',
        type: 'text',
        correctAnswer: 'Regular communication ensures everyone is informed, aligned, can share updates and concerns, and helps build relationships and trust within the team.',
        required: true
      },
      {
        id: 'team-10',
        question: 'How should team meetings be conducted?',
        type: 'text',
        correctAnswer: 'Team meetings should have clear agendas, start and end on time, encourage participation from all members, focus on action items, and have documented outcomes.',
        required: true
      },
      {
        id: 'team-11',
        question: 'What is collaborative problem-solving?',
        type: 'multiple_choice',
        options: [
          'Working alone',
          'Working together to find solutions',
          'Avoiding problems',
          'Blaming others'
        ],
        correctAnswer: 'Working together to find solutions',
        required: true
      },
      {
        id: 'team-12',
        question: 'How can diversity strengthen a team?',
        type: 'text',
        correctAnswer: 'Diversity brings different perspectives, experiences, and skills, leading to more creative solutions, better decision-making, and a richer understanding of issues.',
        required: true
      }
    ]
  },
  {
    filename: 'Dont take things personal  copy.pdf',
    title: 'Professional Resilience',
    description: 'Maintaining professionalism in challenging situations',
    questions: [
      {
        id: 'resil-1',
        question: 'What does it mean to not take things personally in the workplace?',
        type: 'text',
        correctAnswer: 'It means understanding that workplace feedback, decisions, and interactions are usually about work, not personal attacks. It involves separating professional from personal.',
        required: true
      },
      {
        id: 'resil-2',
        question: 'How can you maintain professionalism during criticism?',
        type: 'text',
        correctAnswer: 'Listen actively, ask for clarification, focus on the feedback not the delivery, reflect on valid points, and use it as an opportunity for growth.',
        required: true
      },
      {
        id: 'resil-3',
        question: 'What is the importance of emotional regulation at work?',
        type: 'multiple_choice',
        options: [
          'It is not important',
          'It helps maintain professionalism and effective communication',
          'It shows weakness',
          'It creates problems'
        ],
        correctAnswer: 'It helps maintain professionalism and effective communication',
        required: true
      },
      {
        id: 'resil-4',
        question: 'How should you handle rejection or setbacks?',
        type: 'text',
        correctAnswer: 'Acknowledge the disappointment, learn from the experience, seek feedback, focus on what you can control, and move forward with resilience.',
        required: true
      },
      {
        id: 'resil-5',
        question: 'What strategies help build professional resilience?',
        type: 'checkbox',
        options: [
          'Maintaining perspective',
          'Building support networks',
          'Developing coping skills',
          'Focusing on growth',
          'All of the above'
        ],
        correctAnswer: ['All of the above'],
        required: true
      },
      {
        id: 'resil-6',
        question: 'How should you respond to negative feedback?',
        type: 'text',
        correctAnswer: 'Thank the person for the feedback, ask for specific examples, reflect on the points raised, create an action plan for improvement, and follow up.',
        required: true
      },
      {
        id: 'resil-7',
        question: 'What is the difference between personal and professional criticism?',
        type: 'multiple_choice',
        options: [
          'They are the same',
          'Professional criticism is about work performance, personal is about character',
          'Both should be ignored',
          'Only personal criticism matters'
        ],
        correctAnswer: 'Professional criticism is about work performance, personal is about character',
        required: true
      },
      {
        id: 'resil-8',
        question: 'How can you maintain boundaries between work and personal life?',
        type: 'text',
        correctAnswer: 'Set clear work hours, avoid taking work stress home, develop hobbies and interests outside work, maintain relationships, and practice self-care.',
        required: true
      },
      {
        id: 'resil-9',
        question: 'What should you do when feeling overwhelmed at work?',
        type: 'checkbox',
        options: [
          'Ignore it',
          'Communicate with supervisor',
          'Prioritize tasks',
          'Seek support',
          'Take breaks when needed'
        ],
        correctAnswer: ['Communicate with supervisor', 'Prioritize tasks', 'Seek support', 'Take breaks when needed'],
        required: true
      },
      {
        id: 'resil-10',
        question: 'How can you build emotional intelligence?',
        type: 'text',
        correctAnswer: 'By practicing self-awareness, recognizing your emotions, understanding others\' emotions, developing empathy, and learning to manage emotional responses effectively.',
        required: true
      },
      {
        id: 'resil-11',
        question: 'What is the importance of maintaining a positive attitude?',
        type: 'multiple_choice',
        options: [
          'It is not important',
          'It helps overcome challenges and maintain productivity',
          'It means ignoring problems',
          'It is unrealistic'
        ],
        correctAnswer: 'It helps overcome challenges and maintain productivity',
        required: true
      },
      {
        id: 'resil-12',
        question: 'How should you handle workplace stress?',
        type: 'text',
        correctAnswer: 'Identify stress sources, develop healthy coping mechanisms, communicate concerns, prioritize self-care, seek support when needed, and maintain work-life balance.',
        required: true
      }
    ]
  },
  {
    filename: 'INARA Strategy - 2025-2030.pdf',
    title: 'INARA Strategy 2025-2030',
    description: 'Understanding INARA\'s strategic direction and goals',
    questions: [
      {
        id: 'strat-1',
        question: 'What are the main strategic priorities for INARA 2025-2030?',
        type: 'checkbox',
        options: [
          'Program expansion',
          'Capacity building',
          'Partnership development',
          'Innovation and technology',
          'All of the above'
        ],
        correctAnswer: ['All of the above'],
        required: true
      },
      {
        id: 'strat-2',
        question: 'How does your role contribute to INARA\'s strategic goals?',
        type: 'text',
        correctAnswer: 'Each role contributes by fulfilling responsibilities aligned with strategic priorities, supporting team objectives, and working towards INARA\'s mission of providing aid, relief, and assistance.',
        required: true
      },
      {
        id: 'strat-3',
        question: 'What is INARA\'s vision for 2030?',
        type: 'text',
        correctAnswer: 'INARA\'s vision is to be a leading humanitarian organization that effectively responds to crises, builds resilience, and creates lasting positive impact in communities we serve.',
        required: true
      },
      {
        id: 'strat-4',
        question: 'What role does innovation play in INARA\'s strategy?',
        type: 'multiple_choice',
        options: [
          'No role',
          'A key role in improving effectiveness and impact',
          'Only for technology staff',
          'It is not mentioned'
        ],
        correctAnswer: 'A key role in improving effectiveness and impact',
        required: true
      },
      {
        id: 'strat-5',
        question: 'How will INARA measure success in the strategy period?',
        type: 'checkbox',
        options: [
          'Number of beneficiaries reached',
          'Quality of programs',
          'Partnership strength',
          'Organizational capacity',
          'All of the above'
        ],
        correctAnswer: ['All of the above'],
        required: true
      },
      {
        id: 'strat-6',
        question: 'What is the importance of partnerships in INARA\'s strategy?',
        type: 'text',
        correctAnswer: 'Partnerships enable INARA to leverage resources, share expertise, reach more beneficiaries, coordinate responses, and create greater impact than working alone.',
        required: true
      },
      {
        id: 'strat-7',
        question: 'How does capacity building support the strategy?',
        type: 'multiple_choice',
        options: [
          'It does not',
          'It strengthens organizational ability to achieve strategic goals',
          'It is only for new staff',
          'It is optional'
        ],
        correctAnswer: 'It strengthens organizational ability to achieve strategic goals',
        required: true
      },
      {
        id: 'strat-8',
        question: 'What is INARA\'s approach to program expansion?',
        type: 'text',
        correctAnswer: 'INARA will expand programs strategically, based on needs assessment, available resources, partnership opportunities, and alignment with organizational capacity and mission.',
        required: true
      },
      {
        id: 'strat-9',
        question: 'How should staff align their work with the strategy?',
        type: 'checkbox',
        options: [
          'By understanding strategic priorities',
          'By setting goals aligned with strategy',
          'By measuring impact',
          'By contributing to strategic objectives',
          'All of the above'
        ],
        correctAnswer: ['All of the above'],
        required: true
      },
      {
        id: 'strat-10',
        question: 'What is the role of technology in INARA\'s future?',
        type: 'text',
        correctAnswer: 'Technology will be used to improve program delivery, enhance communication, increase efficiency, enable data-driven decisions, and expand reach to beneficiaries.',
        required: true
      },
      {
        id: 'strat-11',
        question: 'How will INARA ensure sustainability?',
        type: 'multiple_choice',
        options: [
          'By not expanding',
          'Through diversified funding, strong partnerships, and capacity building',
          'By reducing programs',
          'It is not a concern'
        ],
        correctAnswer: 'Through diversified funding, strong partnerships, and capacity building',
        required: true
      },
      {
        id: 'strat-12',
        question: 'What is expected from staff in supporting the strategy?',
        type: 'text',
        correctAnswer: 'Staff are expected to understand the strategy, align their work with strategic priorities, contribute to organizational goals, participate in capacity building, and help measure and report on impact.',
        required: true
      }
    ]
  }
];

async function createOrientationSteps() {
  try {
    console.log('🚀 Creating orientation steps from PDFs...');

    // Get or create active orientation
    let orientation = await prisma.orientation.findFirst({
      where: { isActive: true },
      orderBy: { version: 'desc' },
    });

    if (!orientation) {
      orientation = await prisma.orientation.create({
        data: {
          title: 'INARA Staff Orientation',
          content: 'Complete orientation for all INARA staff members',
          sections: [],
          isActive: true,
          version: 1,
        },
      });
      console.log('✅ Created new orientation');
    } else {
      console.log('✅ Using existing orientation');
    }

    // Get existing steps to determine next step number
    const existingSteps = await prisma.orientationStep.findMany({
      where: { orientationId: orientation.id },
      orderBy: { stepNumber: 'desc' },
    });

    let nextStepNumber = existingSteps.length > 0 ? existingSteps[0].stepNumber + 1 : 1;

    // Create steps for each PDF
    // Go up from server directory to project root, then to PDF folder
    const pdfBasePath = path.join(process.cwd(), '..', 'INARA Orientation Package 2');
    
    for (const pdfInfo of orientationPDFs) {
      const pdfPath = path.join(pdfBasePath, pdfInfo.filename);
      
      // Check if PDF exists
      if (!fs.existsSync(pdfPath)) {
        console.log(`⚠️  PDF not found: ${pdfInfo.filename}, skipping...`);
        continue;
      }

      // Copy PDF to public/uploads/orientation directory
      const uploadsDir = path.join(process.cwd(), 'server', 'public', 'uploads', 'orientation');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const destPath = path.join(uploadsDir, pdfInfo.filename);
      fs.copyFileSync(pdfPath, destPath);
      // Store URL without /uploads prefix since static server already serves from /uploads
      const pdfUrl = `/uploads/orientation/${pdfInfo.filename}`;

      // Check if step already exists
      const existingStep = await prisma.orientationStep.findFirst({
        where: {
          orientationId: orientation.id,
          title: pdfInfo.title,
        },
      });

      if (existingStep) {
        // Update existing step with new questions
        await prisma.orientationStep.update({
          where: { id: existingStep.id },
          data: {
            questions: pdfInfo.questions,
            pdfUrl: pdfUrl,
          },
        });
        console.log(`✅ Updated step: ${pdfInfo.title} with ${pdfInfo.questions.length} questions`);
      } else {
        // Create orientation step
        await prisma.orientationStep.create({
          data: {
            orientationId: orientation.id,
            stepNumber: nextStepNumber++,
            title: pdfInfo.title,
            description: pdfInfo.description,
            pdfUrl: pdfUrl,
            questions: pdfInfo.questions,
            isRequired: true,
            order: nextStepNumber - 1,
          },
        });

        console.log(`✅ Created step: ${pdfInfo.title} with ${pdfInfo.questions.length} questions`);
      }
    }

    console.log('🎉 Orientation steps created successfully!');
  } catch (error) {
    console.error('❌ Error creating orientation steps:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createOrientationSteps()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
