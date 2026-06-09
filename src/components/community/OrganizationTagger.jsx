import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Building2, X, Loader2 } from 'lucide-react';

export default function OrganizationTagger({ postId, contentType, onTagged }) {
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const { data: rescues = [] } = useQuery({
    queryKey: ['rescues'],
    queryFn: () => base44.entities.Rescue.list('-created_date', 100)
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list('-created_date', 100)
  });

  const allOptions = [
    ...rescues.map(r => ({
      id: r.email,
      name: r.name,
      type: 'rescue',
      email: r.email
    })),
    ...services.map(s => ({
      id: s.id,
      name: s.name,
      type: 'service',
      email: s.email
    }))
  ];

  const filteredOptions = search.trim()
    ? allOptions.filter(o => o.name.toLowerCase().includes(search.toLowerCase()))
    : [];

  const handleAddTag = (option) => {
    if (!selectedTags.find(t => t.id === option.id)) {
      setSelectedTags([...selectedTags, option]);
    }
    setSearch('');
  };

  const handleRemoveTag = (id) => {
    setSelectedTags(selectedTags.filter(t => t.id !== id));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const user = await base44.auth.me();
    
    for (const tag of selectedTags) {
      await base44.entities.OrganizationTag.create({
        post_id: postId,
        content_type: contentType,
        tagged_by_email: user.email,
        tagged_by_name: user.full_name || user.email.split('@')[0],
        organization_email: tag.email || tag.id,
        organization_name: tag.name,
        organization_type: tag.type,
        status: 'pending'
      });
    }
    
    setSubmitting(false);
    setSelectedTags([]);
    setShowSearch(false);
    onTagged();
  };

  return (
    <div className="border-t border-slate-100 pt-3">
      {!showSearch ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSearch(true)}
          className="text-slate-500 hover:text-slate-700 gap-1.5"
        >
          <Building2 className="w-4 h-4" />
          Tag organizations
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Input
              placeholder="Search rescues, shelters, services..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="text-sm"
              autoFocus
            />
            {search && filteredOptions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                {filteredOptions.map(option => (
                  <button
                    key={option.id}
                    onClick={() => handleAddTag(option)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm border-b border-slate-100 last:border-b-0"
                  >
                    <div className="font-medium text-slate-800">{option.name}</div>
                    <div className="text-xs text-slate-500 capitalize">{option.type}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <Badge key={tag.id} className="gap-1.5 bg-blue-100 text-blue-700">
                  {tag.name}
                  <button
                    onClick={() => handleRemoveTag(tag.id)}
                    className="hover:text-blue-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={selectedTags.length === 0 || submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Send Tags
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowSearch(false);
                setSearch('');
                setSelectedTags([]);
              }}
              className="rounded-lg"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}