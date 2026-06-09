import { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from 'lucide-react';

export default function LocationAutocomplete({ value, onChange, onSelect, placeholder = "Search location..." }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);

    clearTimeout(debounceRef.current);
    if (val.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&addressdetails=1&limit=6&countrycodes=us`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        const results = data.map((item) => {
          const { city, town, village, county, state } = item.address || {};
          const place = city || town || village || county || '';
          const label = [place, state].filter(Boolean).join(', ');
          return { label, lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
        }).filter((r) => r.label);
        // Deduplicate by label
        const seen = new Set();
        const unique = results.filter((r) => {
          if (seen.has(r.label)) return false;
          seen.add(r.label);
          return true;
        });
        setSuggestions(unique);
        setOpen(unique.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const handleSelect = (suggestion) => {
    setQuery(suggestion.label);
    onChange(suggestion.label);
    onSelect && onSelect(suggestion);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        {loading
          ? <Loader2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 animate-spin" />
          : <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        }
        <Input
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="h-9 text-sm rounded-lg bg-white pl-8"
        />
      </div>
      {open && (
        <ul className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {suggestions.map((s, i) => (
            <li
              key={i}
              onMouseDown={() => handleSelect(s)}
              className="px-3 py-2 text-sm text-slate-700 hover:bg-rose-50 hover:text-rose-700 cursor-pointer flex items-center gap-2"
            >
              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}