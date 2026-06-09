import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, MessageCircle, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import FosterMessagesThread from "./FosterMessagesThread";
import { format } from "date-fns";

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-700",
  reviewing: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-700",
};

const STATUS_ICONS = {
  pending: Clock,
  reviewing: Eye,
  approved: CheckCircle,
  declined: XCircle,
};

export default function FosterApplicationCard({ application, currentUser, isRescue, onUpdated }) {
  const [expanded, setExpanded] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [notes, setNotes] = useState(application.rescue_notes || "");

  const Icon = STATUS_ICONS[application.status] || Clock;
  const unreadCount = (application.messages || []).filter(
    m => m.sender_email !== currentUser.email
  ).length;

  const updateStatus = async (status) => {
    setUpdatingStatus(true);
    await base44.entities.FosterApplication.update(application.id, { status, rescue_notes: notes });
    setUpdatingStatus(false);
    if (onUpdated) onUpdated({ ...application, status, rescue_notes: notes });
  };

  const saveNotes = async () => {
    await base44.entities.FosterApplication.update(application.id, { rescue_notes: notes });
    if (onUpdated) onUpdated({ ...application, rescue_notes: notes });
  };

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Header row */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-lg shrink-0">
              {application.applicant_name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 truncate">{application.applicant_name}</p>
              <p className="text-xs text-slate-500 truncate">{application.applicant_email}</p>
              {application.pet_name && (
                <p className="text-xs text-rose-600">🐾 For: {application.pet_name}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[application.status]}`}>
              <Icon className="w-3 h-3" />
              {application.status}
            </span>
            <span className="text-xs text-slate-400 hidden sm:block">
              {application.created_date ? format(new Date(application.created_date), "MMM d") : ""}
            </span>
            <button onClick={() => setMsgOpen(true)} className="relative p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
              <MessageCircle className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <button onClick={() => setExpanded(e => !e)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div><span className="text-slate-500">Home:</span> <span className="font-medium">{application.home_type || "—"}</span></div>
              <div><span className="text-slate-500">Yard:</span> <span className="font-medium">{application.has_yard ? "Yes" : "No"}</span></div>
              <div><span className="text-slate-500">Experience:</span> <span className="font-medium">{application.experience_level || "—"}</span></div>
              <div><span className="text-slate-500">Other Pets:</span> <span className="font-medium">{application.has_other_pets ? "Yes" : "No"}</span></div>
              <div><span className="text-slate-500">Children:</span> <span className="font-medium">{application.has_children ? "Yes" : "No"}</span></div>
              <div><span className="text-slate-500">Special Needs:</span> <span className="font-medium">{application.can_foster_special_needs ? "Yes" : "No"}</span></div>
              {application.availability_start && (
                <div><span className="text-slate-500">Available:</span> <span className="font-medium">{application.availability_start}</span></div>
              )}
              {application.max_duration_weeks && (
                <div><span className="text-slate-500">Max weeks:</span> <span className="font-medium">{application.max_duration_weeks}</span></div>
              )}
            </div>
            {application.has_other_pets && application.other_pets_description && (
              <div><p className="text-xs text-slate-500 mb-1">Other pets:</p><p className="text-sm text-slate-700">{application.other_pets_description}</p></div>
            )}
            {application.motivation && (
              <div><p className="text-xs text-slate-500 mb-1">Motivation:</p><p className="text-sm text-slate-700">{application.motivation}</p></div>
            )}

            {/* Rescue actions */}
            {isRescue && (
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Internal Notes</label>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="min-h-[60px] text-sm" placeholder="Private notes about this applicant..." />
                  <Button size="sm" variant="outline" className="mt-2" onClick={saveNotes}>Save Notes</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    disabled={updatingStatus} onClick={() => updateStatus("reviewing")}>Mark Reviewing</Button>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700"
                    disabled={updatingStatus} onClick={() => updateStatus("approved")}>Approve</Button>
                  <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50"
                    disabled={updatingStatus} onClick={() => updateStatus("declined")}>Decline</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Messages Dialog */}
      <Dialog open={msgOpen} onOpenChange={setMsgOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Messages with {isRescue ? application.applicant_name : application.rescue_name}
            </DialogTitle>
          </DialogHeader>
          <FosterMessagesThread
            application={application}
            currentUser={currentUser}
            onUpdated={(updated) => { if (onUpdated) onUpdated(updated); }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}