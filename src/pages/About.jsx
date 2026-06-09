import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, Mail, MapPin, Users, Target, Sparkles, Upload, Facebook, Instagram, Linkedin } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PhotoCropModal from "@/components/PhotoCropModal";

const DEFAULT_TEAM = [
{
  name: "Erin Maxson",
  role: "Founder",
  bio: "lifelong animal lover with 10+ years in rescue work. dog mom of 3 and duck mom of 6. forever passionate about every pet getting the chance at love in a home where they can experience the joys of life.",
  emoji: "🐾",
  photo_url: ""
},
{
  name: "Rory",
  role: "Co-Founder & CTO",
  bio: "Software engineer and dog dad. Built fetch&found to solve the real problem he faced when his dog went missing — and to make sure no one else goes through that alone.",
  emoji: "💻",
  photo_url: ""
},
{
  name: "Priya Patel",
  role: "Head of Rescue Partnerships",
  bio: "Worked with over 50 rescues across the country to build meaningful relationships and bring more adoptable pets onto the platform.",
  emoji: "🤝",
  photo_url: ""
},
{
  name: "Leo Kim",
  role: "Community & Outreach",
  bio: "Cat enthusiast and community builder. Leads volunteer programs and local events to bring pet lovers together.",
  emoji: "🐱",
  photo_url: ""
},
{
  name: "Team Member",
  role: "Role Title",
  bio: "Bio coming soon.",
  emoji: "🐕",
  photo_url: ""
},
{
  name: "Team Member",
  role: "Role Title",
  bio: "Bio coming soon.",
  emoji: "🐈",
  photo_url: ""
},
{
  name: "Team Member",
  role: "Role Title",
  bio: "Bio coming soon.",
  emoji: "🐾",
  photo_url: ""
},
{
  name: "Team Member",
  role: "Role Title",
  bio: "Bio coming soon.",
  emoji: "🐕",
  photo_url: ""
},
{
  name: "Team Member",
  role: "Role Title",
  bio: "Bio coming soon.",
  emoji: "🐈",
  photo_url: ""
},
{
  name: "Finn",
  role: "Chief Nap Officer",
  bio: "Expert in finding the sunniest spots and coziest blankets. Finn ensures all team members take adequate rest breaks.",
  emoji: "😴",
  photo_url: ""
},
{
  name: "The Ducks",
  role: "HR Department",
  bio: "Keeping the flock together and making sure everyone is heard. The ducks handle all quacking concerns with grace.",
  emoji: "🦆",
  photo_url: ""
},
{
  name: "Alex",
  role: "Chief Treat Officer",
  bio: "Responsible for taste-testing all treats and ensuring quality control meets the highest standards. No treat goes unreviewed.",
  emoji: "🦴",
  photo_url: ""
},
{
  name: "Team Member",
  role: "Role Title",
  bio: "Bio coming soon.",
  emoji: "🐾",
  photo_url: ""
},
{
  name: "Team Member",
  role: "Role Title",
  bio: "Bio coming soon.",
  emoji: "🐕",
  photo_url: ""
},
{
  name: "Team Member",
  role: "Role Title",
  bio: "Bio coming soon.",
  emoji: "🐈",
  photo_url: ""
},
{
  name: "Team Member",
  role: "Role Title",
  bio: "Bio coming soon.",
  emoji: "🐾",
  photo_url: ""
}];


