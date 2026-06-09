import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Globe, Building2 } from "lucide-react";

export default function OrgCard({ resource }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <Building2 className="w-6 h-6 text-emerald-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 mb-0.5">{resource.org_name || resource.title}</h3>
          {resource.summary && <p className="text-sm text-slate-500 mb-2">{resource.summary}</p>}
          <div className="space-y-1 text-xs text-slate-500">
            {resource.org_address && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{resource.org_address}{resource.org_city ? `, ${resource.org_city}` : ""}{resource.org_state ? `, ${resource.org_state}` : ""}</span>
              </div>
            )}
            {resource.org_phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{resource.org_phone}</span>
              </div>
            )}
            {resource.org_website && (
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                <a href={resource.org_website} target="_blank" rel="noopener noreferrer" className="text-violet-600 underline truncate">{resource.org_website}</a>
              </div>
            )}
          </div>
          {(resource.org_services || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {resource.org_services.map(s => (
                <Badge key={s} variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-0">{s}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}