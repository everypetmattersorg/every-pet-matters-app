import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import EventDetailsStep from "./wizard/EventDetailsStep";
import LocationStep from "./wizard/LocationStep";
import DateTimeStep from "./wizard/DateTimeStep";
import PromotionalStep from "./wizard/PromotionalStep";
import ReviewStep from "./wizard/ReviewStep";

const STEPS = [
  { id: "details", title: "Event Details", description: "Basic information" },
  { id: "location", title: "Location", description: "Where it's happening" },
  { id: "datetime", title: "Date & Time", description: "When it's happening" },
  { id: "promotional", title: "Promotion", description: "Spread the word" },
  { id: "review", title: "Review", description: "Confirm details" },
];

export default function EventWizard({ userEmail }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    event_type: "adoption_event",
    description: "",
    location: "",
    latitude: null,
    longitude: null,
    event_date: "",
    event_time: "",
    promotional_description: "",
  });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await base44.entities.RescueEvent.create({
        ...formData,
        rescue_email: userEmail,
      });
      queryClient.invalidateQueries({ queryKey: ["rescueEvents"] });
      navigate(createPageUrl("RescueDashboard"));
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (STEPS[currentStep].id) {
      case "details":
        return formData.title && formData.event_type && formData.description;
      case "location":
        return formData.location;
      case "datetime":
        return formData.event_date && formData.event_time;
      case "promotional":
        return formData.promotional_description;
      case "review":
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case "details":
        return (
          <EventDetailsStep
            formData={formData}
            onUpdate={updateFormData}
          />
        );
      case "location":
        return (
          <LocationStep
            formData={formData}
            onUpdate={updateFormData}
          />
        );
      case "datetime":
        return (
          <DateTimeStep
            formData={formData}
            onUpdate={updateFormData}
          />
        );
      case "promotional":
        return (
          <PromotionalStep
            formData={formData}
            onUpdate={updateFormData}
          />
        );
      case "review":
        return (
          <ReviewStep formData={formData} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                    idx <= currentStep
                      ? idx === currentStep
                        ? "bg-[#b1511d] text-white"
                        : "bg-[#b1511d]/70 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {idx < currentStep ? <Check className="w-5 h-5" /> : idx + 1}
                </div>
                <div className="mt-2 text-center">
                  <p className="text-xs font-medium text-slate-900">{step.title}</p>
                  <p className="text-xs text-slate-500">{step.description}</p>
                </div>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-2 rounded transition-colors ${
                    idx < currentStep ? "bg-[#b1511d]/70" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border border-slate-200 p-8">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex gap-4 justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0 || loading}
          className="hover:bg-[#b1511d]/10 hover:text-[#b1511d] hover:border-[#b1511d]"
        >
          Previous
        </Button>

        <div className="text-sm text-slate-600">
          Step {currentStep + 1} of {STEPS.length}
        </div>

        {currentStep === STEPS.length - 1 ? (
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#b1511d] hover:bg-[#9a4519]"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Create Event
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={!isStepValid() || loading}
            className="bg-[#b1511d] hover:bg-[#9a4519]"
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
}