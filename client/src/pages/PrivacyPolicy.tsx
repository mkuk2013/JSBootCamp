import React from 'react';
import { ShieldCheck, Info, FileText } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="relative overflow-hidden bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 py-16 md:py-24 text-left">
      <div className="mx-auto max-w-3xl px-6 md:px-10 space-y-10">
        
        {/* Header */}
        <div className="space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-jsyellow/20 bg-jsyellow/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-808 dark:text-jsyellow">
            <ShieldCheck className="h-4 w-4" /> Legal Documentation
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-400">
            Last Updated: June 23, 2026
          </p>
        </div>

        {/* Content body */}
        <div className="prose prose-slate dark:prose-invert max-w-none text-sm text-slate-600 dark:text-slate-350 space-y-6 leading-relaxed">
          <div className="rounded-xl border border-blue-500/15 bg-blue-500/5 p-4 flex gap-3 text-xs text-blue-700 dark:text-blue-400">
            <Info className="h-5 w-5 shrink-0 text-blue-550" />
            <div>
              <strong>Quick Summary:</strong> We prioritize user data security. We do not sell your personal data. We collect only what is essential for database profiles, logins, autograding records, and notifications.
            </div>
          </div>

          <section className="space-y-2.5">
            <h2 className="text-lg font-bold text-slate-850 dark:text-slate-150 flex items-center gap-2">
              <FileText className="h-4 w-4 text-jsyellow" /> 1. Information We Collect
            </h2>
            <p>
              When you register on JS Bootcamp, we collect the credentials necessary to set up your profile and authenticate logins:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
              <li><strong>Profile Data</strong>: Your full name, email address, and encrypted password.</li>
              <li><strong>Gamification Records</strong>: Earned experience points (XP), learning streaks, active levels, and unlocked badges.</li>
              <li><strong>Submissions Logs</strong>: Saved source code attempts, evaluation results (pass/fail), runtime metrics, and test outputs.</li>
            </ul>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-lg font-bold text-slate-850 dark:text-slate-150 flex items-center gap-2">
              <FileText className="h-4 w-4 text-jsyellow" /> 2. How We Use Your Data
            </h2>
            <p>
              Your data is processed strictly to maintain the interactive workspace and LMS platform services:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
              <li>To authenticate login sessions and securely block unapproved requests.</li>
              <li>To evaluate assertions on student submissions and calculate profile levels.</li>
              <li>To trigger SMTP welcome approval notifications using our Brevo integrations.</li>
              <li>To compute ranks and render leaderboard listings.</li>
            </ul>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-lg font-bold text-slate-850 dark:text-slate-150 flex items-center gap-2">
              <FileText className="h-4 w-4 text-jsyellow" /> 3. Data Protection & Security
            </h2>
            <p>
              We implement industry-standard practices to secure database nodes. Passwords are saved as secure bcrypt hashes. Client-backend communications are signed via JSON Web Tokens (JWT) and encrypted over HTTPS.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-lg font-bold text-slate-850 dark:text-slate-150 flex items-center gap-2">
              <FileText className="h-4 w-4 text-jsyellow" /> 4. Contact Us
            </h2>
            <p>
              If you have any questions about this privacy document or wish to delete your account record from the Turso database, please contact our administrator at <code className="text-jsyellow font-semibold text-xs">admin@jsbootcamp.com</code>.
            </p>
          </section>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicy;
