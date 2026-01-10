// Bulk Lesson Importer for Training Module
import { useState } from 'react';

interface Lesson {
  title: string;
  content: string;
  slides: {
    title: string;
    content: string;
  }[];
}

interface BulkLessonImporterProps {
  onImport: (lessons: Lesson[]) => void;
  onCancel: () => void;
}

export default function BulkLessonImporter({ onImport, onCancel }: BulkLessonImporterProps) {
  const [bulkText, setBulkText] = useState('');
  const [importMode, setImportMode] = useState<'format' | 'preview'>('format');
  const [previewLessons, setPreviewLessons] = useState<Lesson[]>([]);

  const FORMAT_GUIDE = `📋 BULK LESSON IMPORT FORMAT

Use this format to paste or upload lessons in bulk:

---
LESSON: Introduction to Project Management
LESSON_OVERVIEW: Learn the fundamentals of managing projects effectively
SLIDE: Project Definition
- A project is a temporary endeavor undertaken to produce a unique product, service, or result
- Projects have a defined beginning and end
- Projects differ from operations which are ongoing

SLIDE: Project Constraints
- Scope: What needs to be done
- Time: When it must be completed
- Cost: How much it will cost

LESSON: Planning & Scheduling
LESSON_OVERVIEW: Master the art of planning and scheduling projects
SLIDE: Planning Process
- Define scope and objectives
- Identify stakeholders
- Create work breakdown structure

SLIDE: Scheduling Basics
- Identify tasks and subtasks
- Estimate durations
- Sequence activities

---

RULES:
✓ Start each lesson with "LESSON: [Title]"
✓ Add lesson overview with "LESSON_OVERVIEW: [Description]" (optional)
✓ Add slides with "SLIDE: [Slide Title]"
✓ List slide content as bullet points (lines starting with -)
✓ Use blank lines to separate lessons and slides
✓ Maximum 100 lessons per bulk import
✓ Each lesson needs at least 1 slide
✓ Each slide should have descriptive content

EXAMPLE with Multiple Lessons:
---
LESSON: Basic Concepts
LESSON_OVERVIEW: Foundation for beginners
SLIDE: What is Leadership?
- Leadership is the process of guiding people
- It requires vision and communication
- Great leaders inspire others

SLIDE: Leadership Styles
- Autocratic: Leader makes all decisions
- Democratic: Team participates in decisions
- Laissez-faire: Minimal leader involvement

LESSON: Advanced Topics
LESSON_OVERVIEW: For experienced professionals  
SLIDE: Strategic Planning
- Vision setting and goal alignment
- Market analysis
- Resource allocation

SLIDE: Change Management
- Stakeholder engagement
- Communication strategy
- Resistance management
---`;

  const parseBulkLessons = (text: string): Lesson[] => {
    const lessons: Lesson[] = [];
    const lessonBlocks = text.split(/(?=LESSON:)/);

    for (const block of lessonBlocks) {
      if (!block.trim()) continue;

      let lessonTitle = '';
      let lessonOverview = '';
      const slides: { title: string; content: string }[] = [];

      const lines = block.split('\n').map(l => l.trim()).filter(l => l);
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Parse lesson title
        if (line.startsWith('LESSON:')) {
          lessonTitle = line.replace('LESSON:', '').trim();
        }
        // Parse lesson overview
        else if (line.startsWith('LESSON_OVERVIEW:')) {
          lessonOverview = line.replace('LESSON_OVERVIEW:', '').trim();
        }
        // Parse slides
        else if (line.startsWith('SLIDE:')) {
          const slideTitle = line.replace('SLIDE:', '').trim();
          const slideContent: string[] = [];

          // Collect slide content (bullet points)
          i++;
          while (i < lines.length && !lines[i].startsWith('SLIDE:') && !lines[i].startsWith('LESSON:')) {
            const contentLine = lines[i];
            if (contentLine.startsWith('-')) {
              slideContent.push(contentLine.substring(1).trim());
            }
            i++;
          }
          i--; // Back up one line since the loop will increment

          if (slideTitle && slideContent.length > 0) {
            slides.push({
              title: slideTitle,
              content: slideContent.join('\n'),
            });
          }
        }
      }

      // Add lesson if it has title and slides
      if (lessonTitle && slides.length > 0) {
        lessons.push({
          title: lessonTitle,
          content: lessonOverview,
          slides,
        });
      }
    }

    return lessons;
  };

  const handlePreview = () => {
    if (!bulkText.trim()) {
      alert('Please paste lesson content first');
      return;
    }

    const parsed = parseBulkLessons(bulkText);
    if (parsed.length === 0) {
      alert('No valid lessons found. Please check the format.');
      return;
    }

    if (parsed.length > 100) {
      alert(`Too many lessons (${parsed.length}). Maximum is 100 per import.`);
      return;
    }

    setPreviewLessons(parsed);
    setImportMode('preview');
  };

  const handleImport = () => {
    if (previewLessons.length === 0) {
      alert('No lessons to import');
      return;
    }

    onImport(previewLessons);
    alert(`✅ Successfully imported ${previewLessons.length} lessons!`);
  };

  return (
    <div className="space-y-4">
      {importMode === 'format' ? (
        <>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-300 text-sm">
              📝 <strong>Bulk Lesson Import:</strong> Paste lessons in the specified format to add up to 100 lessons at once!
            </p>
          </div>

          <div className="bg-gray-700 rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                📋 Format Guide (Click to Copy)
              </label>
              <div className="bg-gray-600 border border-gray-500 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                  {FORMAT_GUIDE}
                </pre>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Paste Your Lessons Here
              </label>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={15}
                className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg font-mono text-sm"
                placeholder="LESSON: Your Lesson Title&#10;LESSON_OVERVIEW: Brief overview&#10;SLIDE: Slide Title&#10;- Bullet point 1&#10;- Bullet point 2"
              />
              <p className="text-xs text-gray-400 mt-2">
                Characters: {bulkText.length} | Lessons (estimated): {bulkText.match(/LESSON:/g)?.length || 0}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handlePreview}
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium"
              >
                👁️ Preview Lessons
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
              ✅ <strong>Preview:</strong> {previewLessons.length} lesson(s) found. Review and click Import to add them.
            </p>
          </div>

          <div className="bg-gray-700 rounded-lg p-4 space-y-4 max-h-96 overflow-y-auto">
            {previewLessons.map((lesson, idx) => (
              <div key={idx} className="bg-gray-600 rounded-lg p-3 border border-gray-500">
                <h4 className="text-white font-bold text-sm mb-2">📚 Lesson {idx + 1}: {lesson.title}</h4>
                {lesson.content && (
                  <p className="text-gray-300 text-xs mb-2">Overview: {lesson.content}</p>
                )}
                <div className="text-xs text-gray-400 space-y-1">
                  <p className="font-semibold text-gray-300">Slides ({lesson.slides.length}):</p>
                  {lesson.slides.map((slide, slideIdx) => (
                    <div key={slideIdx} className="ml-2 text-gray-400">
                      <p>• <strong>{slide.title}</strong></p>
                      <p className="ml-4 text-gray-500">{slide.content.substring(0, 60)}...</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleImport}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              ✅ Import {previewLessons.length} Lessons
            </button>
            <button
              onClick={() => {
                setImportMode('format');
                setPreviewLessons([]);
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
