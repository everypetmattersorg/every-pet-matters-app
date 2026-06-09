import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Heart, Home, Settings, PawPrint, Users, Store, ChevronDown, ScanSearch, Tag, BookOpen, Heart as HeartIcon, AlertCircle, Sparkles, Calendar, BarChart3, Zap, User, Menu, X } from "lucide-react";
import Footer from "./components/Footer";
import ChatBot from "./components/chatbot/ChatBot";
import NotificationBell from "./components/notifications/NotificationBell";
import SignupModal from "./components/auth/SignupModal";

export default function Layout({ children, currentPageName }) {
  useEffect(() => {
    const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a0f10efc1058c9e80d1210/9f28e7836_fetchfound.png';
    document.head.appendChild(link);
    document.title = 'every pet';
  }, []);
  const [user, setUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [lostFoundOpen, setLostFoundOpen] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const lostFoundRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (lostFoundRef.current && !lostFoundRef.current.contains(e.target)) {
        setLostFoundOpen(false);
      }
      if (servicesRef.current && !servicesRef.current.contains(e.target)) {
        setServicesOpen(false);
      }
      if (communityRef.current && !communityRef.current.contains(e.target)) {
        setCommunityOpen(false);
      }
      if (adoptRef.current && !adoptRef.current.contains(e.target)) {
        setAdoptOpen(false);
      }

    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const [servicesOpen, setServicesOpen] = useState(false);
  const servicesRef = useRef(null);
  const [communityOpen, setCommunityOpen] = useState(false);
  const communityRef = useRef(null);
  const [adoptOpen, setAdoptOpen] = useState(false);
  const adoptRef = useRef(null);
  const profileActive = ["Profile", "MyPetsHub", "Preferences"].includes(currentPageName);
  const lostFoundActive = ["LostAndFound"].includes(currentPageName);
  const servicesActive = ["Services", "Discounts"].includes(currentPageName);
  const communityActive = ["Community", "Resources", "Events", "Volunteer", "Donations"].includes(currentPageName);
  const adoptActive = ["Adopt", "Urgent", "Recommendations"].includes(currentPageName);

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="backdrop-blur-md border-b border-stone-100 sticky top-0 z-[10000] shadow-sm bg-[#2c5443]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between bg-[#2c5443]">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2">
            <img src="https://media.base44.com/images/public/69a0f10efc1058c9e80d1210/e47a94797_every_pet_logos__1_.png" alt="every pet logo" className="w-20 h-20" />
            <span className="font-black text-lg text-[hsl(var(--background))]">every pet matters</span>
          </Link>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-white"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="hidden md:flex items-center gap-2">
            {/* Adopt dropdown */}
            <div className="relative" ref={adoptRef}>
              <button
                onClick={() => setAdoptOpen((o) => !o)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors text-[hsl(var(--background))] ${
                adoptActive ?
                "bg-yellow-100 text-yellow-700" :
                "hover:text-stone-800 hover:bg-stone-50"}`
                }>
                
                <HeartIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Adopt</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${adoptOpen ? "rotate-180" : ""}`} />
              </button>

              {adoptOpen &&
              <div className="absolute left-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50">
                  <Link
                  to={createPageUrl("Adopt")}
                  onClick={() => setAdoptOpen(false)}
                  className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:shadow-lg hover:scale-105 ${
                  currentPageName === "Adopt" ?
                  "text-rose-600 bg-rose-50" :
                  "text-slate-600 hover:bg-slate-50"}`
                  }>
                  
                    <HeartIcon className="w-4 h-4" /> Browse Pets
                  </Link>
                  <Link
                  to={createPageUrl("Urgent")}
                  onClick={() => setAdoptOpen(false)}
                  className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                  currentPageName === "Urgent" ?
                  "text-red-600 bg-red-50" :
                  "text-slate-600 hover:bg-slate-50"}`
                  }>
                  
                    <AlertCircle className="w-4 h-4" /> Urgent Cases
                  </Link>
                  <Link
                  to={createPageUrl("Recommendations")}
                  onClick={() => setAdoptOpen(false)}
                  className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                  currentPageName === "Recommendations" ?
                  "text-blue-600 bg-blue-50" :
                  "text-slate-600 hover:bg-slate-50"}`
                  }>
                  
                    <Sparkles className="w-4 h-4" /> Recommendations
                  </Link>
                  <Link
                  to={createPageUrl("RescueDirectory")}
                  onClick={() => setAdoptOpen(false)}
                  className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                  currentPageName === "RescueDirectory" ?
                  "text-orange-600 bg-orange-50" :
                  "text-slate-600 hover:bg-slate-50"}`
                  }>
                  
                    <Users className="w-4 h-4" /> Find Rescues
                  </Link>
                  <Link
                  to={createPageUrl("FosterNetwork")}
                  onClick={() => setAdoptOpen(false)}
                  className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                  currentPageName === "FosterNetwork" ?
                  "text-rose-600 bg-rose-50" :
                  "text-slate-600 hover:bg-slate-50"}`
                  }>
                  
                    <Home className="w-4 h-4" /> Foster Network
                  </Link>
                </div>
              }
            </div>

            {/* Lost & Found dropdown */}
            <div className="relative" ref={lostFoundRef}>
              <button
                onClick={() => setLostFoundOpen((o) => !o)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors text-[#faf5f0] ${
                lostFoundActive ?
                "bg-blue-100 text-blue-700" :
                "hover:text-stone-800 hover:bg-stone-50"}`
                }>
                
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Lost & Found</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${lostFoundOpen ? "rotate-180" : ""}`} />
              </button>

              {lostFoundOpen &&
              <div className="absolute left-0 top-full mt-1.5 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50">
                  <Link
                  to={createPageUrl("LostAndFound")}
                  onClick={() => setLostFoundOpen(false)}
                  className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                  currentPageName === "LostAndFound" ?
                  "text-slate-800 bg-slate-50" :
                  "text-slate-600 hover:bg-slate-50"}`
                  }>
                  
                    <Home className="w-4 h-4" /> Report a Pet
                  </Link>
                  <Link
                  to={createPageUrl("LostAndFound")}
                  onClick={() => setLostFoundOpen(false)}
                  className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                  currentPageName === "LostAndFound" ?
                  "text-violet-600 bg-violet-50" :
                  "text-slate-600 hover:bg-slate-50"}`
                  }>
                  
                    <ScanSearch className="w-4 h-4" /> Photo Match
                  </Link>
                </div>
              }
            </div>



            {/* Services dropdown */}
            <div className="relative" ref={servicesRef}>
              <button
                onClick={() => setServicesOpen((o) => !o)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors text-[#faf5f0] ${
                servicesActive ?
                "bg-yellow-100 text-yellow-700" :
                "hover:text-stone-800 hover:bg-stone-50"}`
                }>
                
                <Store className="w-4 h-4" />
                <span className="hidden sm:inline">Services</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${servicesOpen ? "rotate-180" : ""}`} />
              </button>

              {servicesOpen &&
              <div className="absolute left-0 top-full mt-1.5 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50">
                  <Link
                  to={createPageUrl("Services")}
                  onClick={() => setServicesOpen(false)}
                  className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                  currentPageName === "Services" ?
                  "text-blue-700 bg-blue-50" :
                  "text-slate-600 hover:bg-slate-50"}`
                  }>
                  
                    <Store className="w-4 h-4" /> Services
                  </Link>
                  <Link
                  to={createPageUrl("Discounts")}
                  onClick={() => setServicesOpen(false)}
                  className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                  currentPageName === "Discounts" ?
                  "text-rose-600 bg-rose-50" :
                  "text-slate-600 hover:bg-slate-50"}`
                  }>
                  
                    <Tag className="w-4 h-4" /> Discounts
                  </Link>
                </div>
              }
            </div>

            {/* Community dropdown */}
            <div className="relative" ref={communityRef}>
              <button
                onClick={() => setCommunityOpen((o) => !o)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors text-[#faf5f0] ${
                communityActive ?
                "bg-yellow-100 text-yellow-700" :
                "hover:text-stone-800 hover:bg-stone-50"}`
                }>
                
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Community</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${communityOpen ? "rotate-180" : ""}`} />
              </button>
              {communityOpen &&
              <div className="absolute left-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50">
                  <Link
                  to={createPageUrl("Events")}
                  onClick={() => setCommunityOpen(false)}
                  className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:shadow-lg hover:scale-105 ${
                  currentPageName === "Events" ?
                  "text-violet-700 bg-violet-50" :
                  "text-slate-600 hover:bg-slate-50"}`
                  }>

                    <Calendar className="w-4 h-4" /> Events
                  </Link>
                  <Link
                  to={createPageUrl("Community")}
                  onClick={() => setCommunityOpen(false)}
                  className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:shadow-lg hover:scale-105 ${
                  currentPageName === "Community" ?
                  "text-violet-700 bg-violet-50" :
                  "text-slate-600 hover:bg-slate-50"}`
                  }>

                    <Users className="w-4 h-4" /> Community
                  </Link>
                  <Link
                  to={createPageUrl("Resources")}
                  onClick={() => setCommunityOpen(false)}
                  className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:shadow-lg hover:scale-105 ${
                  currentPageName === "Resources" ?
                  "text-violet-700 bg-violet-50" :
                  "text-slate-600 hover:bg-slate-50"}`
                  }>

                    <BookOpen className="w-4 h-4" /> Resources
                  </Link>
                  <div className="border-t border-slate-100 my-1" />
                  <Link
                  to={createPageUrl("Volunteer")}
                  onClick={() => setCommunityOpen(false)}
                  className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                  currentPageName === "Volunteer" ?
                  "text-amber-600 bg-amber-50" :
                  "text-slate-600 hover:bg-slate-50"}`
                  }>
                  
                    <Zap className="w-4 h-4" /> Volunteer
                  </Link>
                  <Link
                  to={createPageUrl("Donations")}
                  onClick={() => setCommunityOpen(false)}
                  className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                  currentPageName === "Donations" ?
                  "text-rose-600 bg-rose-50" :
                  "text-slate-600 hover:bg-slate-50"}`
                  }>
                  
                    <Heart className="w-4 h-4" /> Donate
                  </Link>
                </div>
              }
            </div>



            {/* Profile dropdown or Signup button */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileOpen((o) => !o)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors text-[#faf5f0] ${
                  profileActive ?
                  "bg-yellow-100 text-yellow-700" :
                  "hover:text-stone-800 hover:bg-stone-50"}`
                  }>

                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">settings</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
                </button>

                {profileOpen &&
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50">
                    <Link
                    to={createPageUrl("Profile")}
                    onClick={() => setProfileOpen(false)}
                    className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                    currentPageName === "Profile" ?
                    "text-rose-600 bg-rose-50" :
                    "text-slate-600 hover:bg-slate-50"}`
                    }>

                      <Settings className="w-4 h-4" /> Profile
                    </Link>
                    <Link
                    to={createPageUrl("UserProfile")}
                    onClick={() => setProfileOpen(false)}
                    className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                    currentPageName === "UserProfile" ?
                    "text-rose-600 bg-rose-50" :
                    "text-slate-600 hover:bg-slate-50"}`
                    }>

                      <Heart className="w-4 h-4" /> preferences
                    </Link>
                    <Link
                    to={createPageUrl("MyPetsHub")}
                    onClick={() => setProfileOpen(false)}
                    className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                    ["MyPetsHub", "MyPets", "MyReportedPets", "MyAdoptedPets"].includes(currentPageName) ?
                    "text-rose-600 bg-rose-50" :
                    "text-slate-600 hover:bg-slate-50"}`
                    }>

                      <PawPrint className="w-4 h-4" /> My Pets
                    </Link>


                    {user && (user.role === "rescue" || user.role === "shelter" || user.role === "admin") &&
                  <>
                        <div className="border-t border-slate-100 my-1" />
                        <Link
                      to="/ShelterPortal"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors text-slate-600 hover:bg-slate-50">

                          <Store className="w-4 h-4" /> Rescue Center
                        </Link>
                      </>
                  }
                    {user && user.role === "admin" &&
                  <>
                        <div className="border-t border-slate-100 my-1" />
                        <Link
                      to="/AdminDashboard"
                      onClick={() => setProfileOpen(false)}
                      className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${currentPageName === "AdminDashboard" ? "text-rose-600 bg-rose-50" : "text-slate-600 hover:bg-slate-50"}`}>
                          <BarChart3 className="w-4 h-4" /> Admin Dashboard
                        </Link>
                      </>
                  }
                    <div className="border-t border-slate-100 my-1" />
                    <button
                    onClick={() => {setProfileOpen(false);base44.auth.logout();}}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors text-red-600 hover:bg-red-50 w-full">

                        <Heart className="w-4 h-4" /> Log Out
                      </button>
                  </div>
                }
              </div>
            ) : (
              <button
                onClick={() => setShowSignup(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors text-slate-900"
                style={{ backgroundColor: '#eab308' }}
              >
                <User className="w-4 h-4" />
                <span>Sign Up</span>
              </button>
            )}

            {/* Notification Bell */}
            {user && <NotificationBell userEmail={user.email} userRole={user.role} />}
          </div>
        </div>

      </nav>

      {/* Mobile menu panel - outside nav so it overlays page content */}
      {/* Profile setup banner for non-rescue/shelter users */}
      {user && !user.profile_complete && user.role !== 'admin' && user.role !== 'rescue' && user.role !== 'shelter' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-amber-800">
              <span className="text-lg">👋</span>
              <span><strong>Welcome!</strong> Complete your profile to get the most out of every pet matters — it only takes 2 minutes.</span>
            </div>
            <a href="/Profile">
              <button
                className="shrink-0 px-3 py-1.5 rounded-md text-white text-sm font-medium"
                style={{ backgroundColor: '#b1511d' }}
              >
                Complete Setup →
              </button>
            </a>
          </div>
        </div>
      )}

      {mobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 bottom-0 bg-[#2c5443] px-4 py-4 space-y-1 overflow-y-auto z-[9999]">
          <div className="flex justify-end mb-2">
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg text-white hover:bg-white/10" aria-label="Close menu">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider px-3 pb-1">Adopt</p>
          <Link to={createPageUrl("Adopt")} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white hover:bg-white/10 text-sm"><HeartIcon className="w-4 h-4" /> Browse Pets</Link>
          <Link to={createPageUrl("Urgent")} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white hover:bg-white/10 text-sm"><AlertCircle className="w-4 h-4" /> Urgent Cases</Link>
          <Link to={createPageUrl("Recommendations")} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white hover:bg-white/10 text-sm"><Sparkles className="w-4 h-4" /> Recommendations</Link>
          <Link to={createPageUrl("RescueDirectory")} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white hover:bg-white/10 text-sm"><Users className="w-4 h-4" /> Find Rescues</Link>
          <Link to={createPageUrl("FosterNetwork")} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white hover:bg-white/10 text-sm"><Home className="w-4 h-4" /> Foster Network</Link>

          <div className="border-t border-white/10 my-2" />
          <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider px-3 pb-1">Lost & Found</p>
          <Link to={createPageUrl("LostAndFound")} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white hover:bg-white/10 text-sm"><Home className="w-4 h-4" /> Report a Pet</Link>
          <Link to={`${createPageUrl("LostAndFound")}?tab=photo-match`} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white hover:bg-white/10 text-sm"><ScanSearch className="w-4 h-4" /> Photo Match</Link>

          <div className="border-t border-white/10 my-2" />
          <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider px-3 pb-1">Services</p>
          <Link to={createPageUrl("Services")} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white hover:bg-white/10 text-sm"><Store className="w-4 h-4" /> Services</Link>
          <Link to={createPageUrl("Discounts")} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white hover:bg-white/10 text-sm"><Tag className="w-4 h-4" /> Discounts</Link>

          <div className="border-t border-white/10 my-2" />
          <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider px-3 pb-1">Community</p>
          <Link to={createPageUrl("Events")} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white hover:bg-white/10 text-sm"><Calendar className="w-4 h-4" /> Events</Link>
          <Link to={createPageUrl("Community")} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white hover:bg-white/10 text-sm"><Users className="w-4 h-4" /> Community</Link>
          <Link to={createPageUrl("Resources")} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white hover:bg-white/10 text-sm"><BookOpen className="w-4 h-4" /> Resources</Link>
          <Link to={createPageUrl("Volunteer")} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white hover:bg-white/10 text-sm"><Zap className="w-4 h-4" /> Volunteer</Link>
          <Link to={createPageUrl("Donations")} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white hover:bg-white/10 text-sm"><Heart className="w-4 h-4" /> Donate</Link>

          <div className="border-t border-white/10 my-2" />
          {user ? (
            <>
              <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider px-3 pb-1">Account</p>
              <Link to={createPageUrl("Profile")} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white hover:bg-white/10 text-sm"><Settings className="w-4 h-4" /> Profile</Link>
              <Link to={createPageUrl("UserProfile")} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white hover:bg-white/10 text-sm"><Heart className="w-4 h-4" /> Preferences</Link>
              <Link to={createPageUrl("MyPetsHub")} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white hover:bg-white/10 text-sm"><PawPrint className="w-4 h-4" /> My Pets</Link>
              {(user.role === "rescue" || user.role === "shelter" || user.role === "admin") && (
                <Link to="/ShelterPortal" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white hover:bg-white/10 text-sm"><Store className="w-4 h-4" /> Rescue Center</Link>
              )}
              {user.role === "admin" && (
                <Link to="/AdminDashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white hover:bg-white/10 text-sm"><BarChart3 className="w-4 h-4" /> Admin Dashboard</Link>
              )}
              <button onClick={() => { setMobileMenuOpen(false); base44.auth.logout(); }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-300 hover:bg-white/10 text-sm w-full"><Heart className="w-4 h-4" /> Log Out</button>
            </>
          ) : (
            <button onClick={() => { setMobileMenuOpen(false); setShowSignup(true); }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-900 font-semibold text-sm w-full" style={{ background: '#eab308' }}><User className="w-4 h-4" /> Sign Up</button>
          )}
          <div className="pb-8" />
        </div>
      )}

      <main className="flex-1">{children}</main>
      <Footer />
      <ChatBot />

      {/* Signup Modal */}
      {showSignup && (
        <SignupModal
          onClose={() => setShowSignup(false)}
          onSignupComplete={() => setShowSignup(false)}
        />
      )}
    </div>);

}