import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Heart } from 'lucide-react';

export default function Home() {
  const { data: lostFoundPets = [] } = useQuery({
    queryKey: ['home-lost-found-pets'],
    queryFn: () => base44.entities.Pet.list('-created_date', 50)
  });

  const { data: adoptablePetsManual = [] } = useQuery({
    queryKey: ['home-adoptable-manual'],
    queryFn: () => base44.entities.AdoptablePet.filter({ status: 'available' }, '-created_date', 10000)
  });

  const { data: adoptablePetsSynced = [] } = useQuery({
    queryKey: ['home-adoptable-synced'],
    queryFn: () => base44.entities.Pet.filter({ adoption_status: 'Available' }, '-created_date', 10000)
  });

  const pets = lostFoundPets;

  const stats = {
    lost: pets.filter((p) => p.status === 'lost').length,
    found: pets.filter((p) => p.status === 'found').length,
    reunited: pets.filter((p) => p.status === 'reunited').length,
    adoptable: adoptablePetsManual.length + adoptablePetsSynced.filter(p => !p.hidden_from_public).length
  };

  return (
    <div className="min-h-screen" style={{ background: '#FAF5F0' }}>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a0f10efc1058c9e80d1210/cb9af1371_cathedralrocktooakcreek-102.jpg)' }} />
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative text-white mx-auto px-4 py-20 max-w-7xl md:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full text-sm mb-6 font-semibold" style={{ color: '#0F3D1F' }}>
              <Heart className="w-4 h-4" style={{ color: '#D3713C' }} />
              <span>every pet matters.</span>
            </div>
            <h1 className="mb-6 text-5xl font-black leading-tight md:text-7xl text-[hsl(var(--background))]">yes, every pet.</h1>
            <p className="mb-8 text-lg font-medium md:text-xl max-w-xl text-[hsl(var(--background))]">we believe that every pet deserves to be in a safe and loving home. together, we can provide the support needed for thousands of rescues, shelters, and pets.</p>
            <div className="flex flex-wrap gap-3">
              <Link to={createPageUrl('Adopt')}>
                <button className="px-7 py-3 text-white font-bold rounded-full transition text-base lowercase bg-[#2c5443]" style={{ background: '#0F3D1F' }}>Find a Pet</button>
              </Link>
              <Link to={createPageUrl('Volunteer')}>
                <button className="px-7 py-3 font-bold rounded-full transition text-base lowercase text-[#2c5443]" style={{ background: '#DEC0AA', color: '#0F3D1F' }}>Get Involved</button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className="rounded-2xl p-6 text-center border" style={{ background: '#FDF0E8', borderColor: '#DEC0AA' }}>
            <div className="text-3xl md:text-4xl font-black" style={{ color: '#A33407' }}>{stats.lost}</div>
            <div className="text-sm mt-1 font-semibold" style={{ color: '#2B5242' }}>Lost Pets</div>
          </div>
          <div className="rounded-2xl p-6 text-center border" style={{ background: '#FFFBEB', borderColor: '#F59E0B' }}>
            <div className="text-3xl md:text-4xl font-black" style={{ color: '#2B5242' }}>{stats.found}</div>
            <div className="text-sm mt-1 font-semibold" style={{ color: '#2B5242' }}>Found Pets</div>
          </div>
          <div className="rounded-2xl p-6 text-center border" style={{ background: '#EBF3EE', borderColor: '#0F3D1F' }}>
            <div className="text-3xl md:text-4xl font-black" style={{ color: '#0F3D1F' }}>{stats.reunited}</div>
            <div className="text-sm mt-1 font-semibold" style={{ color: '#2B5242' }}>Reunited</div>
          </div>
          <Link to={createPageUrl('Adopt')} className="rounded-2xl p-6 text-center border hover:shadow-lg transition" style={{ background: '#FDF0E8', borderColor: '#D3713C' }}>
            <div className="text-3xl md:text-4xl font-black" style={{ color: '#D3713C' }}>{stats.adoptable}</div>
            <div className="text-sm mt-1 font-semibold" style={{ color: '#2B5242' }}>Adoptable Pets</div>
          </Link>
        </div>
      </div>

      {/* Featured Sections */}
      <div className="max-w-7xl mx-auto pr-4 pl-4 pt-8 pb-8">

        {/* Adoption Section */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black" style={{ color: '#0F3D1F' }}>Find Your Perfect Pet</h2>
              <p className="mt-2 font-medium" style={{ color: '#2B5242' }}>Browse adoptable pets and find your next family member</p>
            </div>
            <Link to={createPageUrl('Adopt')}>
              <button className="px-5 py-2.5 font-bold rounded-full transition text-sm lowercase" style={{ background: '#D3713C', color: '#fff' }}>Browse All</button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Link to={createPageUrl('Adopt')} className="group bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition border" style={{ borderColor: '#DEC0AA' }}>
              <div className="text-5xl mb-4">🐕</div>
              <h3 className="text-xl font-black" style={{ color: '#0F3D1F' }}>see adoptable pets</h3>
              <p className="mt-2 font-medium" style={{ color: '#2B5242' }}>Explore all available pets ready for adoption</p>
            </Link>
            <Link to={createPageUrl('Urgent')} className="group bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition border" style={{ borderColor: '#DEC0AA' }}>
              <div className="text-5xl mb-4">🚨</div>
              <h3 className="text-xl font-black" style={{ color: '#A33407' }}>urgent cases</h3>
              <p className="mt-2 font-medium" style={{ color: '#2B5242' }}>Pets in immediate need of rescue or foster care</p>
            </Link>
            <Link to={createPageUrl('Recommendations')} className="group bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition border" style={{ borderColor: '#DEC0AA' }}>
              <div className="text-5xl mb-4">✨</div>
              <h3 className="text-xl font-black" style={{ color: '#D3713C' }}>Pet Recs</h3>
              <p className="mt-2 font-medium" style={{ color: '#2B5242' }}>Find pets matched to your preferences</p>
            </Link>
          </div>
        </div>

        {/* Lost & Found Section */}
        <div className="mb-20 rounded-3xl pr-10 pl-10 pb-8 pt-8" style={{ background: 'linear-gradient(135deg, #EBF3EE 0%, #F5EDE6 100%)' }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black" style={{ color: '#0F3D1F' }}>Help Lost &amp; Found Pets</h2>
              <p className="mt-2 font-medium" style={{ color: '#2B5242' }}>Report, find, and reunite lost and found animals</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <Link to={createPageUrl('LostAndFound')} className="group bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-xl font-black" style={{ color: '#0F3D1F' }}>Lost &amp; Found Listings</h3>
              <p className="mt-2 font-medium" style={{ color: '#2B5242' }}>Browse all lost and found pet reports with filters and maps</p>
            </Link>
            <Link to={`${createPageUrl('LostAndFound')}?tab=photo-match`} className="group bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition">
              <div className="text-5xl mb-4">📸</div>
              <h3 className="text-xl font-black" style={{ color: '#D3713C' }}>Photo Match</h3>
              <p className="mt-2 font-medium" style={{ color: '#2B5242' }}>Upload a photo to find matching lost or found pets</p>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Link to={createPageUrl('ReportLost')} className="group rounded-2xl p-6 border-2 transition" style={{ background: '#FDF0E8', borderColor: '#D3713C' }}>
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6" style={{ color: '#A33407' }} />
                <div>
                  <h4 className="font-black" style={{ color: '#0F3D1F' }}>Report Lost Pet</h4>
                  <p className="text-sm font-medium" style={{ color: '#2B5242' }}>Help spread the word about your missing pet</p>
                </div>
              </div>
            </Link>
            <Link to={createPageUrl('ReportFound')} className="group rounded-2xl p-6 border-2 transition" style={{ background: '#EBF3EE', borderColor: '#2B5242' }}>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6" style={{ color: '#2B5242' }} />
                <div>
                  <h4 className="font-black" style={{ color: '#0F3D1F' }}>Report Found Pet</h4>
                  <p className="text-sm font-medium" style={{ color: '#2B5242' }}>Help reunite a found pet with their family</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Community Section */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black" style={{ color: '#0F3D1F' }}>Join Our Pet Community</h2>
              <p className="mt-2 font-medium" style={{ color: '#2B5242' }}>Connect with fellow pet lovers and get resources</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Link to={createPageUrl('Events')} className="group bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition border" style={{ borderColor: '#DEC0AA' }}>
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-xl font-black" style={{ color: '#D3713C' }}>Events</h3>
              <p className="mt-2 font-medium" style={{ color: '#2B5242' }}>Find adoption events, volunteer days, and meetups</p>
            </Link>
            <Link to={createPageUrl('Community')} className="group bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition border" style={{ borderColor: '#DEC0AA' }}>
              <div className="text-5xl mb-4">👥</div>
              <h3 className="text-xl font-black" style={{ color: '#D3713C' }}>Community</h3>
              <p className="mt-2 font-medium" style={{ color: '#2B5242' }}>Share stories, photos, and connect with other pet owners</p>
            </Link>
            <Link to={createPageUrl('Resources')} className="group bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition border" style={{ borderColor: '#DEC0AA' }}>
              <div className="text-5xl mb-4">📚</div>
              <h3 className="text-xl font-black" style={{ color: '#D3713C' }}>Resources</h3>
              <p className="mt-2 font-medium" style={{ color: '#2B5242' }}>Find guides, support organizations, and helpful articles</p>
            </Link>
          </div>
        </div>

        {/* Services Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black" style={{ color: '#0F3D1F' }}>Pet Services &amp; Discounts</h2>
              <p className="mt-2 font-medium" style={{ color: '#2B5242' }}>Find vets, groomers, trainers, and exclusive deals</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Link to={createPageUrl('Services')} className="group bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition border" style={{ borderColor: '#DEC0AA' }}>
              <div className="text-5xl mb-4">🏥</div>
              <h3 className="text-xl font-black" style={{ color: '#2B5242' }}>Services</h3>
              <p className="mt-2 font-medium" style={{ color: '#2B5242' }}>Browse vetted pet care services near you</p>
            </Link>
            <Link to={createPageUrl('Discounts')} className="group bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition border" style={{ borderColor: '#DEC0AA' }}>
              <div className="text-5xl mb-4">🏷️</div>
              <h3 className="text-xl font-black" style={{ color: '#D3713C' }}>Discounts</h3>
              <p className="mt-2 font-medium" style={{ color: '#2B5242' }}>Exclusive deals from pet-friendly businesses</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}