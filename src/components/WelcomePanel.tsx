import type { CaseData } from '../types/courtroom';

interface WelcomePanelProps {
  caseData: CaseData;
  onStart: () => void;
  onOpenSettings: () => void;
  isOpenRouterConfigured: boolean;
}

const checkCaseSetupComplete = (c: CaseData): boolean => {
  return !!(
    c.title?.trim() &&
    c.caseType?.trim() &&
    c.plaintiffSide?.trim() &&
    c.defenseSide?.trim() &&
    c.claimSummary?.trim()
  );
};

export function WelcomePanel({
  caseData,
  onStart,
  onOpenSettings,
  isOpenRouterConfigured,
}: WelcomePanelProps) {
  const isSetupComplete = checkCaseSetupComplete(caseData);

  return (
    <div className="bg-courtroom-card rounded-lg border border-gray-700 h-full p-6 flex flex-col justify-between overflow-y-auto">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="text-center pb-4 border-b border-gray-800">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-950/40 border border-yellow-750/30 text-3xl mb-3 text-yellow-500 animate-pulse">
            ⚖️
          </div>
          <h2 className="text-xl font-bold text-yellow-500">Welcome to JudgeBench</h2>
          <p className="text-xs text-gray-400 mt-1">The Interactive AI Courtroom Simulator</p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/50 space-y-2 hover:border-yellow-700/30 transition-all duration-200">
            <h3 className="text-sm font-semibold text-yellow-500 flex items-center gap-1.5">
              🎭 What is JudgeBench?
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              JudgeBench is a sandbox simulator where AI agents take the roles of <b>Plaintiff (Prosecution)</b>, <b>Defense</b>, and a presiding <b>Judge</b>. They argue, submit evidence, object, and deliver verdicts on any case you construct.
            </p>
          </div>

          <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/50 space-y-2 hover:border-yellow-700/30 transition-all duration-200">
            <h3 className="text-sm font-semibold text-yellow-500 flex items-center gap-1.5">
              ✨ AI-Assisted Case Drafting
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Stuck on what to type? Simply write a 1–2 line dispute idea (e.g. <i>"ChatGPT and Claude debate which AI is better for writing code"</i>) in the right panel, and click <b>Generate Case Draft</b>. The AI will draft the entire case, facts, and exhibits!
            </p>
          </div>

          <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/50 space-y-2 hover:border-yellow-700/30 transition-all duration-200">
            <h3 className="text-sm font-semibold text-yellow-500 flex items-center gap-1.5">
              ⚙️ How to Start the Trial
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Use the Case Information panel on the right. You can load our classic <b>Hen v. Egg</b> preset, generate a draft with AI, or edit the fields manually. Once all required case details are filled, click the start button.
            </p>
          </div>

          <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/50 space-y-2 hover:border-yellow-700/30 transition-all duration-200">
            <h3 className="text-sm font-semibold text-yellow-500 flex items-center gap-1.5">
              🌐 Zero-Config Free Demo
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              By default, JudgeBench runs on the <b>OpenRouter Free Demo</b>. This routes AI requests through our secure proxy worker using free models. No API keys or payments required! Tap <b>Settings</b> at the bottom to configure personal keys.
            </p>
          </div>
        </div>

        {/* Provider Connection Indicator */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-gray-400">
            <span className={`w-2 h-2 rounded-full ${isOpenRouterConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
            <span>AI Gateway Status:</span>
            <span className={`font-semibold ${isOpenRouterConfigured ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isOpenRouterConfigured ? 'Free Demo Ready' : 'Mock Fallback Mode'}
            </span>
          </div>
          <button 
            onClick={onOpenSettings}
            className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
          >
            Open Settings ⚙️
          </button>
        </div>
      </div>

      {/* Onboarding Action Footer */}
      <div className="pt-6 border-t border-gray-800 flex flex-col items-center gap-4">
        {isSetupComplete ? (
          <div className="w-full text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-950/30 border border-emerald-800/30 rounded-full text-xs text-emerald-400">
              <span>✅ Case Setup Complete</span>
            </div>
            <p className="text-xs text-gray-400">
              The case is ready. Let the legal battle begin!
            </p>
            <button
              onClick={onStart}
              className="w-full max-w-sm py-3.5 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg shadow-lg shadow-yellow-950/20 text-base active:scale-[0.98] transition-all duration-200"
            >
              ⚖️ Start Courtroom Trial Simulation
            </button>
          </div>
        ) : (
          <div className="w-full text-center p-4 bg-yellow-950/15 border border-yellow-750/20 rounded-lg max-w-md">
            <h4 className="text-sm font-semibold text-yellow-500 mb-1">Awaiting Case Setup ⏳</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Use the sidebar on the right to enter your case title, parties, and summary. You can load the <b>Hen v. Egg</b> preset, generate a case draft using AI, or edit manually.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
