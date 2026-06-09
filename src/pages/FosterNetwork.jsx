import { useState, useEffect } from "react";
import { HERO_COLORS } from "@/lib/heroConfig";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Heart, Search, MapPin, Users, Dog, ChevronRight, Loader2, Home, Star } from "lucide-react";
import FosterApplicationForm from "@/components/foster/FosterApplicationForm";
import FosterApplicationCard from "@/components/foster/FosterApplicationCard";

export default function FosterNetwork() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedRescue, setSelectedRescue] = useState(null);
  const [selectedPet, setSelectedPet] = useState(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [tab, setTab] = useState("browse"); // "browse" | "my_applications"
  const [myAppsUpdated, setMyAppsUpdated] = useState(0);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Rescues that need fosters
  const { data: rescues = [], isLoading: loadingRescues } = useQuery({
    queryKey: ["fosterRescues"],
    queryFn: () => base44.entities.Rescue.filter({ fosters_needed: true }, "-created_date", 50)
  });

  // Pets specifically looking for fosters
  const { data: fosterPets = [], isLoading: loadingPets } = useQuery({
    queryKey: ["fosterPets"],
    queryFn: () => base44.entities.AdoptablePet.filter({ status: "available" }, "-created_date", 100)
  });

  // User's own applications
  const { data: myApplications = [], isLoading: loadingMyApps, refetch: refetchApps } = useQuery({
    queryKey: ["myFosterApps", user?.email, myAppsUpdated],
    queryFn: () => base44.entities.FosterApplication.filter({ applicant_email: user.email }, "-created_date", 50),
    enabled: !!user?.email
  });

  const filteredRescues = rescues.filter((r) =>
  !search || r.name?.toLowerCase().includes(search.toLowerCase()) ||
  r.address?.toLowerCase().includes(search.toLowerCase())
  );

  const openApply = (rescue, pet = null) => {
    setSelectedRescue(rescue);
    setSelectedPet(pet);
    setApplyOpen(true);
  };

  const handleAppSuccess = () => {
    setApplyOpen(false);
    setMyAppsUpdated((n) => n + 1);
    setTab("my_applications");
  };

  return (
    <div className="min-h-screen" style={{ background: '#FAF5F0' }}>
      {/* Hero */}
      <div className="px-4 py-6" style={{ background: HERO_COLORS.background }}>
        <div className="max-w-6xl mx-auto rounded-2xl overflow-hidden flex flex-col md:flex-row" style={{ minHeight: '340px' }}>
          {/* Left: photo */}
          <div className="md:w-1/2 w-full min-h-48 md:min-h-0">
            <img src="https://media.base44.com/images/public/69a0f10efc1058c9e80d1210/e47934316_jasper-124.JPG"
            alt="Dog in a foster home"
            className="w-full h-full object-cover"
            style={{ display: 'block' }} />
          </div>
          {/* Right: panel */}
          <div className="md:w-1/2 w-full flex flex-col justify-center px-10 py-10" style={{ background: HERO_COLORS.panelBg }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-5 self-start" style={{ background: HERO_COLORS.badgeBg, color: HERO_COLORS.badgeText }}>
              <Home className="w-4 h-4" /> foster network
            </div>
            <h1 className="text-5xl font-black mb-4 leading-tight" style={{ color: HERO_COLORS.panelText }}>open your home, change a life</h1>
            <p className="text-lg max-w-sm leading-relaxed mb-6" style={{ color: HERO_COLORS.panelSubtext }}>fostering gives animals a safe, loving home while they wait for their forever family. no experience needed!</p>
            <div className="flex flex-wrap gap-3 text-sm">
              {[["🏠", "home-based care"], ["🐾", "all pet types"], ["💬", "rescue support"], ["❤️", "save lives"]].map(([icon, label]) =>
              <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: HERO_COLORS.pillBg, color: HERO_COLORS.pillText }}>
                  <span>{icon}</span><span>{label}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {[{ id: "browse", label: "Find Rescues to Foster For" }, ...(user ? [{ id: "my_applications", label: `My Applications${myApplications.length ? ` (${myApplications.length})` : ""}` }] : [])].map((t) =>
          <button key={t.id} onClick={() => setTab(t.id)}
          className={`px-5 py-2.5 rounded-full text-sm font-semibold transition ${tab === t.id ? "bg-primary text-primary-foreground" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              {t.label}
            </button>
          )}
        </div>

        {tab === "browse" &&
        <div className="space-y-8">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input className="pl-9 bg-white" placeholder="Search rescues by name or location..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            {/* Rescues needing fosters */}
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4">Rescues Seeking Fosters</h2>
              {loadingRescues ?
            <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-rose-400" /></div> :
            filteredRescues.length === 0 ?
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                  <Heart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No rescues currently seeking fosters.</p>
                </div> :

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredRescues.map((rescue) =>
              <div key={rescue.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition">
                      {rescue.banner_url && <img src={rescue.banner_url} alt={rescue.name} className="w-full h-32 object-cover" />}
                      <div className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          {rescue.logo_url ?
                    <img src={rescue.logo_url} className="w-12 h-12 rounded-xl object-cover shrink-0" /> :
                    <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-500 font-bold text-xl shrink-0">{rescue.name?.[0]}</div>
                    }
                          <div>
                            <h3 className="font-bold text-slate-800">{rescue.name}</h3>
                            {rescue.address && <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{rescue.address}</p>}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rescue.org_type === "shelter" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                              {rescue.org_type === "shelter" ? "🏠 Shelter" : "🐾 Rescue"}
                            </span>
                          </div>
                        </div>
                        {rescue.mission_statement && <p className="text-sm text-slate-600 mb-3 line-clamp-2">{rescue.mission_statement}</p>}
                        {rescue.foster_network_size > 0 &&
                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-3"><Users className="w-3 h-3" /> {rescue.foster_network_size} active foster homes</p>
                  }
                        <Button className="w-full" onClick={() => openApply(rescue)}>
                          Apply to Foster
                        </Button>
                      </div>
                    </div>
              )}
                </div>
            }
            </div>

            {/* Pets specifically needing fosters */}
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4">Pets Needing Foster Homes</h2>
              {loadingPets ?
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-rose-400" /></div> :

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {fosterPets.filter((p) => p.foster_url || p.rescue_email).slice(0, 12).map((pet) => {
                const rescue = rescues.find((r) => r.email === pet.rescue_email);
                return (
                  <div key={pet.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition">
                        <div className="aspect-square bg-slate-100">
                          {pet.photo_url ? <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl">🐾</div>}
                        </div>
                        <div className="p-3">
                          <p className="font-semibold text-slate-800 text-sm">{pet.name}</p>
                          <p className="text-xs text-slate-500">{pet.breed || pet.pet_type}</p>
                          {pet.is_urgent && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Urgent</span>}
                          {rescue &&
                          <Button size="sm" className="w-full mt-2 text-xs h-7"
                          onClick={() => openApply(rescue, pet)}>
                              Foster {pet.name}
                            </Button>
                          }
                        </div>
                      </div>);

              })}
                </div>
            }
            </div>
          </div>
        }

        {tab === "my_applications" && user &&
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">My Foster Applications</h2>
            {loadingMyApps ?
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-rose-400" /></div> :
          myApplications.length === 0 ?
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                <Heart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">No applications yet.</p>
                <p className="text-slate-400 text-sm mb-4">Find a rescue and apply to foster!</p>
                <Button onClick={() => setTab("browse")}>Browse Rescues</Button>
              </div> :

          myApplications.map((app) =>
          <FosterApplicationCard
            key={app.id}
            application={app}
            currentUser={user}
            isRescue={false}
            onUpdated={(updated) => {
              setMyAppsUpdated((n) => n + 1);
            }} />

          )
          }
          </div>
        }
      </div>

      {/* Apply Dialog */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Foster Application — {selectedRescue?.name}
              {selectedPet && <span className="text-rose-500"> · {selectedPet.name}</span>}
            </DialogTitle>
          </DialogHeader>
          {selectedRescue &&
          <FosterApplicationForm
            rescue={selectedRescue}
            pet={selectedPet}
            onSuccess={handleAppSuccess}
            onCancel={() => setApplyOpen(false)} />

          }
        </DialogContent>
      </Dialog>
    </div>);

}