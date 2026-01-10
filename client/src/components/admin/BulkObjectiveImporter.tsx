// Bulk Objective Importer for Training Module
import { useState } from 'react';

interface BulkObjectiveImporterProps {
  onImport: (objectives: string[]) => void;
  onCancel: () => void;
}

export default function BulkObjectiveImporter({ onImport, onCancel }: BulkObjectiveImporterProps) {
  const [bulkText, setBulkText] = useState('');
  const [importMode, setImportMode] = useState<'format' | 'preview'>('format');
  const [previewObjectives, setPreviewObjectives] = useState<string[]>([]);

  const FORMAT_GUIDE = `📋 BULK OBJECTIVE IMPORT FORMAT

Use this format to paste learning objectives in bulk:

---
- Students will understand the fundamentals of project management
- Participants will be able to create and manage project schedules
- Learners will identify and manage project risks effectively
- Trainees will develop leadership skills for managing teams
- Participants will apply agile methodologies in real-world projects
- Students will evaluate project performance using key metrics

---

RULES:
✓ Start each objective with a dash (-) and a space
✓ One objective per line
✓ Be clear and specific about learning outcomes
✓ Use action verbs (understand, create, identify, develop, apply, evaluate, etc.)
✓ Maximum 100 objectives per bulk import
✓ Objectives should be concise (under 150 characters each)

EXAMPLE OBJECTIVES:
---
- Participants will understand organizational structure and culture
- Learners will apply communication strategies in diverse environments
- Students will develop conflict resolution skills
- Trainees will evaluate team performance and provide feedback
- Employees will implement change management best practices
- Participants will analyze business processes and identify improvements
---`;

  const parseObjectives = (text: string): string[] => {
    const objectives: string[] = [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    for (const line of lines) {
      if (line.startsWith('-')) {
        const objective = line.substring(1).trim();
        if (objective.length > 0) {
          objectives.push(objective);
        }
      }
    }

    return objectives;
  };

  const handlePreview = () => {
    if (!bulkText.trim()) {
      alert('Please paste objectives first');
      return;
    }

    const parsed = parseObjectives(bulkText);
    if (parsed.length === 0) {
      alert('No valid objectives found. Please check the format.');
      return;
    }

    if (parsed.length > 100) {
      alert(`Too many objectives (${parsed.length}). Maximum is 100 per import.`);
      return;
    }

    setPreviewObjectives(parsed);
    setImportMode('preview');
  };

  const handleImport = () => {
    if (previewObjectives.length === 0) {
      alert('No objectives to import');
      return;
    }

    onImport(previewObjectives);
    alert(`✅ Successfully imported ${previewObjectives.length} objectives!`);
  };

  return (
    <div className="space-y-4">
      {importMode === 'format' ? (
        <>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-300 text-sm">
              📝 <strong>Bulk Objective Import:</strong> Paste objectives to add up to 100 at once!
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
                Paste Your Objectives Here
              </label>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={12}
                className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg font-mono text-sm"
                placeholder="- First learning objective&#10;- Second learning objective&#10;- Third learning objective"
              />
              <p className="text-xs text-gray-400 mt-2">
                Characters: {bulkText.length} | Objectives (estimated): {bulkText.match(/^-/gm)?.length || 0}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handlePreview}
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium"
              >
                👁️ Preview Objectives
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
              ✅ <strong>Preview:</strong> {previewObjectives.length} objective(s) found. Review and click Import to add them.
            </p>
          </div>

          <div className="bg-gray-700 rounded-lg p-4 space-y-3 max-h-96 overflow-y-auto">
            {previewObjectives.map((objective, idx) => (
              <div key={idx} className="bg-gray-600 rounded-lg p-3 border border-gray-500 flex gap-3">
                <span className="text-primary-400 font-bold text-sm min-w-fit">{idx + 1}.</span>
                <p className="text-gray-200 text-sm">{objective}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleImport}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              ✅ Import {previewObjectives.length} Objectives
            </button>
            <button
              onClick={() => {
                setImportMode('format');
                setPreviewObjectives([]);
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
