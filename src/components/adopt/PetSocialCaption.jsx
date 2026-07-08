import { useState } from "react";
import { Sparkles, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const TYPES = [
  { value: "adopt", label: "Adopt / Foster", emoji: "🏠" },
  { value: "rescue", label: "Rescue Needed", emoji: "🚨" },
];

export default function PetSocialCaption({ pet }) {
  const [captionType, setCaptionType] = useState("adopt");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    setCaption("");
    try {
      const typeLabel = captionType === "rescue" ? "urgently needs rescue" : "is available for adoption or fostering";
      const prompt = `Write an engaging social media caption for a pet named ${pet.name} who ${typeLabel}.
Pet details: species: ${pet.species || "unknown"}, breed: ${pet.breed || "unknown"}, age: ${pet.age_years ? `${pet.age_years} years` : pet.age || "unknown"}, gender: ${pet.gender || "unknown"}, location: ${pet.rescue_city ? `${pet.rescue_city}, ${pet.rescue_state}` : "Arizona"}.${pet.description ? ` About them: ${pet.description.slice(0, 200)}` : ""}
Write a warm, shareable caption under 280 characters with 2-3 relevant emojis and a call to action. Return only the caption text, nothing else.`;

      const res = await fetch('/api/invoke-llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setCaption(data.result || "Could not generate caption. Please try again.");
    } catch {
      setCaption("Could not generate caption. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border rounded-xl p-4 space-y-3" style={{ borderColor: '#DEC0AA', background: '#FDF0E8' }}>
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4" style={{ color: '#A33407' }} />
        <h3 className="font-semibold text-slate-800 text-sm">generate your social caption</h3>
      </div>

      {/* Type Toggle */}
      <div className="flex gap-2">
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => { setCaptionType(t.value); setCaption(""); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-sm font-medium border transition-all ${
              captionType === t.value
                ? "text-white border-2"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
            style={captionType === t.value ? { background: '#A33407', borderColor: '#A33407' } : {}}
          >
            <span>{t.emoji}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Generate Button */}
      {!caption && (
        <Button
          onClick={generate}
          disabled={loading}
          className="w-full rounded-lg gap-2 text-sm text-white"
          style={{ background: '#A33407' }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "Generating..." : "Generate Caption"}
        </Button>
      )}

      {/* Caption Output */}
      {caption && (
        <div className="space-y-2">
          <div className="bg-white border rounded-lg p-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap" style={{ borderColor: '#DEC0AA' }}>
            {caption}
          </div>
          <div className="flex gap-2">
            <Button
             onClick={copy}
             variant="outline"
             className="flex-1 rounded-lg gap-2 text-sm"
             style={{ borderColor: '#DEC0AA', color: '#A33407' }}
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy Caption"}
            </Button>
            <Button
             onClick={generate}
             disabled={loading}
             variant="outline"
             className="rounded-lg gap-2 text-sm"
             style={{ borderColor: '#DEC0AA', color: '#A33407' }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Regenerate
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}