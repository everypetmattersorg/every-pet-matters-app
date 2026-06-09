import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, PlusCircle, Loader2, Map, Grid3x3 } from 'lucide-react';
import ServiceCard from '@/components/services/ServiceCard';
import ServiceDetail from '@/components/services/ServiceDetail';
import AddServiceForm from '@/components/services/AddServiceForm';

const CATEGORIES = [
{ value: 'all', label: 'All' },
{ value: 'veterinarian', label: '🏥 Vets' },
{ value: 'groomer', label: '✂️ Groomers' },
{ value: 'trainer', label: '🎓 Trainers' },
{ value: 'pet_sitter', label: '🏠 Sitters' },
{ value: 'pet_store', label: '🛒 Stores' },
{ value: 'pet_friendly_business', label: '🐾 Pet-Friendly' }];


export default function Services() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [selectedService, setSelectedService] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'
  const queryClient = useQueryClient();

  useEffect(() => {base44.auth.me().then(setUser).catch(() => {});}, []);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list('-created_date', 100)
  });

  const { data: allReviews = [] } = useQuery({
    queryKey: ['all_reviews'],
    queryFn: () => base44.entities.ServiceReview.list('-created_date', 500)
  });

  const getStats = (serviceId) => {
    const r = allReviews.filter((r) => r.service_id === serviceId);
    const avg = r.length ? r.reduce((s, x) => s + x.rating, 0) / r.length : 0;
    return { avg, count: r.length };
  };

  const filtered = services.filter((s) => {
    if (category !== 'all' && s.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.name?.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q));

    }
    return true;
  });

  return (
    <div className="min-h-screen from-slate-50 to-blue-50 py-8 px-4 bg-[hsl(var(--background))]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Pet Services</h1>
            <p className="text-slate-500 mt-1">Find trusted local vets, groomers, trainers & more</p>
          </div>
          {user &&
          <Button onClick={() => setShowAddForm(true)} className="rounded-xl gap-2 w-fit text-white" style={{ backgroundColor: '#b1511d' }} onMouseEnter={(e) => e.target.style.backgroundColor = '#8f3d15'} onMouseLeave={(e) => e.target.style.backgroundColor = '#b1511d'}>
              <PlusCircle className="w-4 h-4" /> Add a Service
            </Button>
          }
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, city, or description..."
            className="pl-11 rounded-xl h-12 text-base" />
          
        </div>

        {/* Category filters & View Toggle */}
        <div className="flex gap-2 flex-wrap mb-6 justify-between items-center">
          <div className="flex gap-2 flex-wrap overflow-x-auto pb-1">
            {CATEGORIES.map((c) =>
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${category === c.value ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'}`}>
              
                {c.label}
              </button>
            )}
          </div>
          <div className="flex gap-1 bg-white rounded-lg border border-slate-200 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              title="Grid view">
              
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded transition-colors ${viewMode === 'map' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              title="Map view by city">
              
              <Map className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Grid or Map View */}
        {isLoading ?
        <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
          </div> :
        filtered.length === 0 ?
        <div className="text-center py-20">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-slate-500">No services found. Try a different search or category.</p>
            {user &&
          <Button onClick={() => setShowAddForm(true)} className="mt-4 rounded-xl text-white" style={{ backgroundColor: '#b1511d' }} onMouseEnter={(e) => e.target.style.backgroundColor = '#8f3d15'} onMouseLeave={(e) => e.target.style.backgroundColor = '#b1511d'}>
                Add the first one!
              </Button>
          }
          </div> :
        viewMode === 'grid' ?
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((s) => {
            const { avg, count } = getStats(s.id);
            return (
              <ServiceCard
                key={s.id}
                service={s}
                avgRating={avg}
                reviewCount={count}
                onClick={() => setSelectedService(s)} />);


          })}
          </div> :

        <div className="space-y-4">
            {Object.entries(
            filtered.reduce((acc, s) => {
              const city = s.city || 'Unknown City';
              if (!acc[city]) acc[city] = [];
              acc[city].push(s);
              return acc;
            }, {})
          ).sort().map(([city, cityServices]) =>
          <div key={city} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-800">{city} ({cityServices.length})</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {cityServices.map((s) => {
                const { avg, count } = getStats(s.id);
                return (
                  <ServiceCard
                    key={s.id}
                    service={s}
                    avgRating={avg}
                    reviewCount={count}
                    onClick={() => setSelectedService(s)} />);


              })}
                </div>
              </div>
          )}
          </div>
        }
      </div>

      {selectedService &&
      <ServiceDetail
        service={selectedService}
        currentUser={user}
        onClose={() => setSelectedService(null)} />

      }

      {showAddForm &&
      <AddServiceForm
        user={user}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['services'] });
          setShowAddForm(false);
        }}
        onClose={() => setShowAddForm(false)} />

      }
    </div>);

}