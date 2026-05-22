/**
 * CaseSetupPanel — Display and edit case information before trial starts
 * Phase 6.5: Editable case setup
 */

import { useState } from 'react';
import type { CaseData, Evidence } from '../types/courtroom';

interface CaseSetupPanelProps {
  caseData: CaseData;
  onUpdateCase?: (updated: CaseData) => void;
}

export function CaseSetupPanel({ caseData, onUpdateCase }: CaseSetupPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<CaseData>(caseData);

  // Sync when edit mode opens
  const handleEdit = () => {
    setEditData(caseData);
    setIsEditing(true);
  };

  const handleSave = () => {
    onUpdateCase?.(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(caseData);
    setIsEditing(false);
  };

  // Key facts management
  const addKeyFact = () => {
    setEditData(prev => ({ ...prev, keyFacts: [...prev.keyFacts, ''] }));
  };

  const updateKeyFact = (index: number, value: string) => {
    setEditData(prev => {
      const facts = [...prev.keyFacts];
      facts[index] = value;
      return { ...prev, keyFacts: facts };
    });
  };

  const removeKeyFact = (index: number) => {
    setEditData(prev => ({ ...prev, keyFacts: prev.keyFacts.filter((_, i) => i !== index) }));
  };

  // Evidence management
  const addEvidence = () => {
    const newId = `E${(editData.evidenceItems.length + 1).toString().padStart(2, '0')}`;
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
    setEditData(prev => ({ ...prev, evidenceItems: [...prev.evidenceItems, newEvidence] }));
  };

  const updateEvidence = (index: number, updates: Partial<Evidence>) => {
    setEditData(prev => {
      const items = [...prev.evidenceItems];
      items[index] = { ...items[index], ...updates };
      return { ...prev, evidenceItems: items };
    });
  };

  const removeEvidence = (index: number) => {
    setEditData(prev => ({ ...prev, evidenceItems: prev.evidenceItems.filter((_, i) => i !== index) }));
  };

  const displayData = isEditing ? editData : caseData;

  return (
    <div className="bg-courtroom-card rounded-lg border border-gray-700">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          📁 Case Information
        </h3>
        {!isEditing && onUpdateCase && (
          <button
            onClick={handleEdit}
            className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded"
          >
            ✏️ Edit
          </button>
        )}
      </div>{isEditing ? (
        /* Edit Mode Form */
        <div className="p-4 space-y-4">
          {/* Basic fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 uppercase mb-1">Case Title</label>
              <input
                type="text"
                value={editData.title}
                onChange={e => setEditData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full text-sm bg-gray-800 border border-gray-600 rounded px-2 py-1 text-yellow-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase mb-1">Case Type</label>
              <input
                type="text"
                value={editData.caseType}
                onChange={e => setEditData(prev => ({ ...prev, caseType: e.target.value }))}
                className="w-full text-sm bg-gray-800 border border-gray-600 rounded px-2 py-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Plaintiff</label>
                <input
                  type="text"
                  value={editData.plaintiffSide}
                  onChange={e => setEditData(prev => ({ ...prev, plaintiffSide: e.target.value }))}
                  className="w-full text-sm bg-gray-800 border border-gray-600 rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Defense</label>
                <input
                  type="text"
                  value={editData.defenseSide}
                  onChange={e => setEditData(prev => ({ ...prev, defenseSide: e.target.value }))}
                  className="w-full text-sm bg-gray-800 border border-gray-600 rounded px-2 py-1"
                />
              </div>
            </div>
          </div>

          {/* Claim summary */}
          <div>
            <label className="block text-xs text-gray-500 uppercase mb-1">Claim Summary</label>
            <textarea
              value={editData.claimSummary}
              onChange={e => setEditData(prev => ({ ...prev, claimSummary: e.target.value }))}
              rows={3}
              className="w-full text-sm bg-gray-800 border border-gray-600 rounded px-2 py-1"
            />
          </div>

          {/* Key facts */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-gray-500 uppercase">Key Facts</label>
              <button onClick={addKeyFact} className="text-xs text-blue-400 hover:text-blue-300">
                + Add Fact
              </button>
            </div>
            <div className="space-y-2">
              {editData.keyFacts.map((fact, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-gray-500 text-sm pt-1">{i + 1}.</span>
                  <input
                    type="text"
                    value={fact}
                    onChange={e => updateKeyFact(i, e.target.value)}
                    className="flex-1 text-sm bg-gray-800 border border-gray-600 rounded px-2 py-1"
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
              <label className="text-xs text-gray-500 uppercase">Evidence Items</label>
              <button onClick={addEvidence} className="text-xs text-blue-400 hover:text-blue-300">
                + Add Evidence
              </button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {editData.evidenceItems.map((ev, i) => (
                <div key={ev.id} className="bg-gray-800 rounded p-2 text-xs">
                  <input
                    type="text"
                    value={ev.title}
                    onChange={e => updateEvidence(i, { title: e.target.value })}
                    className="w-full bg-transparent border-b border-gray-600 text-sm mb-1"
                    placeholder="Evidence title"
                  />
                  <div className="flex gap-2">
                    <select
                      value={ev.type}
                      onChange={e => updateEvidence(i, { type: e.target.value as Evidence['type'] })}
                      className="bg-gray-700 rounded px-1"
                    >
                      <option value="document">Document</option>
                      <option value="email">Email</option>
                      <option value="contract">Contract</option>
                      <option value="log">Log</option>
                      <option value="physical">Physical</option>
                    </select>
                    <input
                      type="text"
                      value={ev.summary}
                      onChange={e => updateEvidence(i, { summary: e.target.value })}
                      className="flex-1 bg-gray-700 rounded px-1"
                      placeholder="Summary"
                    />
                    <button
                      onClick={() => removeEvidence(i)}
                      className="text-red-400 hover:text-red-300"
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
              className="flex-1 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded py-2"
            >
              💾 Save
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 text-sm bg-gray-600 hover:bg-gray-500 text-white rounded py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* Display Mode */
        <div className="p-4 space-y-4">
          {/* Case header */}
          <div>
            <h4 className="text-lg font-bold text-yellow-500 mb-1">
              {displayData.title}
            </h4>
            <p className="text-sm text-gray-400">{displayData.caseType}</p>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-900/20 rounded-lg p-3 border border-emerald-700">
              <h5 className="text-xs text-emerald-400 uppercase mb-1">Plaintiff</h5>
              <p className="text-sm font-medium">{displayData.plaintiffSide}</p>
            </div>
            <div className="bg-rose-900/20 rounded-lg p-3 border border-rose-700">
              <h5 className="text-xs text-rose-400 uppercase mb-1">Defendant</h5>
              <p className="text-sm font-medium">{displayData.defenseSide}</p>
            </div>
          </div>

          {/* Claim summary */}
          <div>
            <h5 className="text-xs text-gray-500 uppercase mb-2">Claim Summary</h5>
            <p className="text-sm">{displayData.claimSummary}</p>
          </div>

          {/* Key facts */}
          <div>
            <h5 className="text-xs text-gray-500 uppercase mb-2">Key Facts</h5>
            {displayData.keyFacts.length === 0 ? (
              <p className="text-sm text-gray-400 italic">
                Facts will be collected as agents present arguments.
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
            <ul className="text-sm space-y-1">
              {displayData.legalQuestions.map((q, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-400">
                  <span className="text-yellow-500">?</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
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