function TeamMember({ member, index, onPhotoUpdate, onFieldUpdate, isAdmin }) {
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(null); // 'name' | 'role' | 'bio'
  const [draft, setDraft] = useState({});
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const fileInputRef = useRef(null);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropSave = async (file) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onPhotoUpdate(index, file_url);
      setCropModalOpen(false);
      setImageToCrop(null);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const startEdit = (field) => {
    if (!isAdmin) return;
    setDraft({ ...draft, [field]: member[field] });
    setEditing(field);
  };

  const saveEdit = (field) => {
    onFieldUpdate(index, field, draft[field]);
    setEditing(null);
  };

  const cancelEdit = () => setEditing(null);

  return (
    <>
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition group">
        <div className="relative w-full h-60 flex items-center justify-center text-6xl overflow-hidden !grayscale-0" style={{ background: member.photo_url ? undefined : '#f5f5f4', filter: 'none' }}>
          {member.photo_url ?
          <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover object-center !grayscale-0" style={{ filter: 'saturate(1) grayscale(0%)' }} /> :
          member.emoji}
          {isAdmin &&
          <>
               <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              title="Upload photo">
                 <Upload className="w-6 h-6 text-white" />
               </button>
               {member.photo_url &&
            <button
              onClick={() => onPhotoUpdate(index, '')}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition"
              title="Delete photo">
                   ✕
                 </button>
            }
               <input ref={fileInputRef} type="file" accept="image/*,.heic,.heif" onChange={handlePhotoUpload} disabled={uploading} className="hidden" />
             </>
          }
        </div>
      <div className="p-6 space-y-2">
        {/* Name */}
        {isAdmin && editing === 'name' ?
          <div className="flex items-center gap-2">
            <input
              autoFocus
              className="font-black text-stone-900 border-b-2 border-yellow-400 outline-none bg-transparent w-full"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              onKeyDown={(e) => {if (e.key === 'Enter') saveEdit('name');if (e.key === 'Escape') cancelEdit();}} />
            
            <button onClick={() => saveEdit('name')} className="text-xs text-green-600 font-bold shrink-0">save</button>
            <button onClick={cancelEdit} className="text-xs text-stone-400 shrink-0">cancel</button>
          </div> :

          <h3
            className={`font-black text-stone-900 transition ${isAdmin ? 'cursor-pointer hover:text-yellow-600' : ''}`}
            title={isAdmin ? "click to edit" : undefined}
            onClick={() => startEdit('name')}>
            {member.name}
          </h3>
          }

        {/* Role */}
        {isAdmin && editing === 'role' ?
          <div className="flex items-center gap-2">
            <input
              autoFocus
              className="text-sm text-yellow-600 font-semibold border-b-2 border-yellow-400 outline-none bg-transparent w-full"
              value={draft.role}
              onChange={(e) => setDraft({ ...draft, role: e.target.value })}
              onKeyDown={(e) => {if (e.key === 'Enter') saveEdit('role');if (e.key === 'Escape') cancelEdit();}} />
            
            <button onClick={() => saveEdit('role')} className="text-xs text-green-600 font-bold shrink-0">save</button>
            <button onClick={cancelEdit} className="text-xs text-stone-400 shrink-0">cancel</button>
          </div> :

          <span
            className={`block text-sm text-yellow-600 font-semibold transition ${isAdmin ? 'cursor-pointer hover:text-yellow-500' : ''}`}
            title={isAdmin ? "click to edit" : undefined}
            onClick={() => startEdit('role')}>
            {member.role}
          </span>
          }

        {/* Bio */}
        {isAdmin && editing === 'bio' ?
          <div className="space-y-1">
            <textarea
              autoFocus
              rows={4}
              className="text-stone-500 text-sm font-medium leading-relaxed border border-yellow-300 rounded-lg p-2 outline-none bg-transparent w-full resize-none"
              value={draft.bio}
              onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
              onKeyDown={(e) => {if (e.key === 'Escape') cancelEdit();}} />
            
            <div className="flex gap-2">
              <button onClick={() => saveEdit('bio')} className="text-xs text-green-600 font-bold">save</button>
              <button onClick={cancelEdit} className="text-xs text-stone-400">cancel</button>
            </div>
          </div> :

          <p
            className={`text-stone-500 text-sm font-medium leading-relaxed transition ${isAdmin ? 'cursor-pointer hover:text-stone-700' : ''}`}
            title={isAdmin ? "click to edit" : undefined}
            onClick={() => startEdit('bio')}>
            {member.bio}
          </p>
          }
        </div>
        </div>

        {cropModalOpen && imageToCrop &&
      <PhotoCropModal
        imageSrc={imageToCrop}
        onSave={handleCropSave}
        onCancel={() => {
          setCropModalOpen(false);
          setImageToCrop(null);
        }} />

      }
        </>);

}

