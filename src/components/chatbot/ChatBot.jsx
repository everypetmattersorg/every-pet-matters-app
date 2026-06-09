import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, Send, Loader2, Bot, PawPrint } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const SYSTEM_CONTEXT = `You are PetFinder Assistant, a friendly AI helping users of PetFinder — a lost & found pet platform.
You help with:
- The adoption/reuniting process (how to report a lost/found pet, what info to include, etc.)
- Pet care tips tailored to specific breeds (exercise, diet, grooming, temperament)
- How to use the PetFinder app (browsing listings, setting up alerts, contacting reporters)
- General advice on what to do if you find or lost a pet

Keep answers concise and friendly. When relevant, mention these app pages: "Listings" (home page to browse pets), "Report Lost Pet", "Report Found Pet", "My Alerts" (to set up notifications for nearby pets).

IMPORTANT: If the user mentions a specific breed, pet type, or asks about finding a pet, always end your reply with a line formatted exactly like:
SHOW_PETS:pet_type=dog|breed=Golden Retriever
(replace dog/cat/etc and breed as appropriate; omit fields you don't know; use "any" for pet_type if unknown)
If no pet suggestion is relevant, do NOT include SHOW_PETS line.`;

const STARTER_QUESTIONS = [
  "How do I report a lost pet?",
  "What should I do if I find a stray dog?",
  "Tell me about Golden Retriever care",
  "How do pet alerts work?",
];

// Parse SHOW_PETS directive from AI reply
function parsePetSuggestion(text) {
  const match = text.match(/SHOW_PETS:([^\n]+)/);
  if (!match) return null;
  const params = {};
  match[1].split('|').forEach(part => {
    const [k, v] = part.split('=');
    if (k && v) params[k.trim()] = v.trim();
  });
  return params;
}

function cleanReply(text) {
  return text.replace(/SHOW_PETS:[^\n]*/g, '').trim();
}

function PetSuggestionCard({ pet }) {
  const emoji = { dog: '🐕', cat: '🐱', bird: '🐦', rabbit: '🐰', other: '🐾' }[pet.pet_type] || '🐾';
  return (
    <Link
      to={createPageUrl(`PetDetails?id=${pet.id}`)}
      className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-2 hover:border-rose-300 hover:bg-rose-50 transition-colors"
    >
      {pet.photo_url ? (
        <img src={pet.photo_url} alt={pet.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-lg flex-shrink-0">{emoji}</div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-800 truncate">{pet.name || pet.breed || pet.pet_type}</p>
        <p className="text-xs text-slate-500 truncate">{pet.location}</p>
      </div>
      <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${pet.status === 'lost' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
        {pet.status}
      </span>
    </Link>
  );
}

function PetSuggestionsMessage({ suggestion }) {
  const [pets, setPets] = useState(null);

  useEffect(() => {
    const fetchPets = async () => {
      const filter = {};
      if (suggestion.pet_type && suggestion.pet_type !== 'any') filter.pet_type = suggestion.pet_type;
      if (suggestion.status) filter.status = suggestion.status;
      let results = await base44.entities.Pet.filter(filter, '-created_date', 20);
      // Further filter by breed if specified
      if (suggestion.breed) {
        const breedLower = suggestion.breed.toLowerCase();
        results = results.filter(p =>
          p.breed?.toLowerCase().includes(breedLower) ||
          p.description?.toLowerCase().includes(breedLower)
        );
      }
      setPets(results.slice(0, 3));
    };
    fetchPets();
  }, []);

  if (!pets) return <Loader2 className="w-4 h-4 animate-spin text-slate-400" />;
  if (pets.length === 0) return <p className="text-xs text-slate-500 italic">No matching pets in listings right now.</p>;

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-slate-500 font-medium">Matching pets in listings:</p>
      {pets.map(pet => <PetSuggestionCard key={pet.id} pet={pet} />)}
      <Link
        to={createPageUrl('Home')}
        className="block text-center text-xs text-rose-600 font-medium hover:underline mt-1"
      >
        View all listings →
      </Link>
    </div>
  );
}

// Track browsing behavior via a simple module-level store
export const browsingTracker = {
  counts: {},
  record(petType) {
    this.counts[petType] = (this.counts[petType] || 0) + 1;
  },
  getMostBrowsed() {
    const entries = Object.entries(this.counts);
    if (!entries.length) return null;
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][1] >= 3 ? entries[0][0] : null;
  },
  reset() { this.counts = {}; }
};

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! 👋 I'm your PetFinder Assistant. I can help with the adoption process, pet care by breed, and how to use this app. What can I help you with?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(false);
  const bottomRef = useRef(null);
  const proactiveTimerRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  // Proactive trigger: after 30s, if user browsed a category 3+ times, nudge them
  useEffect(() => {
    proactiveTimerRef.current = setTimeout(() => {
      const mostBrowsed = browsingTracker.getMostBrowsed();
      if (mostBrowsed && !open) {
        setPulse(true);
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `I noticed you've been browsing ${mostBrowsed}s 🐾 Want me to help you find the perfect ${mostBrowsed}? I can share care tips or show you matching listings!`,
            petSuggestion: { pet_type: mostBrowsed }
          }
        ]);
        browsingTracker.reset();
      }
    }, 30000);
    return () => clearTimeout(proactiveTimerRef.current);
  }, []);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText) return;
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setLoading(true);

    const history = newMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
    const prompt = `${SYSTEM_CONTEXT}\n\nConversation so far:\n${history}\n\nAssistant:`;

    const rawReply = await base44.integrations.Core.InvokeLLM({ prompt });
    const petSuggestion = parsePetSuggestion(rawReply);
    const cleanedReply = cleanReply(rawReply);

    setMessages(prev => [...prev, { role: 'assistant', content: cleanedReply, petSuggestion }]);
    setLoading(false);
  };

  const handleOpen = () => {
    setOpen(o => !o);
    setPulse(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={handleOpen}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-xl shadow-rose-500/40 flex items-center justify-center hover:scale-105 transition-transform ${pulse ? 'animate-bounce' : ''}`}
        aria-label="Open chat"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {pulse && !open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-100" style={{ height: '500px' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">PetFinder Assistant</p>
              <p className="text-rose-100 text-xs">Always here to help</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] space-y-2 ${msg.role === 'user' ? 'items-end flex flex-col' : ''}`}>
                  <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-rose-500 text-white rounded-br-sm'
                      : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                  {msg.petSuggestion && (
                    <div className="w-full">
                      <PetSuggestionsMessage suggestion={msg.petSuggestion} />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Starter questions (only show at start) */}
          {messages.length === 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
              {STARTER_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs px-3 py-1.5 rounded-full border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-slate-100 flex gap-2 flex-shrink-0">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && sendMessage()}
              placeholder="Ask me anything..."
              className="flex-1 h-10 rounded-xl bg-slate-50 border-0 text-sm"
              disabled={loading}
            />
            <Button
              size="icon"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="h-10 w-10 rounded-xl bg-rose-500 hover:bg-rose-600 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}