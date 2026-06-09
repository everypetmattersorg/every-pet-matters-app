import { X, Check, AlertCircle, MapPin, Users, Briefcase, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ApplicationDetailModal({ application, onClose, onApprove, onReject }) {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    withdrawn: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-8 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="font-bold text-slate-900">Application from {application.applicant_name}</h2>
              <p className="text-sm text-slate-500">For {application.pet_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Status</span>
            <Badge className={statusColors[application.status]}>
              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
            </Badge>
          </div>

          {/* Contact Information */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-slate-900 text-sm">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 mb-1">Email</p>
                <p className="text-slate-900 break-all">{application.applicant_email}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Phone</p>
                <p className="text-slate-900">{application.applicant_phone}</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-500 mb-1">Address</p>
                <p className="text-slate-900">{application.address}</p>
              </div>
            </div>
          </div>

          {/* Living Situation */}
          <div className="bg-blue-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-slate-900 text-sm">Living Situation</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 mb-1">Type</p>
                <p className="text-slate-900 capitalize">{application.living_situation}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Own / Rent</p>
                <p className="text-slate-900 capitalize">{application.own_or_rent}</p>
              </div>
              {application.own_or_rent === "rent" && (
                <div className="col-span-2">
                  <p className="text-slate-500 mb-1">Landlord Allows Pets</p>
                  <p className="text-slate-900">{application.landlord_allows_pets ? "Yes" : "No"}</p>
                </div>
              )}
            </div>
          </div>

          {/* Household */}
          {(application.other_pets?.length > 0 || application.children_ages?.length > 0) && (
            <div className="bg-purple-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <h3 className="font-semibold text-slate-900 text-sm">Household</h3>
              </div>
              {application.children_ages?.length > 0 && (
                <div className="text-sm">
                  <p className="text-slate-500 mb-1">Children Ages</p>
                  <p className="text-slate-900">{application.children_ages.join(", ")}</p>
                </div>
              )}
              {application.other_pets?.length > 0 && (
                <div className="text-sm">
                  <p className="text-slate-500 mb-1">Other Pets</p>
                  <ul className="text-slate-900 space-y-1">
                    {application.other_pets.map((pet, idx) => (
                      <li key={idx} className="text-xs">
                        {pet.type} - {pet.name} ({pet.age}) - {pet.temperament}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Experience */}
          <div className="bg-amber-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-amber-600" />
              <h3 className="font-semibold text-slate-900 text-sm">Experience & Commitment</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500 mb-1">Work Schedule & Pet Care</p>
                <p className="text-slate-900">{application.work_schedule}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Pet Experience</p>
                <p className="text-slate-900">{application.pet_experience}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Expectations</p>
                <p className="text-slate-900">{application.adoption_expectations}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Commitment</p>
                <p className="text-slate-900">{application.commitment}</p>
              </div>
            </div>
          </div>

          {/* References */}
          {(application.vet_references?.length > 0 || application.personal_references?.length > 0) && (
            <div className="bg-green-50 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-slate-900 text-sm">References</h3>
              {application.vet_references?.length > 0 && (
                <div className="text-sm">
                  <p className="text-slate-500 mb-2">Veterinary References</p>
                  <ul className="space-y-1">
                    {application.vet_references.map((ref, idx) => (
                      <li key={idx} className="text-slate-900 text-xs">
                        {ref.name} - {ref.phone}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {application.personal_references?.length > 0 && (
                <div className="text-sm">
                  <p className="text-slate-500 mb-2">Personal References</p>
                  <ul className="space-y-1">
                    {application.personal_references.map((ref, idx) => (
                      <li key={idx} className="text-slate-900 text-xs">
                        {ref.name} - {ref.phone}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Internal Notes */}
          {application.notes && (
            <div className="bg-red-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <h3 className="font-semibold text-slate-900 text-sm">Internal Notes</h3>
              </div>
              <p className="text-sm text-slate-900">{application.notes}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {application.status === "pending" && (
          <div className="flex gap-3 p-6 border-t border-slate-200">
            <Button onClick={onClose} variant="outline" className="flex-1 rounded-xl">
              Close
            </Button>
            <Button
              onClick={onReject}
              variant="destructive"
              className="flex-1 rounded-xl gap-2"
            >
              <X className="w-4 h-4" /> Reject
            </Button>
            <Button
              onClick={onApprove}
              className="flex-1 bg-green-600 hover:bg-green-700 rounded-xl gap-2"
            >
              <Check className="w-4 h-4" /> Approve
            </Button>
          </div>
        )}
        {application.status !== "pending" && (
          <div className="flex gap-3 p-6 border-t border-slate-200">
            <Button onClick={onClose} variant="outline" className="w-full rounded-xl">
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}