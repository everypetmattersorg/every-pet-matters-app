import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar } from "lucide-react";

export default function ResourceArticleCard({ resource, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
    >
      {resource.photo_url ? (
        <img src={resource.photo_url} alt={resource.title} className="w-full h-44 object-cover" />
      ) : (
        <div className="w-full h-44 bg-gradient-to-br from-violet-100 to-rose-100 flex items-center justify-center">
          <BookOpen className="w-12 h-12 text-violet-300" />
        </div>
      )}
      <div className="p-5">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {(resource.tags || []).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs bg-violet-50 text-violet-700 border-0">{tag}</Badge>
          ))}
        </div>
        <h3 className="font-semibold text-slate-800 text-base leading-snug mb-2 line-clamp-2">{resource.title}</h3>
        {resource.summary && (
          <p className="text-sm text-slate-500 line-clamp-2 mb-3">{resource.summary}</p>
        )}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          <span>{new Date(resource.created_date).toLocaleDateString()}</span>
          {resource.author_name && <span>· {resource.author_name}</span>}
        </div>
      </div>
    </div>
  );
}