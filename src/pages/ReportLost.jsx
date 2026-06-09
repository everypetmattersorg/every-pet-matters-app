import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { HERO_COLORS } from '@/lib/heroConfig';
import { ArrowLeft, AlertTriangle, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import PetForm from '../components/pets/PetForm';
import { toast } from 'sonner';
import { fireMatchingAlerts } from '@/components/alerts/alertMatcher';

export default function ReportLost() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    const pet = await base44.entities.LostFoundPet.create({ ...formData, status: 'lost' });
    toast.success('Lost pet report submitted successfully!');
    navigate(createPageUrl('Home'));
  };

  return (
    <div className="min-h-screen" style={{ background: '#FAF5F0' }}>
      {/* Split Header */}
      <div className="px-4 py-6" style={{ background: HERO_COLORS.background }}>
        <div className="max-w-6xl mx-auto rounded-2xl overflow-hidden flex flex-col md:flex-row" style={{ minHeight: '340px' }}>
          {/* Left: photo */}
          <div className="md:w-1/2 w-full min-h-48 md:min-h-0">
            <img src="https://media.base44.com/images/public/69a0f10efc1058c9e80d1210/5dca1f7ec_IMG_9641.JPG"
            alt="Report lost pet"
            className="w-full h-full object-cover"
            style={{ display: 'block' }} />
          </div>
          {/* Right: panel */}
          <div className="md:w-1/2 w-full flex flex-col justify-center px-10 py-10" style={{ background: HERO_COLORS.panelBg }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-5 self-start" style={{ background: HERO_COLORS.badgeBg, color: HERO_COLORS.badgeText }}>
              <Heart className="w-4 h-4" /> help reunite lost and found pets with their families
            </div>
            <h1 className="text-5xl font-black mb-4 leading-tight" style={{ color: HERO_COLORS.panelText }}>report a lost pet</h1>
            <p className="text-lg max-w-sm leading-relaxed mb-6" style={{ color: HERO_COLORS.panelSubtext }}>provide details about your lost pet to help the community reunite you with your furry friend.</p>
            <Link to={createPageUrl('LostAndFound')}>
              <Button size="lg" className="self-start h-11 px-6 font-semibold rounded-xl bg-[#2B5242] hover:bg-[#1e3a2e] text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to lost & found
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 py-10 -mt-6">
        <PetForm
          formType="lost"
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting} />
        
      </div>
    </div>);

}