import { Textarea } from "@/components/ui/textarea";
import { Lightbulb } from "lucide-react";

export default function PromotionalStep({ formData, onUpdate }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Promotional Description</h2>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
        <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          Use this to create excitement! Mention special activities, meet-and-greets, special guests, or incentives.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Promotional Description *
        </label>
        <Textarea
          placeholder="Make it enticing! Example: 'Join us for our annual adoption fair! Meet dozens of loving dogs and cats waiting for their forever homes. Special activities for kids, local food vendors, and instant adoption opportunities. Don't miss out!'"
          value={formData.promotional_description}
          onChange={(e) => onUpdate("promotional_description", e.target.value)}
          className="h-32"
        />
        <div className="flex justify-between mt-2">
          <p className="text-xs text-slate-500">Used when promoting your event</p>
          <p className="text-xs text-slate-500">{formData.promotional_description.length} characters</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-medium text-blue-900 mb-2">Preview:</p>
        <p className="text-sm text-blue-800 italic">
          {formData.promotional_description || "Your promotional description will appear here..."}
        </p>
      </div>
    </div>
  );
}