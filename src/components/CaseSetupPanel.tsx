import { useState, useEffect } from 'react';
import type { CaseData, Evidence } from '../types/courtroom';
import { SAMPLE_CASE } from '../data/sampleCase';

interface CaseSetupPanelProps {
  caseData: CaseData;
  onUpdateCase?: (updated: CaseData) => void;
}

const isCaseSetupComplete = (c: CaseData): boolean => {
  return !!(
    c.title?.trim() &&
    c.caseType?.trim() &&
    c.plaintiffSide?.trim() &&
    c.defenseSide?.trim() &&
    c.claimSummary?.trim()
  );
};

export function CaseSetupPanel({ caseData, onUpdateCase }: CaseSetupPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<CaseData>(caseData);
  const [errors, setErrors] = useState<string[]>([]);

  // Sync state if caseData changes externally
  useEffect(() => {
    setEditData(caseData);
  }, [caseData]);

  const handleEdit = () => {
    setEditData(caseData);
    setErrors([]);
    setIsEditing(true);
  };

  const handleLoadPreset = () => {
    const preset: CaseData = {
      ...SAMPLE_CASE,
      caseSource: 'preset',
      presetId: 'hen-egg',
      schemaVersion: 2,
    };
    onUpdateCase?.(preset);
  };

  const handleSave = () => {
    const newErrors: string[] = [];
    if (!editData.title?.trim()) newErrors.push('Case Title is required.');
    if (!editData.caseType?.trim()) newErrors.push('Case Type is required.');
    if (!editData.plaintiffSide?.trim()) newErrors.push('Plaintiff is required.');
    if (!editData.defenseSide?.trim()) newErrors.push('Defense is required.');
    if (!editData.claimSummary?.trim()) newErrors.push('Claim Summary is required.');

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors([]);
    onUpdateCase?.({
      ...editData,
      caseSource: editData.caseSource || 'custom',
      schemaVersion: 2,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(caseData);
    setErrors([]);
    setIsEditing(false);
  };

  // Key facts management
  const addKeyFact = () => {
    setEditData(prev => ({ ...prev, keyFacts: [...(prev.keyFacts || []), ''] }));
  };

  const updateKeyFact = (index: number, value: string) => {
    setEditData(prev => {
      const facts = [...(prev.keyFacts || [])];
      facts[index] = value;
      return { ...prev, keyFacts: facts };
    });
  };

  const removeKeyFact = (index: number) => {
    setEditData(prev => ({ ...prev, keyFacts: (prev.keyFacts || []).filter((_, i) => i !== index) }));
  };

  // Evidence management
  const addEvidence = () => {
    const evidenceItems = editData.evidenceItems || [];
    const newId = `E${(evidenceItems.length + 1).toString().padStart(2, '0')}`;
    const newEvidence: Evidence = {
      id: newId,
      title: 'New Evidence',
      type: 'document',
      confidentiality: 'public',
      summary: 'Enter evidence summary',
      content: '',
      introducedBy: 'prosecutor',
      status: 'pending',
    };
    setEditData(prev => ({ ...prev, evidenceItems: [...(prev.evidenceItems || []), newEvidence] }));
  };

  const updateEvidence = (index: number, updates: Partial<Evidence>) => {
    setEditData(prev => {
      const items = [...(prev.evidenceItems || [])];
      items[index] = { ...items[index], ...updates };
      return { ...prev, evidenceItems: items };
    });
  };

  const removeEvidence = (index: number) => {
    setEditData(prev => ({ ...prev, evidenceItems: (prev.evidenceItems || []).filter((_, i) => i !== index) }));
  };

  const displayData = isEditing ? editData : caseData;

  return (
    <div className="bg-courtroom-card rounded-lg border border-gray-700">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          📁 Case Information
        </h3>
        <div className="flex gap-2">
          {!isEditing && onUpdateCase && (
            <>
              <button
                onClick={handleLoadPreset}
                className="text-xs px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors duration-200"
              >
                📋 Load Hen v. Egg Preset
              </button>
              <button
                onClick={handleEdit}
                className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors duration-200"
              >
                ✏️ Edit
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        /* Edit Mode Form */
        <div className="p-4 space-y-4">
          {errors.length > 0 && (
            <div className="bg-red-950/40 border border-red-500/30 rounded p-2 text-xs text-red-400 space-y-1">
              {errors.map((err, i) => (
                <div key={i}>• {err}</div>
              ))}
            </div>
          )}

          {/* Basic fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 uppercase mb-1">Case Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={editData.title || ''}
                onChange={e => setEditData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full text-sm bg-gray-800 border border-gray-600 rounded px-2 py-1 text-yellow-500 focus:border-yellow-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase mb-1">Case Type <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={editData.caseType || ''}
                onChange={e => setEditData(prev => ({ ...prev, caseType: e.target.value }))}
                className="w-full text-sm bg-gray-800 border border-gray-600 rounded px-2 py-1 focus:border-yellow-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Plaintiff <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editData.plaintiffSide || ''}
                  onChange={e => setEditData(prev => ({ ...prev, plaintiffSide: e.target.value }))}
                  className="w-full text-sm bg-gray-800 border border-gray-600 rounded px-2 py-1 focus:border-yellow-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Defense <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editData.defenseSide || ''}
                  onChange={e => setEditData(prev => ({ ...prev, defenseSide: e.target.value }))}
                  className="w-full text-sm bg-gray-800 border border-gray-600 rounded px-2 py-1 focus:border-yellow-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Claim summary */}
          <div>
            <label className="block text-xs text-gray-500 uppercase mb-1">Claim Summary <span className="text-red-500">*</span></label>
            <textarea
              value={editData.claimSummary || ''}
              onChange={e => setEditData(prev => ({ ...prev, claimSummary: e.target.value }))}
              rows={3}
              className="w-full text-sm bg-gray-800 border border-gray-600 rounded px-2 py-1 focus:border-yellow-500 focus:outline-none"
            />
          </div>

          {/* Key facts */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-gray-500 uppercase">Key Facts (Optional)</label>
              <button onClick={addKeyFact} className="text-xs text-blue-400 hover:text-blue-300">
                + Add Fact
              </button>
            </div>
            <div className="space-y-2">
              {(editData.keyFacts || []).map((fact, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-gray-500 text-sm pt-1">{i + 1}.</span>
                  <input
                    type="text"
                    value={fact}
                    onChange={e => updateKeyFact(i, e.target.value)}
                    className="flex-1 text-sm bg-gray-800 border border-gray-600 rounded px-2 py-1 focus:border-yellow-500 focus:outline-none"
                  />
                  <button
                    onClick={() => removeKeyFact(i)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence items */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-gray-500 uppercase">Evidence Items (Optional)</label>
              <button onClick={addEvidence} className="text-xs text-blue-400 hover:text-blue-300">
                + Add Evidence
              </button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {(editData.evidenceItems || []).map((ev, i) => (
                <div key={ev.id} className="bg-gray-800 rounded p-2 text-xs">
                  <input
                    type="text"
                    value={ev.title}
                    onChange={e => updateEvidence(i, { title: e.target.value })}
                    className="w-full bg-transparent border-b border-gray-600 text-sm mb-1 text-yellow-500 focus:border-yellow-500 focus:outline-none"
                    placeholder="Evidence title"
                  />
                  <div className="flex gap-2">
                    <select
                      value={ev.type}
                      onChange={e => updateEvidence(i, { type: e.target.value as Evidence['type'] })}
                      className="bg-gray-700 rounded px-1 text-white"
                    >
                      <option value="document">Document</option>
                      <option value="email">Email</option>
                      <option value="report">Report</option>
                      <option value="physical">Physical</option>
                      <option value="digital">Digital</option>
                    </select>
                    <input
                      type="text"
                      value={ev.summary}
                      onChange={e => updateEvidence(i, { summary: e.target.value })}
                      className="flex-1 bg-gray-700 rounded px-1 text-white focus:outline-none"
                      placeholder="Summary"
                    />
                    <button
                      onClick={() => removeEvidence(i)}
                      className="text-red-400 hover:text-red-300 font-bold"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded py-2 transition-colors duration-200"
            >
              💾 Save
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 text-sm bg-gray-600 hover:bg-gray-500 text-white rounded py-2 transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* Display Mode */
        <div className="p-4 space-y-4">
          {/* Validation Warning Banner if incomplete */}
          {!isCaseSetupComplete(displayData) && (
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-400 space-y-2">
              <p className="font-semibold">⚠️ Case Setup Incomplete</p>
              <p>Please click the <b>Edit</b> button to fill in all required fields (Title, Type, Plaintiff, Defense, and Claim Summary) or click <b>Load Hen v. Egg Preset</b> before starting the simulation.</p>
            </div>
          )}

          {/* Case header */}
          <div>
            <h4 className="text-lg font-bold text-yellow-500 mb-1">
              {displayData.title || 'Untitled Case'}
            </h4>
            <p className="text-sm text-gray-400">{displayData.caseType || 'No case type specified'}</p>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-900/20 rounded-lg p-3 border border-emerald-700">
              <h5 className="text-xs text-emerald-400 uppercase mb-1">Plaintiff</h5>
              <p className="text-sm font-medium">{displayData.plaintiffSide || 'Not specified'}</p>
            </div>
            <div className="bg-rose-900/20 rounded-lg p-3 border border-rose-700">
              <h5 className="text-xs text-rose-400 uppercase mb-1">Defendant</h5>
              <p className="text-sm font-medium">{displayData.defenseSide || 'Not specified'}</p>
            </div>
          </div>

          {/* Claim summary */}
          <div>
            <h5 className="text-xs text-gray-500 uppercase mb-2">Claim Summary</h5>
            <p className="text-sm">{displayData.claimSummary || 'No claim summary specified.'}</p>
          </div>

          {/* Key facts */}
          <div>
            <h5 className="text-xs text-gray-500 uppercase mb-2">Key Facts</h5>
            {!displayData.keyFacts || displayData.keyFacts.length === 0 ? (
              <p className="text-sm text-gray-400 italic">
                Facts will be collected dynamically as the trial proceeds.
              </p>
            ) : (
              <ul className="text-sm space-y-1">
                {displayData.keyFacts.slice(0, 4).map((fact, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300">
                    <span className="text-gray-500">{i + 1}.</span>
                    <span>{fact}</span>
                  </li>
                ))}
                {displayData.keyFacts.length > 4 && (
                  <li className="text-gray-500 text-xs">
                    ...and {displayData.keyFacts.length - 4} more facts
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Legal questions */}
          <div>
            <h5 className="text-xs text-gray-500 uppercase mb-2">Legal Questions</h5>
            {!displayData.legalQuestions || displayData.legalQuestions.length === 0 ? (
              <p className="text-sm text-gray-400 italic">
                Questions will be resolved dynamically during deliberation.
              </p>
            ) : (
              <ul className="text-sm space-y-1">
                {displayData.legalQuestions.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-400">
                    <span className="text-yellow-500">?</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Disclaimer */}
          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
            <p className="text-xs text-yellow-500">
              ⚠️ This is a fictional case created for educational and experimental purposes only.
              It is not legal advice and should not be used for any legal proceeding.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
