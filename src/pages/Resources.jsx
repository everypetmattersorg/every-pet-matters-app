import { useState, useEffect } from "react";
import { HERO_COLORS } from "@/lib/heroConfig";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PlusCircle, BookOpen, Building2, MapPin, Loader2, LayoutGrid, Map, Users, ExternalLink, CheckCircle2 } from "lucide-react";
import ResourceApprovalPanel from "@/components/admin/ResourceApprovalPanel";
import ResourceArticleCard from "@/components/resources/ResourceArticleCard";
import OrgCard from "@/components/resources/OrgCard";
import OrgMapView from "@/components/resources/OrgMapView";
import ResourceForm from "@/components/resources/ResourceForm";
import ArticleModal from "@/components/resources/ArticleModal";

const TABS = [
{ key: "articles", label: "Articles & Guides", icon: BookOpen },
{ key: "organizations", label: "Local Organizations", icon: Building2 },
{ key: "social", label: "Social Media Groups", icon: Users }];


export default function Resources() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [tab, setTab] = useState("articles");
  const [showForm, setShowForm] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [orgView, setOrgView] = useState("list"); // "list" | "map"
  const [locationFilter, setLocationFilter] = useState("all"); // "all" | "everywhere" | "local"
  const [userCity, setUserCity] = useState("");
  const [userState, setUserState] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {}).finally(() => setLoadingUser(false));
  }, []);

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["resources"],
    queryFn: () => base44.entities.Resource.list("-created_date", 100)
  });

  const isAdmin = user?.role === "admin";
  const [showApprovalPanel, setShowApprovalPanel] = useState(false);

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>);

  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="text-6xl">🔒</div>
        <h2 className="text-2xl font-bold text-slate-800">Admin Only</h2>
        <p className="text-slate-500 max-w-sm">This page is reserved for administrators. Please contact an admin if you need access.</p>
      </div>);

  }

  const applyLocationFilter = (resources) => {
    if (locationFilter === "everywhere") {
      return resources.filter((r) => r.location === "everywhere");
    }
    if (locationFilter === "local" && userCity && userState) {
      return resources.filter((r) => r.location === "local" && r.local_city?.toLowerCase() === userCity.toLowerCase() && r.local_state?.toLowerCase() === userState.toLowerCase());
    }
    return resources;
  };

  const articles = applyLocationFilter(resources.filter((r) => r.category === "article" && r.is_published !== false && r.status === "approved"));
  const orgs = applyLocationFilter(resources.filter((r) => r.category === "organization" && r.is_published !== false && r.status === "approved"));
  const socialGroups = applyLocationFilter(resources.filter((r) => r.category === "social_group" && r.is_published !== false && r.status === "approved"));

  return (
    <div className="min-h-screen from-slate-50 via-white to-violet-50 bg-[hsl(var(--background))]">
      {/* Hero */}
      <div className="px-4 py-6" style={{ background: HERO_COLORS.background }}>
        <div className="max-w-6xl mx-auto rounded-2xl overflow-hidden flex flex-col md:flex-row" style={{ minHeight: '300px' }}>
          {/* Left: photo */}
          <div className="md:w-1/2 w-full min-h-48 md:min-h-0 h-full">
            <img src="https://media.base44.com/images/public/69a0f10efc1058c9e80d1210/64dabc83b_halo1210-139.JPG"
            alt="Pet resources"
            className="w-full h-full object-cover"
            style={{ display: 'block', minHeight: '340px' }} />
            
          </div>
          {/* Right: panel */}
          <div className="md:w-1/2 w-full flex flex-col justify-center px-10 py-10" style={{ background: HERO_COLORS.panelBg }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-5 self-start" style={{ background: HERO_COLORS.badgeBg, color: HERO_COLORS.badgeText }}>
              <BookOpen className="w-4 h-4" /> resources for pet owners
            </div>
            <h1 className="text-5xl font-black mb-4 leading-tight" style={{ color: HERO_COLORS.panelText }}>resource center</h1>
            <p className="text-lg max-w-sm leading-relaxed" style={{ color: HERO_COLORS.panelSubtext }}>helpful guides, articles, and a directory of local organizations offering low-cost vet care, pet food, housing assistance, and more.</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Admin Panel Toggle */}
        {isAdmin && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-amber-900">admin: resource moderation</h3>
              <p className="text-xs text-amber-700 mt-1">review and approve pending resource submissions</p>
            </div>
            <Button onClick={() => setShowApprovalPanel(!showApprovalPanel)} size="sm" className="rounded-lg gap-2" style={{ backgroundColor: '#b1511d' }}>
              <CheckCircle2 className="w-4 h-4" /> {showApprovalPanel ? "hide" : "show"} pending
            </Button>
          </div>
        )}

        {/* Admin Approval Panel */}
        {isAdmin && showApprovalPanel && (
          <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200">
            <ResourceApprovalPanel />
          </div>
        )}

        {/* Location Filter */}
        <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200">
          <h3 className="font-semibold text-slate-800 text-sm mb-3">Filter by Location</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setLocationFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${locationFilter === "all" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              
              all resources
            </button>
            <button
              onClick={() => setLocationFilter("everywhere")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${locationFilter === "everywhere" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              
              available everywhere
            </button>
            <button
              onClick={() => setLocationFilter("local")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${locationFilter === "local" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              
              local resources
            </button>
          </div>
          {locationFilter === "local" && (
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                placeholder="city"
                value={userCity}
                onChange={(e) => setUserCity(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                style={{ textTransform: 'lowercase' }}
              />
              <input
                type="text"
                placeholder="state"
                value={userState}
                onChange={(e) => setUserState(e.target.value)}
                className="w-20 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                style={{ textTransform: 'lowercase' }}
              />
            </div>
          )}
        </div>

        {/* Tabs + Add Button */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex gap-2">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t.key ? "text-white shadow" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`} style={tab === t.key ? { backgroundColor: '#b1511d' } : {}}>
                  
                  <Icon className="w-4 h-4" /> {t.label}
                </button>);

            })}
          </div>
          <Button onClick={() => setShowForm(true)} className="rounded-xl gap-2" style={{ backgroundColor: '#b1511d' }}>
            <PlusCircle className="w-4 h-4" /> Add Resource
          </Button>
        </div>

        {isLoading ?
        <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
          </div> :
        tab === "articles" ?
        articles.length === 0 ?
        <div className="text-center py-20">
              <div className="text-5xl mb-3">📄</div>
              <p className="text-slate-500">No articles yet. Add the first one!</p>
            </div> :

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((r) =>
          <ResourceArticleCard key={r.id} resource={r} onClick={() => setSelectedArticle(r)} />
          )}
            </div> :


        tab === "social" ?
        <div>
          {socialGroups.length === 0 ?
          <div className="text-center py-20">
              <div className="text-5xl mb-3">💬</div>
              <p className="text-slate-500">No social groups listed yet. Add the first one!</p>
            </div> :
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {socialGroups.map((g) => {
                const platformColors = {
                  facebook: 'bg-blue-100 text-blue-700',
                  nextdoor: 'bg-green-100 text-green-700',
                  reddit: 'bg-orange-100 text-orange-700',
                  discord: 'bg-indigo-100 text-indigo-700',
                  slack: 'bg-purple-100 text-purple-700',
                  other: 'bg-slate-100 text-slate-600'
                };
                const colorClass = platformColors[g.group_platform] || platformColors.other;
                return (
                  <div key={g.id} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-slate-800 text-sm leading-snug">{g.title}</h3>
                      {g.group_platform && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize flex-shrink-0 ${colorClass}`}>
                          {g.group_platform}
                        </span>
                      )}
                    </div>
                    {g.summary && <p className="text-xs text-slate-500 leading-relaxed">{g.summary}</p>}
                    {g.group_member_count && (
                      <p className="text-xs text-slate-400 flex items-center gap-1"><Users className="w-3 h-3" /> ~{g.group_member_count.toLocaleString()} members</p>
                    )}
                    {g.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {g.tags.map((tag) => <span key={tag} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{tag}</span>)}
                      </div>
                    )}
                    {g.group_url && (
                      <a href={g.group_url} target="_blank" rel="noopener noreferrer"
                        className="mt-auto inline-flex items-center gap-1.5 text-xs font-medium text-white px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#b1511d' }}>
                        <ExternalLink className="w-3.5 h-3.5" /> join group
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          }
        </div> :
        <>
            {orgs.length === 0 ?
          <div className="text-center py-20">
                <div className="text-5xl mb-3">🏢</div>
                <p className="text-slate-500">No organizations listed yet. Add the first one!</p>
              </div> :
          <>
                {/* View toggle */}
                <div className="flex items-center justify-between mb-5">
                  <p className="text-sm text-slate-500">{orgs.length} organization{orgs.length !== 1 ? "s" : ""} listed</p>
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                  onClick={() => setOrgView("list")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${orgView === "list" ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"}`}>
                  
                      <LayoutGrid className="w-4 h-4" /> List
                    </button>
                    <button
                  onClick={() => setOrgView("map")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${orgView === "map" ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"}`}>
                  
                      <Map className="w-4 h-4" /> Map
                    </button>
                  </div>
                </div>

                {orgView === "map" ?
            <>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                      <MapPin className="w-4 h-4" />
                      <span>{orgs.filter((o) => o.latitude && o.longitude).length} of {orgs.length} organization(s) have map coordinates</span>
                    </div>
                    <OrgMapView orgs={orgs} />
                  </> :

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {orgs.map((r) => <OrgCard key={r.id} resource={r} />)}
                  </div>
            }
              </>
          }
          </>
        }
      </div>

      {showForm &&
      <ResourceForm
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["resources"] });
          setShowForm(false);
        }}
        onClose={() => setShowForm(false)} />

      }

      {selectedArticle &&
      <ArticleModal resource={selectedArticle} onClose={() => setSelectedArticle(null)} />
      }
    </div>);

}