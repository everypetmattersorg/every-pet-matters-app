import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Calendar, User } from "lucide-react";

export default function ArticleModal({ resource, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        {resource.photo_url && (
          <img src={resource.photo_url} alt={resource.title} className="w-full h-52 object-cover rounded-t-2xl" />
        )}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h2 className="text-2xl font-bold text-slate-800">{resource.title}</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg flex-shrink-0"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
            {resource.author_name && (
              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{resource.author_name}</span>
            )}
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(resource.created_date).toLocaleDateString()}</span>
          </div>
          {(resource.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {resource.tags.map(t => <Badge key={t} variant="secondary" className="bg-violet-50 text-violet-700 border-0">{t}</Badge>)}
            </div>
          )}
          <div className="prose prose-slate max-w-none text-sm">
            <ReactMarkdown>{resource.content || resource.summary || ""}</ReactMarkdown>
          </div>
          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
}