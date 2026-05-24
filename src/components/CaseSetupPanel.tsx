import { useState, useEffect } from 'react';
import type { CaseData, Evidence } from '../types/courtroom';
import { SAMPLE_CASE } from '../data/sampleCase';
import { fetchCaseDraftFromAI, generateFallbackCase } from '../utils/caseDraftGenerator';

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
  
  // AI Generator states
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<CaseData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

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

  // Call case draft generator utility
  const handleGenerateDraft = async () => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) return;
    
    setIsGenerating(true);
    setErrors([]);
    
    try {
      const draft = await fetchCaseDraftFromAI(cleanPrompt);
      
      const completeDraft: CaseData = {
        id: `case-gen-${Date.now()}`,
        title: draft.title || 'Generated Case',
        caseType: draft.caseType || 'Performance Dispute',
        plaintiffSide: draft.plaintiffSide || 'Plaintiff',
        defenseSide: draft.defenseSide || 'Defendant',
        claimSummary: draft.claimSummary || 'No summary generated.',
        keyFacts: draft.keyFacts || [],
        evidenceItems: draft.evidenceItems || [],
        legalQuestions: draft.legalQuestions || [],
        caseSource: 'custom',
        schemaVersion: 2
      };
      
      setGeneratedDraft(completeDraft);
      setShowPreview(true);
    } catch (err) {
      console.warn('AI Case Generation failed, executing local fallback:', err);
      // Fallback to local, deterministic case generator
      const fallback = generateFallbackCase(cleanPrompt);
      setGeneratedDraft(fallback);
      setShowPreview(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const displayData = isEditing ? editData : caseData;

  return (
    <div className="bg-courtroom-card rounded-lg border border-gray-700 shadow-md flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/60">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          📁 Case Information
        </h3>
        <div className="flex gap-1.5">
          {!isEditing && (
            <>
              <button
                onClick={handleLoadPreset}
                className="text-[10px] font-bold px-2 py-1 bg-purple-700 hover:bg-purple-650 text-white rounded transition-colors duration-200"
                title="Load Hen v. Egg Preset case"
              >
                📋 Load Preset
              </button>
              <button
                onClick={handleEdit}
                className="text-[10px] font-bold px-2 py-1 bg-blue-700 hover:bg-blue-650 text-white rounded transition-colors duration-200"
              >
                ✏️ Edit
              </button>
            </>
          )}
        </div>
      </div>

      {/* AI Prompt Box (Visible only when not editing) */}
      {!isEditing && (
        <div className="p-3 border-b border-gray-750 bg-gray-900/30 space-y-2.5">
          <div>
            <span className="block text-[10px] font-bold text-yellow-500 uppercase tracking-wider mb-0.5">
              🪄 Generate Case Draft
            </span>
            <p className="text-[11px] text-gray-400 leading-normal">
              Describe your dispute in one or two lines. JudgeBench can draft the courtroom case for you.
            </p>
          </div>
          
          <div className="space-y-1.5">
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Example: ChatGPT and Claude are debating which AI assistant is better for students."
              className="w-full text-xs bg-gray-800/80 border border-gray-700 rounded-lg p-2 text-gray-200 focus:border-yellow-600 focus:outline-none min-h-[50px] max-h-[80px] resize-none transition-colors duration-200"
            />
            <button
              onClick={handleGenerateDraft}
              disabled={isGenerating || !prompt.trim()}
              className={`w-full text-xs py-2 px-3 font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
                prompt.trim() && !isGenerating
                  ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow shadow-yellow-950/20 active:scale-[0.98]'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isGenerating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></span>
                  Generating case details...
                </>
              ) : (
                'Generate Case Draft ✨'
              )}
            </button>
          </div>
        </div>
      )}

      {isEditing ? (
        /* Edit Mode Form */
        <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
          {errors.length > 0 && (
            <div className="bg-red-950/40 border border-red-500/30 rounded p-2 text-xs text-red-400 space-y-1">
              {errors.map((err, i) => (
                <div key={i}>• {err}</div>
              ))}
            </div>
          )}

          {/* Basic fields */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] text-gray-400 font-semibold uppercase mb-1">Case Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={editData.title || ''}
                onChange={e => setEditData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full text-xs bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-yellow-500 focus:border-yellow-600 focus:outline-none transition-colors duration-200"
                placeholder="e.g. ChatGPT v. Claude: AI Superiority Dispute"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 font-semibold uppercase mb-1">Case Type <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={editData.caseType || ''}
                onChange={e => setEditData(prev => ({ ...prev, caseType: e.target.value }))}
                className="w-full text-xs bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 focus:border-yellow-600 focus:outline-none transition-colors duration-200"
                placeholder="e.g. Intellectual Property Dispute"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-gray-400 font-semibold uppercase mb-1">Plaintiff <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editData.plaintiffSide || ''}
                  onChange={e => setEditData(prev => ({ ...prev, plaintiffSide: e.target.value }))}
                  className="w-full text-xs bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 focus:border-yellow-600 focus:outline-none transition-colors duration-200"
                  placeholder="e.g. OpenAI (ChatGPT)"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 font-semibold uppercase mb-1">Defendant <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editData.defenseSide || ''}
                  onChange={e => setEditData(prev => ({ ...prev, defenseSide: e.target.value }))}
                  className="w-full text-xs bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 focus:border-yellow-600 focus:outline-none transition-colors duration-200"
                  placeholder="e.g. Anthropic (Claude)"
                />
              </div>
            </div>
          </div>

          {/* Claim summary */}
          <div>
            <label className="block text-[10px] text-gray-400 font-semibold uppercase mb-1">Claim Summary <span className="text-red-500">*</span></label>
            <textarea
              value={editData.claimSummary || ''}
              onChange={e => setEditData(prev => ({ ...prev, claimSummary: e.target.value }))}
              rows={3}
              className="w-full text-xs bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 focus:border-yellow-600 focus:outline-none transition-colors duration-200"
              placeholder="Summary of the claims and issues in dispute..."
            />
          </div>

          {/* Key facts */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[10px] text-gray-400 font-semibold uppercase">Key Facts</label>
              <button onClick={addKeyFact} className="text-[10px] font-bold text-blue-400 hover:text-blue-300">
                + Add Fact
              </button>
            </div>
            <div className="space-y-2">
              {(!editData.keyFacts || editData.keyFacts.length === 0) ? (
                <div className="text-center p-3 bg-gray-800/40 rounded border border-dashed border-gray-750 text-[11px] text-gray-500">
                  No key facts entered. Key facts will be auto-generated or can be added manually.
                </div>
              ) : (
                editData.keyFacts.map((fact, i) => (
                  <div key={i} className="flex gap-1.5 items-start">
                    <span className="text-gray-500 text-xs pt-1.5 font-bold w-4 text-right">{i + 1}.</span>
                    <textarea
                      value={fact}
                      onChange={e => updateKeyFact(i, e.target.value)}
                      rows={1}
                      className="flex-1 text-xs bg-gray-800 border border-gray-700 rounded p-1.5 focus:border-yellow-600 focus:outline-none resize-none transition-colors duration-200"
                    />
                    <button
                      onClick={() => removeKeyFact(i)}
                      className="text-red-400 hover:text-red-300 font-bold px-1 py-1"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Evidence items */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[10px] text-gray-400 font-semibold uppercase">Evidence Exhibits</label>
              <button onClick={addEvidence} className="text-[10px] font-bold text-blue-400 hover:text-blue-300">
                + Add Evidence
              </button>
            </div>
            <div className="space-y-2">
              {(!editData.evidenceItems || editData.evidenceItems.length === 0) ? (
                <div className="text-center p-3 bg-gray-800/40 rounded border border-dashed border-gray-750 text-[11px] text-gray-500">
                  No exhibits added yet. Exhibits will be auto-generated when simulation starts if left empty.
                </div>
              ) : (
                editData.evidenceItems.map((ev, i) => (
                  <div key={ev.id || i} className="bg-gray-800/80 rounded p-2 border border-gray-700 space-y-1.5">
                    <div className="flex justify-between gap-2 items-center">
                      <input
                        type="text"
                        value={ev.title}
                        onChange={e => updateEvidence(i, { title: e.target.value })}
                        className="bg-transparent border-b border-gray-700 text-xs text-yellow-500 focus:border-yellow-600 focus:outline-none w-full pb-0.5 font-semibold"
                        placeholder="Evidence title"
                      />
                      <button
                        onClick={() => removeEvidence(i)}
                        className="text-red-400 hover:text-red-300 font-bold px-1"
                      >
                        ×
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={ev.type}
                        onChange={e => updateEvidence(i, { type: e.target.value as Evidence['type'] })}
                        className="bg-gray-700 rounded px-1.5 py-0.5 text-[11px] text-white focus:outline-none"
                      >
                        <option value="document">Doc</option>
                        <option value="email">Email</option>
                        <option value="report">Report</option>
                        <option value="physical">Physical</option>
                        <option value="digital">Digital</option>
                      </select>
                      <input
                        type="text"
                        value={ev.summary}
                        onChange={e => updateEvidence(i, { summary: e.target.value, content: e.target.value })}
                        className="flex-1 bg-gray-750 border border-gray-700 rounded px-2 py-0.5 text-xs text-gray-200 focus:outline-none placeholder-gray-500"
                        placeholder="Brief summary..."
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg py-2 shadow transition-colors duration-200"
            >
              💾 Save Case
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 text-xs bg-gray-700 hover:bg-gray-650 text-gray-300 font-medium rounded-lg py-2 transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* Display Mode */
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Validation Warning Banner if incomplete */}
          {!isCaseSetupComplete(displayData) && (
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-400 space-y-2">
              <p className="font-semibold flex items-center gap-1">⚠️ Case Setup Incomplete</p>
              <p className="leading-relaxed">
                Please use the <b>Case Draft Generator</b> at the top or click <b>Edit</b> to manually set up your case. You can also load our pre-made <b>Hen v. Egg Preset</b> to start immediately.
              </p>
            </div>
          )}

          {/* Case header */}
          <div className="space-y-0.5">
            <h4 className="text-base font-extrabold text-yellow-500 leading-tight">
              {displayData.title || 'Untitled Case'}
            </h4>
            <span className="inline-block text-[10px] font-bold text-gray-400 bg-gray-800 px-2 py-0.5 rounded uppercase font-mono">
              {displayData.caseType || 'No case type specified'}
            </span>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-emerald-950/15 rounded-lg p-2.5 border border-emerald-800/30">
              <span className="block text-[9px] text-emerald-400 font-bold uppercase tracking-wider mb-0.5">Plaintiff</span>
              <p className="text-xs font-semibold text-gray-200 truncate">{displayData.plaintiffSide || 'Not specified'}</p>
            </div>
            <div className="bg-rose-950/15 rounded-lg p-2.5 border border-rose-800/30">
              <span className="block text-[9px] text-rose-400 font-bold uppercase tracking-wider mb-0.5">Defendant</span>
              <p className="text-xs font-semibold text-gray-200 truncate">{displayData.defenseSide || 'Not specified'}</p>
            </div>
          </div>

          {/* Claim summary */}
          <div className="space-y-1 bg-gray-900/25 border border-gray-800 p-2.5 rounded-lg">
            <span className="block text-[10px] text-gray-500 font-bold uppercase">Claim Summary</span>
            <p className="text-xs text-gray-300 leading-relaxed">{displayData.claimSummary || 'No claim summary specified.'}</p>
          </div>

          {/* Key facts */}
          <div className="space-y-1.5">
            <span className="block text-[10px] text-gray-500 font-bold uppercase">Key Facts</span>
            {!displayData.keyFacts || displayData.keyFacts.length === 0 ? (
              <div className="p-3 bg-gray-900/10 border border-gray-800 rounded-lg text-center">
                <p className="text-xs text-gray-500 italic">
                  💡 Key facts will be extracted and documented as the trial proceeds.
                </p>
              </div>
            ) : (
              <ul className="text-xs space-y-1.5">
                {displayData.keyFacts.slice(0, 4).map((fact, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-gray-300">
                    <span className="text-yellow-600 font-bold">{i + 1}.</span>
                    <span className="leading-normal">{fact}</span>
                  </li>
                ))}
                {displayData.keyFacts.length > 4 && (
                  <li className="text-gray-500 text-[10px] pl-3">
                    + {displayData.keyFacts.length - 4} more facts compiled
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Exhibits preview */}
          <div className="space-y-1.5">
            <span className="block text-[10px] text-gray-500 font-bold uppercase">Exhibits Preview</span>
            {!displayData.evidenceItems || displayData.evidenceItems.length === 0 ? (
              <div className="p-3 bg-gray-900/10 border border-gray-800 rounded-lg text-center">
                <p className="text-xs text-gray-500 italic">
                  📁 Exhibits will be registered and presented during evidence presentation phases.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-1.5">
                {displayData.evidenceItems.map(ev => (
                  <div key={ev.id} className="p-2 bg-gray-800/40 border border-gray-700/50 rounded flex justify-between items-center text-xs">
                    <span className="font-medium text-gray-300 truncate max-w-[200px]" title={ev.title}>
                      <span className="text-yellow-600 font-bold mr-1">{ev.exhibitNumber || ev.id}</span>
                      {ev.title}
                    </span>
                    <span className="text-[9px] uppercase text-gray-500 bg-gray-900 px-1 rounded font-semibold">{ev.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="bg-yellow-950/15 border border-yellow-800/30 rounded-lg p-3">
            <p className="text-[10px] text-yellow-500 leading-normal">
              ⚠️ <b>Note:</b> This is an AI courtroom simulation for educational and experimental purposes. It is not legal advice and should not be used in any legal proceedings.
            </p>
          </div>
        </div>
      )}

      {/* Case Draft Preview Modal */}
      {showPreview && generatedDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-950/40">
              <h3 className="text-sm font-bold text-yellow-500 flex items-center gap-1.5">
                ⚖️ Review Generated Case Draft
              </h3>
              <button 
                onClick={() => setShowPreview(false)} 
                className="text-gray-400 hover:text-white font-bold text-lg leading-none"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs sm:text-sm">
              <div>
                <span className="block text-[9px] text-gray-500 font-bold uppercase mb-0.5">Case Title</span>
                <h4 className="text-base font-bold text-yellow-500 leading-tight">{generatedDraft.title}</h4>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-[9px] text-gray-500 font-bold uppercase mb-0.5">Plaintiff</span>
                  <div className="p-2 bg-emerald-950/15 border border-emerald-800/30 rounded text-emerald-400 font-semibold truncate">
                    {generatedDraft.plaintiffSide}
                  </div>
                </div>
                <div>
                  <span className="block text-[9px] text-gray-500 font-bold uppercase mb-0.5">Defendant</span>
                  <div className="p-2 bg-rose-950/15 border border-rose-800/30 rounded text-rose-400 font-semibold truncate">
                    {generatedDraft.defenseSide}
                  </div>
                </div>
              </div>

              <div>
                <span className="block text-[9px] text-gray-500 font-bold uppercase mb-0.5">Case Type</span>
                <p className="text-gray-300 font-semibold">{generatedDraft.caseType}</p>
              </div>

              <div>
                <span className="block text-[9px] text-gray-500 font-bold uppercase mb-0.5">Claim Summary</span>
                <p className="text-gray-300 leading-relaxed bg-gray-950/30 p-2.5 border border-gray-800 rounded">
                  {generatedDraft.claimSummary}
                </p>
              </div>

              <div>
                <span className="block text-[9px] text-gray-500 font-bold uppercase mb-1">Key Facts</span>
                <ul className="space-y-1.5">
                  {generatedDraft.keyFacts.map((fact, idx) => (
                    <li key={idx} className="flex gap-2 text-gray-300 items-start text-xs">
                      <span className="text-yellow-600 font-bold">{idx + 1}.</span>
                      <span className="leading-normal">{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="block text-[9px] text-gray-500 font-bold uppercase mb-1.5">Exhibits / Evidence</span>
                <div className="space-y-2">
                  {generatedDraft.evidenceItems.map(ev => (
                    <div key={ev.id} className="p-2.5 bg-gray-800/40 border border-gray-750 rounded space-y-1 text-xs">
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-bold text-yellow-500 truncate">{ev.exhibitNumber || ev.id}: {ev.title}</span>
                        <span className="text-[9px] uppercase text-gray-500 bg-gray-950 px-1 py-0.5 rounded font-mono font-semibold">{ev.type}</span>
                      </div>
                      <p className="text-gray-400 leading-normal text-xs">{ev.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="p-4 border-t border-gray-800 bg-gray-950/20 flex flex-wrap gap-2 justify-end">
              <button
                onClick={() => setShowPreview(false)}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded font-semibold text-xs transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setTimeout(() => {
                    const ta = document.querySelector('textarea[placeholder*="Example: ChatGPT"]');
                    if (ta) (ta as HTMLTextAreaElement).focus();
                  }, 100);
                }}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded font-semibold text-xs transition-colors duration-200"
              >
                Edit Prompt ✏️
              </button>
              <button
                onClick={handleGenerateDraft}
                className="px-3 py-1.5 bg-blue-900/50 hover:bg-blue-850 text-blue-300 rounded font-semibold text-xs border border-blue-800/45 transition-colors duration-200"
              >
                Regenerate 🔄
              </button>
              <button
                onClick={() => {
                  onUpdateCase?.(generatedDraft);
                  setEditData(generatedDraft);
                  setIsEditing(true);
                  setShowPreview(false);
                }}
                className="px-3 py-1.5 bg-purple-700 hover:bg-purple-650 text-white rounded font-semibold text-xs transition-colors duration-200"
              >
                Edit Manually 🛠️
              </button>
              <button
                onClick={() => {
                  onUpdateCase?.(generatedDraft);
                  setEditData(generatedDraft);
                  setIsEditing(false);
                  setShowPreview(false);
                }}
                className="px-4 py-1.5 bg-emerald-650 hover:bg-emerald-550 text-white font-bold rounded text-xs shadow transition-colors duration-200"
              >
                Use This Case 👍
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
