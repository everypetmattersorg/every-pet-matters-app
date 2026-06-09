import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

const DEFAULT_FILTERS = {
  species: "",
  breed: "",
  age: "",
  size: "",
  gender: "",
  location: "",
  good_with_kids: "",
  good_with_dogs: "",
  good_with_cats: "",
  urgent: "",
  energy_level: "",
  special_needs: "",
  availableForFoster: false,
};

export { DEFAULT_FILTERS };

export default function AdoptablePetFilters({ onFiltersChange, onClear }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const update = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onFiltersChange(next);
  };

  const activeCount = [
    filters.species,
    filters.breed,
    filters.age,
    filters.size,
    filters.gender,
    filters.location,
    filters.good_with_kids,
    filters.good_with_dogs,
    filters.good_with_cats,
    filters.urgent,
    filters.energy_level,
    filters.special_needs,
    filters.availableForFoster,
  ].filter(Boolean).length;

  const handleClear = () => {
    setFilters(DEFAULT_FILTERS);
    onFiltersChange(DEFAULT_FILTERS);
    onClear?.();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
      {/* Row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Species</label>
          <Select value={filters.species || "all"} onValueChange={(v) => update("species", v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 text-sm rounded-lg bg-white"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All species</SelectItem>
              <SelectItem value="dog">Dog</SelectItem>
              <SelectItem value="cat">Cat</SelectItem>
              <SelectItem value="bird">Bird</SelectItem>
              <SelectItem value="rabbit">Rabbit</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Breed</label>
          <Input
            className="h-9 text-sm rounded-lg"
            placeholder="Any breed"
            value={filters.breed}
            onChange={(e) => update("breed", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Age</label>
          <Select value={filters.age || "all"} onValueChange={(v) => update("age", v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 text-sm rounded-lg bg-white"><SelectValue placeholder="Any age" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any age</SelectItem>
              <SelectItem value="baby">Baby (0–1 yr)</SelectItem>
              <SelectItem value="young">Young (1–3 yrs)</SelectItem>
              <SelectItem value="adult">Adult (3–7 yrs)</SelectItem>
              <SelectItem value="senior">Senior (7+ yrs)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Size</label>
          <Select value={filters.size || "all"} onValueChange={(v) => update("size", v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 text-sm rounded-lg bg-white"><SelectValue placeholder="Any size" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any size</SelectItem>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Gender</label>
          <Select value={filters.gender || "all"} onValueChange={(v) => update("gender", v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 text-sm rounded-lg bg-white"><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any gender</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Energy</label>
          <Select value={filters.energy_level || "all"} onValueChange={(v) => update("energy_level", v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 text-sm rounded-lg bg-white"><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any energy</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Location</label>
          <Input
            className="h-9 text-sm rounded-lg"
            placeholder="City or state"
            value={filters.location}
            onChange={(e) => update("location", e.target.value)}
          />
        </div>
      </div>

      {/* Row 2 */}
      <div className="flex flex-wrap gap-4">
        <div className="min-w-[130px]">
          <label className="block text-xs font-medium text-slate-600 mb-1">👶 Kids</label>
          <Select value={filters.good_with_kids || "any"} onValueChange={(v) => update("good_with_kids", v === "any" ? "" : v)}>
            <SelectTrigger className="h-9 text-sm rounded-lg bg-white"><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[130px]">
          <label className="block text-xs font-medium text-slate-600 mb-1">🐕 Dogs</label>
          <Select value={filters.good_with_dogs || "any"} onValueChange={(v) => update("good_with_dogs", v === "any" ? "" : v)}>
            <SelectTrigger className="h-9 text-sm rounded-lg bg-white"><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[130px]">
          <label className="block text-xs font-medium text-slate-600 mb-1">🐱 Cats</label>
          <Select value={filters.good_with_cats || "any"} onValueChange={(v) => update("good_with_cats", v === "any" ? "" : v)}>
            <SelectTrigger className="h-9 text-sm rounded-lg bg-white"><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[130px]">
          <label className="block text-xs font-medium text-slate-600 mb-1">Urgent</label>
          <Select value={filters.urgent || "any"} onValueChange={(v) => update("urgent", v === "any" ? "" : v)}>
            <SelectTrigger className="h-9 text-sm rounded-lg bg-white"><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[130px]">
          <label className="block text-xs font-medium text-slate-600 mb-1">Special Needs</label>
          <Select value={filters.special_needs || "any"} onValueChange={(v) => update("special_needs", v === "any" ? "" : v)}>
            <SelectTrigger className="h-9 text-sm rounded-lg bg-white"><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[130px]">
          <label className="block text-xs font-medium text-slate-600 mb-1">Foster Available</label>
          <Select value={filters.availableForFoster ? "yes" : "any"} onValueChange={(v) => update("availableForFoster", v === "yes")}>
            <SelectTrigger className="h-9 text-sm rounded-lg bg-white"><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Clear */}
      {activeCount > 0 && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClear}
            className="h-8 px-3 rounded-lg gap-2 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-3.5 h-3.5" />
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}