import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function FosterMessagesThread({ application, currentUser, onUpdated }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const messages = application.messages || [];

  const sendMessage = async () => {
    if (!message.trim()) return;
    setSending(true);
    const newMsg = {
      sender_email: currentUser.email,
      sender_name: currentUser.full_name || currentUser.email,
      content: message.trim(),
      timestamp: new Date().toISOString(),
    };
    const updated = [...messages, newMsg];
    await base44.entities.FosterApplication.update(application.id, { messages: updated });
    setMessage("");
    setSending(false);
    if (onUpdated) onUpdated({ ...application, messages: updated });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4" style={{ maxHeight: 320 }}>
        {messages.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-8">No messages yet. Start the conversation!</p>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.sender_email === currentUser.email;
          return (
            <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isMe ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-800"}`}>
                {!isMe && <p className="text-xs font-semibold mb-1 opacity-70">{msg.sender_name}</p>}
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p className={`text-xs mt-1 ${isMe ? "text-rose-200" : "text-slate-400"}`}>
                  {msg.timestamp ? format(new Date(msg.timestamp), "MMM d, h:mm a") : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <Textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="min-h-[60px] resize-none"
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
        />
        <Button className="bg-rose-500 hover:bg-rose-600 px-3 h-auto" onClick={sendMessage} disabled={!message.trim() || sending}>
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}