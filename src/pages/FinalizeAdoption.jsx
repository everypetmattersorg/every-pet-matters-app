import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, CheckCircle2, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function FinalizeAdoption() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    finalization_date: new Date().toISOString().split("T")[0],
    adoption_fee_paid: false,
    adoption_contract_signed: false,
    microchip_registered: false,
    insurance_obtained: false,
  });

  const applicationId = searchParams.get("id");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch {
        navigate("/");
      }
    };
    fetchUser();
  }, [navigate]);

  const { data: application, isLoading } = useQuery({
    queryKey: ["adoption-application", applicationId],
    queryFn: () => base44.entities.AdoptionApplication.filter(
      { id: applicationId },
      undefined,
      1
    ).then(apps => apps?.[0]),
    enabled: !!applicationId,
  });

  const { data: pet } = useQuery({
    queryKey: ["pet", application?.pet_id],
    queryFn: () => base44.entities.AdoptablePet.filter(
      { id: application.pet_id },
      undefined,
      1
    ).then(pets => pets?.[0]),
    enabled: !!application?.pet_id,
  });

  const finalizeMutation = useMutation({
    mutationFn: async (data) => {
      // Update application status
      await base44.entities.AdoptionApplication.update(applicationId, {
        status: "approved",
      });

      // Create adoption follow-up tasks
      const adoptionDate = data.finalization_date;
      const followUpDates = {
        check_in_call: new Date(adoptionDate),
        post_adoption_survey: new Date(adoptionDate),
        wellness_check: new Date(adoptionDate),
      };

      // Schedule check-in after 1 week
      followUpDates.check_in_call.setDate(followUpDates.check_in_call.getDate() + 7);
      // Schedule survey after 30 days
      followUpDates.post_adoption_survey.setDate(followUpDates.post_adoption_survey.getDate() + 30);
      // Schedule wellness check after 60 days
      followUpDates.wellness_check.setDate(followUpDates.wellness_check.getDate() + 60);

      const taskTypes = ["check_in_call", "post_adoption_survey", "wellness_check"];
      for (const taskType of taskTypes) {
        await base44.entities.AdoptionFollowUp.create({
          adoption_application_id: applicationId,
          adopter_email: application.adopter_email,
          pet_name: pet.name,
          rescue_email: application.rescue_email,
          adoption_date: adoptionDate,
          task_type: taskType,
          scheduled_date: followUpDates[taskType].toISOString().split("T")[0],
          status: "pending",
        });
      }

      // Send notification to adopter
      await base44.functions.invoke("sendNotification", {
        user_email: application.adopter_email,
        type: "system",
        title: "Adoption Finalized!",
        message: `Congratulations! Your adoption of ${pet.name} has been finalized. Welcome to the family!`,
        action_url: "/MyAdoptedPets",
      });

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adoption-application"] });
      toast.success("Adoption finalized successfully!");
      setTimeout(() => navigate("/MyAdoptedPets"), 1500);
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-slate-600">Application not found.</p>
            <Button
              className="mt-4"
              onClick={() => navigate("/")}
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="bg-rose-600 text-white">
            <div className="flex items-center gap-3">
              <Heart className="w-6 h-6" />
              <CardTitle>Finalize Adoption</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Pet & Adopter Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-xs text-slate-500 uppercase">Pet</p>
                <p className="font-semibold text-lg text-slate-800">{pet?.name}</p>
                <p className="text-sm text-slate-600">{pet?.breed}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-xs text-slate-500 uppercase">Adopter</p>
                <p className="font-semibold text-lg text-slate-800">{application.adopter_name}</p>
                <p className="text-sm text-slate-600">{application.adopter_email}</p>
              </div>
            </div>

            {/* Finalization Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Adoption Finalization Date
              </label>
              <Input
                type="date"
                value={formData.finalization_date}
                onChange={(e) => setFormData({ ...formData, finalization_date: e.target.value })}
                className="border-slate-300"
              />
            </div>

            {/* Checklist */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
              <p className="font-semibold text-slate-800">Adoption Checklist</p>
              
              <div className="flex items-center gap-3">
                <Checkbox
                  id="fee"
                  checked={formData.adoption_fee_paid}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, adoption_fee_paid: checked })
                  }
                />
                <label htmlFor="fee" className="text-sm text-slate-700 cursor-pointer">
                  Adoption fee paid
                </label>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="contract"
                  checked={formData.adoption_contract_signed}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, adoption_contract_signed: checked })
                  }
                />
                <label htmlFor="contract" className="text-sm text-slate-700 cursor-pointer">
                  Adoption contract signed
                </label>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="microchip"
                  checked={formData.microchip_registered}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, microchip_registered: checked })
                  }
                />
                <label htmlFor="microchip" className="text-sm text-slate-700 cursor-pointer">
                  Microchip registered to adopter
                </label>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="insurance"
                  checked={formData.insurance_obtained}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, insurance_obtained: checked })
                  }
                />
                <label htmlFor="insurance" className="text-sm text-slate-700 cursor-pointer">
                  Pet insurance information provided
                </label>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-blue-900">
                <CheckCircle2 className="w-4 h-4 inline mr-2 text-blue-600" />
                Completing this will schedule automatic follow-up tasks for staff.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => finalizeMutation.mutate(formData)}
                disabled={finalizeMutation.isPending}
                className="flex-1 bg-rose-600 hover:bg-rose-700"
              >
                {finalizeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Finalizing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Finalize Adoption
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}