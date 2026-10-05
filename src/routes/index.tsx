import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GlobalCougar | BYU International Student Hub" },
      {
        name: "description",
        content:
          "An interactive BYU international student hub for onboarding, campus updates, community, careers, and ISSS support.",
      },
      { property: "og:title", content: "GlobalCougar | BYU International Student Hub" },
      {
        property: "og:description",
        content:
          "Navigate international student life at BYU with personalized checklists, guidance, updates, and campus resources.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [milestoneStatus, setMilestoneStatus] = useState<string>('pending');

  // Load initial status from Supabase
  useEffect(() => {
    async function loadStatus() {
      const { data, error } = await supabase
        .from('USER_MILESTONE')
        .select('status')
        .eq('user_id', 1)
        .eq('milestone_id', 1)
        .single();

      if (data?.status && !error) {
        setMilestoneStatus(data.status);
      }
    }
    loadStatus();
  }, []);

  // Update Supabase on click
  const toggleMilestone = async () => {
    const next = milestoneStatus === 'completed' ? 'pending' : 'completed';
    const nextDate = next === 'completed' ? new Date().toISOString().split('T')[0] : null;

    setMilestoneStatus(next);

    await supabase
      .from('USER_MILESTONE')
      .update({
        status: next,
        completed_date: nextDate,
      })
      .eq('user_id', 1)
      .eq('milestone_id', 1);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50">
      {/* Live Supabase Milestone Banner */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm z-10">
        <div>
          <span className="font-semibold text-gray-900 text-sm">Milestone 1: Submit I-94 Record</span>
          <span className="ml-3 text-xs text-gray-500">
            Database Status: <span className="font-mono font-bold text-blue-600">{milestoneStatus}</span>
          </span>
        </div>
        <button
          onClick={toggleMilestone}
          className={`px-4 py-1.5 rounded text-xs font-semibold transition-colors ${
            milestoneStatus === 'completed'
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200'
          }`}
        >
          {milestoneStatus === 'completed' ? '✓ Completed' : 'Mark as Complete'}
        </button>
      </div>

      {/* Embedded Prototype Frame */}
      <iframe
        title="GlobalCougar prototype"
        src="/globalcougar.html"
        className="flex-1 w-full border-0"
      />
    </div>
  );
}
