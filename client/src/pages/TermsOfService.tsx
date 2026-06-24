import React from 'react';
import { Scale, Info, FileText } from 'lucide-react';

const TermsOfService: React.FC = () => {
  return (
    <div className="relative overflow-hidden bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 py-16 md:py-24 text-left">
      <div className="mx-auto max-w-3xl px-6 md:px-10 space-y-10">
        
        {/* Header */}
        <div className="space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-jsyellow/20 bg-jsyellow/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-808 dark:text-jsyellow">
            <Scale className="h-4 w-4" /> Legal Documentation
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Terms of Service
          </h1>
          <p className="text-xs text-slate-400">
            Last Updated: June 23, 2026
          </p>
        </div>

        {/* Content body */}
        <div className="prose prose-slate dark:prose-invert max-w-none text-sm text-slate-600 dark:text-slate-350 space-y-6 leading-relaxed">
          <div className="rounded-xl border border-jsyellow/15 bg-jsyellow/5 p-4 flex gap-3 text-xs text-slate-800 dark:text-slate-200">
            <Info className="h-5 w-5 shrink-0 text-jsyellow" />
            <div>
              <strong>Quick Notice:</strong> By utilizing the JS Bootcamp LMS portal, compiling source files, or claiming rewards, you agree to follow the terms below.
            </div>
          </div>

          <section className="space-y-2.5">
            <h2 className="text-lg font-bold text-slate-850 dark:text-slate-150 flex items-center gap-2">
              <FileText className="h-4 w-4 text-jsyellow" /> 1. Acceptable Use of Compiler & AI
            </h2>
            <p>
              Students are provided access to our browser-based Monaco code compiler and Gemini-powered tutoring assistant. You agree to use these tools solely for educational tasks:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
              <li>Do not attempt to execute infinite loops or allocate excessive memory buffers locally.</li>
              <li>Do not flood or abuse the AI Mentor API endpoints with spam queries.</li>
              <li>Do not attempt to duplicate, reverse-engineer, or spoof submission payloads to manipulate rankings.</li>
            </ul>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-lg font-bold text-slate-850 dark:text-slate-150 flex items-center gap-2">
              <FileText className="h-4 w-4 text-jsyellow" /> 2. Registration & Account Verification
            </h2>
            <p>
              JS Bootcamp reserves the right to review and approve registration requests prior to enabling dashboard login capabilities. Accounts found violating community guidelines, registering duplicate emails, or using throwaway addresses will be suspended by administrators.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-lg font-bold text-slate-850 dark:text-slate-150 flex items-center gap-2">
              <FileText className="h-4 w-4 text-jsyellow" /> 3. Intellectual Property & Code Ownership
            </h2>
            <p>
              The code solutions you write inside the LMS workspace belong entirely to you. You grant JS Bootcamp a limited, royalty-free license to store, evaluate, and output your submission histories solely to calculate levels and streaks progress.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-lg font-bold text-slate-850 dark:text-slate-150 flex items-center gap-2">
              <FileText className="h-4 w-4 text-jsyellow" /> 4. Disclaimer of Liability
            </h2>
            <p>
              JS Bootcamp LMS services are provided "as-is" without warranties of any kind. We are not responsible for any issues arising from running JavaScript code inside your browser engine.
            </p>
          </section>
        </div>

      </div>
    </div>
  );
};

export default TermsOfService;
