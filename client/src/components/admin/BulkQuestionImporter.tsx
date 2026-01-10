// Bulk Question Importer for Training Module
import { useState } from 'react';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface BulkQuestionImporterProps {
  onImport: (questions: Question[]) => void;
  onCancel: () => void;
}

export default function BulkQuestionImporter({ onImport, onCancel }: BulkQuestionImporterProps) {
  const [questionType, setQuestionType] = useState<'multiple-choice'>('multiple-choice');
  const [bulkText, setBulkText] = useState('');
  const [importMode, setImportMode] = useState<'format' | 'preview'>('format');
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);

  const MULTIPLE_CHOICE_GUIDE = `📋 MULTIPLE CHOICE QUESTION FORMAT

Use this format to paste questions in bulk:

---
Q1: What is the main purpose of project management?
- Minimize project duration
- Maximize profit margins
- Deliver project objectives within constraints
- Reduce team size
A1: Deliver project objectives within constraints
E1: Project management balances scope, time, cost, and quality to meet stakeholder expectations.

Q2: Which of the following is NOT a project constraint?
- Scope
- Time
- Team morale
- Cost
A2: Team morale
E2: The triple constraint (later expanded to scope, time, cost, quality) defines project constraints.

Q3: What is scope creep?
- Adding features without approval
- Running out of budget
- Missing deadlines
- Losing team members
A3: Adding features without approval
E3: Scope creep occurs when project scope expands uncontrollably, impacting time and cost.

---

RULES:
✓ Start question with "Q[number]: [Question text]"
✓ Add options as bullet points "- [Option text]"
✓ Add correct answer with "A[number]: [Exact option text]"
✓ Optionally add explanation with "E[number]: [Explanation text]"
✓ Each question must have exactly 4 options
✓ Correct answer MUST match one of the options exactly
✓ Maximum 100 questions per bulk import
✓ Numbers must be sequential (Q1, Q2, Q3...)

MULTIPLE-CHOICE EXAMPLE:
---
Q1: What year was INARA founded?
- 2015
- 2018
- 2020
- 2022
A1: 2020
E1: INARA was established in 2020 as an international aid organization.

Q2: Which of the following is a core value of INARA?
- Profit maximization
- Transparency and accountability
- Speed over quality
- Minimal stakeholder engagement
A2: Transparency and accountability
E2: INARA operates with full transparency and is accountable to all stakeholders.

Q3: What does INARA stand for?
- International Network for Aid Relief and Assistance
- International Network for Advanced Research and Assessment
- International Network for Analysis Research and Advancement
- International Network for Aid Regulation and Administration
A3: International Network for Aid Relief and Assistance
E3: INARA's full name reflects its commitment to providing aid and relief globally.
---`;

  const parseMultipleChoice = (text: string): Question[] => {
    const questions: Question[] = [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    let currentQuestion: Partial<Question> | null = null;
    let questionNumber = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // New question
      if (line.match(/^Q\d+:/)) {
        if (currentQuestion && currentQuestion.question && currentQuestion.options?.length === 4 && currentQuestion.correctAnswer !== undefined) {
          questions.push({
            question: currentQuestion.question,
            options: currentQuestion.options,
            correctAnswer: currentQuestion.correctAnswer,
            explanation: currentQuestion.explanation || '',
          });
        }
        
        questionNumber++;
        currentQuestion = {
          question: line.replace(/^Q\d+:\s*/, ''),
          options: [],
          correctAnswer: undefined,
          explanation: '',
        };
      }
      // Option (bullet point)
      else if (line.startsWith('-') && currentQuestion && !currentQuestion.options) {
        currentQuestion.options = [];
      }
      
      if (line.startsWith('-') && currentQuestion && Array.isArray(currentQuestion.options)) {
        const option = line.substring(1).trim();
        if (option && currentQuestion.options.length < 4) {
          currentQuestion.options.push(option);
        }
      }
      // Correct answer
      else if (line.match(/^A\d+:/) && currentQuestion) {
        const answerText = line.replace(/^A\d+:\s*/, '').trim();
        if (currentQuestion.options) {
          const idx = currentQuestion.options.indexOf(answerText);
          if (idx !== -1) {
            currentQuestion.correctAnswer = idx;
          } else {
            console.warn(`Answer "${answerText}" not found in options`);
          }
        }
      }
      // Explanation
      else if (line.match(/^E\d+:/) && currentQuestion) {
        currentQuestion.explanation = line.replace(/^E\d+:\s*/, '').trim();
      }
    }

    // Add last question
    if (currentQuestion && currentQuestion.question && currentQuestion.options?.length === 4 && currentQuestion.correctAnswer !== undefined) {
      questions.push({
        question: currentQuestion.question,
        options: currentQuestion.options,
        correctAnswer: currentQuestion.correctAnswer,
        explanation: currentQuestion.explanation || '',
      });
    }

    return questions;
  };

  const handlePreview = () => {
    if (!bulkText.trim()) {
      alert('Please paste questions first');
      return;
    }

    let parsed: Question[] = [];
    
    if (questionType === 'multiple-choice') {
      parsed = parseMultipleChoice(bulkText);
    }

    if (parsed.length === 0) {
      alert('No valid questions found. Please check the format and ensure:' + 
            '\n✓ Each question has exactly 4 options\n✓ Correct answer matches an option exactly\n✓ Format is correct');
      return;
    }

    if (parsed.length > 100) {
      alert(`Too many questions (${parsed.length}). Maximum is 100 per import.`);
      return;
    }

    setPreviewQuestions(parsed);
    setImportMode('preview');
  };

  const handleImport = () => {
    if (previewQuestions.length === 0) {
      alert('No questions to import');
      return;
    }

    onImport(previewQuestions);
    alert(`✅ Successfully imported ${previewQuestions.length} questions!`);
  };

  return (
    <div className="space-y-4">
      {importMode === 'format' ? (
        <>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-300 text-sm">
              📝 <strong>Bulk Question Import:</strong> Paste questions in the specified format to add up to 100 questions at once!
            </p>
          </div>

          {/* Question Type Selector */}
          <div className="bg-gray-700 rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-3">Question Type</label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-600">
                  <input
                    type="radio"
                    name="questionType"
                    value="multiple-choice"
                    checked={questionType === 'multiple-choice'}
                    onChange={(e) => setQuestionType('multiple-choice' as any)}
                    className="w-4 h-4 text-primary-500"
                  />
                  <span className="text-gray-300">
                    ❓ Multiple Choice (4 options with 1 correct answer)
                  </span>
                </label>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                More question types (True/False, Matching, etc.) coming soon!
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                📋 Format Guide
              </label>
              <div className="bg-gray-600 border border-gray-500 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                  {MULTIPLE_CHOICE_GUIDE}
                </pre>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Paste Your Questions Here
              </label>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={15}
                className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg font-mono text-sm"
                placeholder="Q1: Your question here?&#10;- Option 1&#10;- Option 2&#10;- Option 3&#10;- Option 4&#10;A1: Option 1&#10;E1: Explanation here"
              />
              <p className="text-xs text-gray-400 mt-2">
                Characters: {bulkText.length} | Questions (estimated): {bulkText.match(/^Q\d+:/gm)?.length || 0}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handlePreview}
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium"
              >
                👁️ Preview Questions
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <p className="text-green-300 text-sm">
              ✅ <strong>Preview:</strong> {previewQuestions.length} question(s) found. Review and click Import to add them.
            </p>
          </div>

          <div className="bg-gray-700 rounded-lg p-4 space-y-3 max-h-96 overflow-y-auto">
            {previewQuestions.map((q, idx) => (
              <div key={idx} className="bg-gray-600 rounded-lg p-3 border border-gray-500">
                <h4 className="text-white font-bold text-sm mb-2">❓ Q{idx + 1}: {q.question}</h4>
                <div className="space-y-1">
                  {q.options.map((opt, optIdx) => (
                    <div
                      key={optIdx}
                      className={`text-xs p-2 rounded ml-2 ${
                        optIdx === q.correctAnswer
                          ? 'bg-green-500/20 text-green-300 font-semibold'
                          : 'text-gray-400'
                      }`}
                    >
                      {optIdx === q.correctAnswer ? '✓' : '○'} {opt}
                    </div>
                  ))}
                </div>
                {q.explanation && (
                  <p className="text-xs text-gray-300 mt-2 ml-2">💡 {q.explanation.substring(0, 80)}...</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleImport}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              ✅ Import {previewQuestions.length} Questions
            </button>
            <button
              onClick={() => {
                setImportMode('format');
                setPreviewQuestions([]);
              }}
              className="px-4 py-2 bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-500"
            >
              Back
            </button>
          </div>
        </>
      )}
    </div>
  );
}