export default function About() {
  const [team, setTeam] = useState(DEFAULT_TEAM);
  const [contentId, setContentId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    base44.auth.me().then((u) => {if (u?.role === 'admin') setIsAdmin(true);}).catch(() => {});
    base44.entities.AboutPageContent.list().then((records) => {
      if (records.length > 0) {
        if (records[0].team_members?.length > 0) {
          setTeam(records[0].team_members);
        }
        setContentId(records[0].id);
      }
    });
  }, []);

  const saveTeam = async (updatedTeam) => {
    if (contentId) {
      await base44.entities.AboutPageContent.update(contentId, { team_members: updatedTeam });
    } else {
      const record = await base44.entities.AboutPageContent.create({ team_members: updatedTeam });
      setContentId(record.id);
    }
  };

  const handlePhotoUpdate = (index, photoUrl) => {
    const updated = team.map((m, i) => i === index ? { ...m, photo_url: photoUrl } : m);
    setTeam(updated);
    saveTeam(updated);
  };

  const handleFieldUpdate = (index, field, value) => {
    const updated = team.map((m, i) => i === index ? { ...m, [field]: value } : m);
    setTeam(updated);
    saveTeam(updated);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Hero Split */}
      <div className="grid md:grid-cols-2 overflow-hidden">
        <div className="text-white px-6 md:px-10 py-16 md:py-24 flex flex-col justify-center bg-gradient-to-br from-primary to-primary/80">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm mb-6 text-white font-semibold w-fit">
            <Heart className="w-4 h-4" />
            <span>about us</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">why every pet?</h1>
          <p className="text-lg md:text-xl text-white/90 font-medium">because every pet deserves love, safety, kindness, and a chance at life.</p>
        </div>
        <div className="hidden md:block relative overflow-hidden">
          <img src="https://media.base44.com/images/public/69a0f10efc1058c9e80d1210/0de8e2fe2_coronaarchtobadlands-116.jpg" alt="hero" className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-16 space-y-20">

        {/* Video + Text Split Section */}
        <div className="rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-2 shadow-lg border" style={{ borderColor: '#DEC0AA' }}>
          {/* YouTube Embed */}
          <div className="relative bg-black" style={{ paddingTop: '56.25%' }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src="https://www.youtube.com/embed/GQ1MwND9xGY"
              title="every pet matters"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          {/* Text */}
          <div className="flex flex-col justify-center p-10" style={{ background: '#FDF0E8' }}>
            <h2 className="text-3xl font-black mb-4" style={{ color: '#0F3D1F' }}>our story</h2>
            <p className="font-medium leading-relaxed mb-4" style={{ color: '#2B5242' }}>
              every pet matters was built on a simple belief — no pet or pet parent should be left behind. we connect rescues, shelters, fosters, and families to give every pet the chance they deserve.
            </p>
            <p className="font-medium leading-relaxed" style={{ color: '#2B5242' }}>
              watch our story to learn how we're making a difference, one pet at a time.
            </p>
          </div>
        </div>

        {/* Mission */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-yellow-100 rounded-xl">
              <Target className="w-5 h-5 text-yellow-500" />
            </div>
            <h2 className="text-3xl font-black text-stone-900">Our Mission</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="text-stone-600 text-lg leading-relaxed font-medium mb-4">Every year, millions of pets go missing or end up in shelters waiting for a second chance. We started every pet matters because we believe the gap between lost animals and their homes is due to inaccessibility.

              </p>
              <p className="text-stone-600 text-lg leading-relaxed font-medium">
                Our mission is simple: <strong className="text-stone-900">no pet or pet parent left behind.</strong> Whether you're searching for a lost companion, looking to adopt, opting in to volunteer at a local rescue or shelter, or need access to resources to keep your pets in your home, this is the place for you.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {[
              { icon: "🐾", title: "Reunite Families", desc: "Help lost pets and their families find their way home or into a new home that's a better fit." },
              { icon: "🏠", title: "Find Forever Homes", desc: "Connect adoptable pets with loving families and fosters, enabling shelters to move animals that may be at risk due to over capacity or medical issues." },
              { icon: "🤝", title: "Support Rescues", desc: "Give shelters and rescues a higher level of accessibility in their communities through unique marketing tools & awareness opportunities. Our goal is to help those with less resources do more and lighten their load when it comes to administrative tasks related to adoptions, fostering, and transfers." }].
              map((item) =>
              <div key={item.title} className="flex items-start gap-4 bg-stone-50 rounded-2xl p-5 border border-stone-100">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <h4 className="font-black text-stone-800">{item.title}</h4>
                    <p className="text-sm text-stone-500 font-medium mt-0.5">{item.desc}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Team */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-yellow-100 rounded-xl">
              <Users className="w-5 h-5 text-yellow-500" />
            </div>
            <h2 className="text-3xl font-black text-stone-900">our team</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {team.map((member, i) =>
            <div key={i} className={i === team.length - 1 ? "sm:col-span-2 flex justify-center" : ""}>
              <div className={i === team.length - 1 ? "w-full sm:w-1/2" : "w-full"}>
                <TeamMember index={i} member={member} onPhotoUpdate={handlePhotoUpdate} onFieldUpdate={handleFieldUpdate} isAdmin={isAdmin} />
              </div>
            </div>
            )}
          </div>
        </section>

        {/* Values */}
        <section className="rounded-3xl p-10 bg-[#d4916e] hidden" style={{ background: "#d4916e" }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-white/70 rounded-xl">
              <Sparkles className="w-5 h-5 text-yellow-500" />
            </div>
            <h2 className="text-3xl font-black text-stone-900">our values</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
            { emoji: "❤️", label: "Compassion" },
            { emoji: "🔍", label: "Transparency" },
            { emoji: "🌍", label: "Community" },
            { emoji: "⚡", label: "Action" }].
            map((v) =>
            <div key={v.label} className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 text-center shadow-sm">
                <div className="text-3xl mb-2">{v.emoji}</div>
                <div className="font-black text-stone-800">{v.label}</div>
              </div>
            )}
          </div>
        </section>

        {/* Contact */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-yellow-100 rounded-xl">
              <Mail className="w-5 h-5 text-yellow-500" />
            </div>
            <h2 className="text-3xl font-black text-stone-900">send us a bark</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6">
              <Mail className="w-6 h-6 text-yellow-500 mb-3" />
              <h4 className="font-black text-stone-800 mb-1">Email Us</h4>
              <a href="mailto:bark@everypetmatters.org" className="text-stone-500 font-medium text-sm hover:text-yellow-600 transition">bark@everypetmatters.org</a>
            </div>
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6">
              <h4 className="font-black text-stone-800 mb-4">Follow Us</h4>
              <div className="flex items-center gap-4">
                <a href="https://facebook.com/everypetmattersorg" target="_blank" rel="noopener noreferrer" className="text-stone-600 hover:text-yellow-500 transition-colors" aria-label="Facebook">
                  <Facebook className="w-6 h-6" />
                </a>
                <a href="https://instagram.com/everypetmattersorg" target="_blank" rel="noopener noreferrer" className="text-stone-600 hover:text-yellow-500 transition-colors" aria-label="Instagram">
                  <Instagram className="w-6 h-6" />
                </a>
                <a href="https://linkedin.com/in/company/every-pet-matters" target="_blank" rel="noopener noreferrer" className="text-stone-600 hover:text-yellow-500 transition-colors" aria-label="LinkedIn">
                  <Linkedin className="w-6 h-6" />
                </a>
              </div>
            </div>
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6">
              <Heart className="w-6 h-6 text-yellow-500 mb-3" />
              <h4 className="font-black text-stone-800 mb-1">Partner With Us</h4>
              <a href="mailto:partner@everypetmatters.org" className="text-stone-500 font-medium text-sm hover:text-yellow-600 transition">partner@everypetmatters.org</a>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link to={createPageUrl("Home")}>
              <button className="px-7 py-3 bg-stone-900 text-white font-bold rounded-full hover:bg-stone-800 transition text-base">Back to Home</button>
            </Link>
          </div>
        </section>

      </div>
    </div>);

}