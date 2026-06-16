import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from 'lucide-react';
import LocationAutocomplete from './LocationAutocomplete';

export default function PetFilters({ filters, onFilterChange, onMapFilterChange, hiddenFilters = [], pets = [] }) {
  const [locating, setLocating] = useState(false);

  const titleCase = (s) => s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  const sourceOptions = [...new Set(pets.map(p => p.source).filter(Boolean))].sort();
  const breedOptions = [...new Set(pets.map(p => p.breed).filter(Boolean))].sort();

  const handleNearMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onMapFilterChange({ center: { lat: pos.coords.latitude, lng: pos.coords.longitude }, radiusMiles: 25, active: true });
        setLocating(false);
      },
      () => setLocating(false)
    );
  };
  const clearAll = () => {
    onFilterChange({
      species: '',
      breed: '',
      age: '',
      size: '',
      gender: '',
      location: '',
      source: '',
      kid_friendly: '',
      dog_friendly: '',
      cat_friendly: '',
      urgent: '',
      rescue_needed: '',
      vaccinated: ''
    });
    onMapFilterChange({ center: null, radiusMiles: 10, active: false });
  };

  const activeCount = [
  filters.species && filters.species !== 'all',
  filters.breed && filters.breed !== 'all',
  filters.age && filters.age !== 'all',
  filters.size && filters.size !== 'all',
  filters.gender && filters.gender !== 'all',
  filters.location,
  filters.source && filters.source !== 'all',
  filters.kid_friendly && filters.kid_friendly !== '',
  filters.dog_friendly && filters.dog_friendly !== '',
  filters.cat_friendly && filters.cat_friendly !== '',
  filters.urgent && filters.urgent !== '',
  filters.rescue_needed && filters.rescue_needed !== '',
  filters.vaccinated && filters.vaccinated !== ''].
  filter(Boolean).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
      {/* Row 1: Source, Species, Breed, Age, Size, Gender, Location */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Rescue / Shelter</label>
          <Select value={filters.source || 'all'} onValueChange={(v) => onFilterChange({ ...filters, source: v })}>
            <SelectTrigger className="h-9 text-sm rounded-lg bg-white">
              <SelectValue placeholder="All sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {sourceOptions.map(s => <SelectItem key={s} value={s}>{titleCase(s)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Species</label>
          <Select value={filters.species || 'all'} onValueChange={(v) => onFilterChange({ ...filters, species: v })}>
            <SelectTrigger className="h-9 text-sm rounded-lg bg-white">
              <SelectValue placeholder="All species" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All species</SelectItem>
              <SelectItem value="Dog">Dog</SelectItem>
              <SelectItem value="Cat">Cat</SelectItem>
              <SelectItem value="Bird">Bird</SelectItem>
              <SelectItem value="Rabbit">Rabbit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Breed</label>
          <Select value={filters.breed || 'all'} onValueChange={(v) => onFilterChange({ ...filters, breed: v })}>
            <SelectTrigger className="h-9 text-sm rounded-lg bg-white">
              <SelectValue placeholder="All breeds" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All breeds</SelectItem>
              {breedOptions.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Age</label>
          <Select value={filters.age || 'all'} onValueChange={(v) => onFilterChange({ ...filters, age: v === 'all' ? '' : v })}>
            <SelectTrigger className="h-9 text-sm rounded-lg bg-white">
              <SelectValue placeholder="Any age" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any age</SelectItem>
              <SelectItem value="baby">Baby (&lt;1 yr)</SelectItem>
              <SelectItem value="young">Young (1-3 yrs)</SelectItem>
              <SelectItem value="adult">Adult (3-7 yrs)</SelectItem>
              <SelectItem value="senior">Senior (7+ yrs)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Size</label>
          <Select value={filters.size || 'all'} onValueChange={(v) => onFilterChange({ ...filters, size: v === 'all' ? '' : v })}>
            <SelectTrigger className="h-9 text-sm rounded-lg bg-white">
              <SelectValue placeholder="Any size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any size</SelectItem>
              <SelectItem value="Small">Small</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Large">Large</SelectItem>
              <SelectItem value="Extra Large">Extra Large</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Gender</label>
          <Select value={filters.gender || 'all'} onValueChange={(v) => onFilterChange({ ...filters, gender: v === 'all' ? '' : v })}>
            <SelectTrigger className="h-9 text-sm rounded-lg bg-white">
              <SelectValue placeholder="Any gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any gender</SelectItem>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Location</label>
          <LocationAutocomplete
            value={filters.location || ''}
            onChange={(val) => onFilterChange({ ...filters, location: val })}
            onSelect={(suggestion) => onMapFilterChange({ center: { lat: suggestion.lat, lng: suggestion.lng }, radiusMiles: 25, active: true })}
            placeholder="Search location..." />
          
        </div>
      </div>

      {/* Row 2: Kids, Dogs, Cats, Urgent, Rescue Needed, Vaccinated, Location buttons */}
      <div className="flex flex-wrap gap-4">
        {!hiddenFilters.includes('kid_friendly') && <div className="min-w-[130px]">
          <label className="block text-xs font-medium text-slate-600 mb-1">👶 Kids</label>
          <Select value={filters.kid_friendly || 'any'} onValueChange={(v) => onFilterChange({ ...filters, kid_friendly: v === 'any' ? '' : v })}>
            <SelectTrigger className="h-9 text-sm rounded-lg bg-white">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="unsure">Unsure</SelectItem>
            </SelectContent>
          </Select>
        </div>}

        {!hiddenFilters.includes('dog_friendly') && <div className="min-w-[130px]">
          <label className="block text-xs font-medium text-slate-600 mb-1">🐕 Dogs</label>
          <Select value={filters.dog_friendly || 'any'} onValueChange={(v) => onFilterChange({ ...filters, dog_friendly: v === 'any' ? '' : v })}>
            <SelectTrigger className="h-9 text-sm rounded-lg bg-white">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="unsure">Unsure</SelectItem>
            </SelectContent>
          </Select>
        </div>}

        {!hiddenFilters.includes('cat_friendly') && <div className="min-w-[130px]">
          <label className="block text-xs font-medium text-slate-600 mb-1">🐱 Cats</label>
          <Select value={filters.cat_friendly || 'any'} onValueChange={(v) => onFilterChange({ ...filters, cat_friendly: v === 'any' ? '' : v })}>
            <SelectTrigger className="h-9 text-sm rounded-lg bg-white">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="unsure">Unsure</SelectItem>
            </SelectContent>
          </Select>
        </div>}

        {!hiddenFilters.includes('urgent') && <div className="min-w-[130px]">
          <label className="block text-xs font-medium text-slate-600 mb-1">Urgent</label>
          <Select value={filters.urgent || 'any'} onValueChange={(v) => onFilterChange({ ...filters, urgent: v === 'any' ? '' : v })}>
            <SelectTrigger className="h-9 text-sm rounded-lg bg-white">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>}

        {!hiddenFilters.includes('rescue_needed') && <div className="min-w-[130px]">
          <label className="block text-xs font-medium text-slate-600 mb-1">Rescue Needed</label>
          <Select value={filters.rescue_needed || 'any'} onValueChange={(v) => onFilterChange({ ...filters, rescue_needed: v === 'any' ? '' : v })}>
            <SelectTrigger className="h-9 text-sm rounded-lg bg-white">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>}

        {!hiddenFilters.includes('vaccinated') && <div className="min-w-[130px]">
          <label className="block text-xs font-medium text-slate-600 mb-1">Vaccinated</label>
          <Select value={filters.vaccinated || 'any'} onValueChange={(v) => onFilterChange({ ...filters, vaccinated: v === 'any' ? '' : v })}>
            <SelectTrigger className="h-9 text-sm rounded-lg bg-white">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>}

        <div className="flex items-end gap-2">
          <Button
            variant={onMapFilterChange && locating ? "outline" : "outline"}
            size="sm"
            onClick={handleNearMe}
            disabled={locating}
            className={`h-9 gap-1 rounded-lg text-xs text-[#af501d] ${onMapFilterChange ? "border-rose-300 hover:bg-rose-50" : ""}`}>
            
            {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{locating ? "Locating..." : "Near Me"}</span>
          </Button>
        </div>
      </div>

      {/* Clear filters */}
      {activeCount > 0 &&
      <div className="flex justify-end">
          <Button
          type="button"
          variant="ghost"
          onClick={clearAll}
          className="h-8 px-3 rounded-lg gap-2 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100">
          
            Clear all filters
          </Button>
        </div>
      }
    </div>);

}