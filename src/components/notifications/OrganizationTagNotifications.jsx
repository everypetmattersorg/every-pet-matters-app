import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, X, Building2, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function OrganizationTagNotifications({ userEmail, userRole }) {
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState(null);

  const { data: pendingTags = [] } = useQuery({
    queryKey: ['pending_org_tags', userEmail],
    queryFn: () => 
      base44.entities.OrganizationTag.filter({
        organization_email: userEmail,
        status: 'pending'
      }, '-created_date', 100),
    enabled: !!userEmail && (userRole === 'rescue' || userRole === 'shelter')
  });

  const handleApprove = async (tagId, tagData) => {
    setProcessing(tagId);
    const user = await base44.auth.me();
    
    await base44.entities.OrganizationTag.update(tagId, {
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by_email: user.email
    });

    // Add tag to post/event
    const entityName = tagData.content_type === 'post' ? 'Post' : 'RescueEvent';
    const entity = await base44.entities[entityName].get(tagData.post_id);
    const currentTags = entity.tagged_organizations || [];
    await base44.entities[entityName].update(tagData.post_id, {
      tagged_organizations: [...currentTags, tagId]
    });

    queryClient.invalidateQueries({ queryKey: ['pending_org_tags'] });
    setProcessing(null);
  };

  const handleReject = async (tagId) => {
    setProcessing(tagId);
    await base44.entities.OrganizationTag.update(tagId, {
      status: 'rejected'
    });
    queryClient.invalidateQueries({ queryKey: ['pending_org_tags'] });
    setProcessing(null);
  };

  if (pendingTags.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 px-2">
        <Building2 className="w-4 h-4" />
        organization tag requests
      </div>
      {pendingTags.map(tag => (
        <Card key={tag.id} className="p-4 border-blue-200 bg-blue-50">
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium text-slate-800">
                {tag.tagged_by_name} tagged you in a {tag.content_type}
              </p>
              <p className="text-xs text-slate-500">
                {formatDistanceToNow(new Date(tag.created_date), { addSuffix: true })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleApprove(tag.id, tag)}
                disabled={processing === tag.id}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 rounded-lg"
              >
                {processing === tag.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Approve
              </Button>
              <Button
                size="sm"
                onClick={() => handleReject(tag.id)}
                disabled={processing === tag.id}
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 gap-1.5 rounded-lg"
              >
                {processing === tag.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                )}
                Reject
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}