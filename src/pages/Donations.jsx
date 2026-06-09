import { useState } from "react";
import { HERO_COLORS } from "@/lib/heroConfig";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, Loader2, Heart, TrendingUp, Target } from "lucide-react";
import DonationGoalCard from "@/components/donations/DonationGoalCard";

export default function DonationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["donation-goals"],
    queryFn: () => base44.entities.DonationGoal.filter({ is_active: true }, "-created_date", 100)
  });

  const filteredGoals = goals.filter((goal) => {
    const searchMatch =
    goal.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    goal.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return searchMatch;
  });

  const sortedGoals = [...filteredGoals].sort((a, b) => {
    if (sortBy === "recent") {
      return new Date(b.created_date) - new Date(a.created_date);
    } else if (sortBy === "urgent") {
      return new Date(a.deadline) - new Date(b.deadline);
    } else if (sortBy === "progress") {
      const percentA = a.current_amount / a.target_amount * 100;
      const percentB = b.current_amount / b.target_amount * 100;
      return percentB - percentA;
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Hero */}
      <div className="px-4 py-6" style={{ background: HERO_COLORS.background }}>
        <div className="max-w-6xl mx-auto rounded-2xl overflow-hidden flex flex-col md:flex-row" style={{ minHeight: '300px' }}>
          <div className="md:w-1/2 w-full min-h-48 md:min-h-0 h-full">
            <img src="https://media.base44.com/images/public/69a0f10efc1058c9e80d1210/1c28f5bd4_IMG_5177.jpg"
            alt="Donate to pet rescues"
            className="w-full h-full object-cover"
            style={{ display: 'block', minHeight: '340px' }} />
          </div>
          <div className="md:w-1/2 w-full flex flex-col justify-center px-10 py-10" style={{ background: HERO_COLORS.panelBg }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-5 self-start" style={{ background: HERO_COLORS.badgeBg, color: HERO_COLORS.badgeText }}>
              <Heart className="w-4 h-4" /> support & give
            </div>
            <h1 className="text-5xl font-black mb-4 leading-tight" style={{ color: HERO_COLORS.panelText }}>donation opportunities</h1>
            <p className="text-lg max-w-sm leading-relaxed" style={{ color: HERO_COLORS.panelSubtext }}>help rescue organizations achieve their goals. your donation makes a real difference.</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Search & Sort */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-300" />
            <Input
              placeholder="Search donation opportunities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-6 rounded-xl border-slate-200 bg-white" />
            
          </div>

          {/* Sort Options */}
          <div className="flex gap-2">
            <Button
              variant={sortBy === "recent" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("recent")}
              className="gap-2">
              
              <Heart className="w-4 h-4" /> Most Recent
            </Button>
            <Button
              variant={sortBy === "urgent" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("urgent")}
              className="gap-2">
              
              <TrendingUp className="w-4 h-4" /> Most Urgent
            </Button>
            <Button
              variant={sortBy === "progress" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("progress")}
              className="gap-2">
              
              <Target className="w-4 h-4" /> Close to Goal
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="mb-8">
          <p className="text-slate-600 text-sm">
            {sortedGoals.length} donation goal{sortedGoals.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {isLoading ?
        <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
          </div> :
        sortedGoals.length === 0 ?
        <div className="text-center py-20">
            <div className="text-6xl mb-4">💝</div>
            <p className="text-slate-500 text-lg mb-4">No donation opportunities found.</p>
            <p className="text-slate-400 text-sm mb-6">Try adjusting your search.</p>
          </div> :

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedGoals.map((goal) =>
          <DonationGoalCard key={goal.id} goal={goal} />
          )}
          </div>
        }
      </div>
    </div>);

}