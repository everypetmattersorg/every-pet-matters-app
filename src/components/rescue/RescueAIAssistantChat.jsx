import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send } from 'lucide-react';
import MessageBubble from '@/components/agents/MessageBubble';

export default function RescueAIAssistantChat({ rescueEmail }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize conversation
  useEffect(() => {
    if (rescueEmail && !initialized) {
      initializeConversation();
    }
  }, [rescueEmail, initialized]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeConversation = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: 'rescueAIAssistant',
        metadata: {
          name: 'Rescue AI Assistant',
          description: 'AI assistance for pet descriptions, social media, and matching',
        },
      });
      setConversation(conv);
      setMessages(conv.messages || []);
      subscribeToUpdates(conv.id);
      setInitialized(true);
    } catch (err) {
      console.error('Failed to initialize conversation:', err);
    }
  };

  const subscribeToUpdates = (conversationId) => {
    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      setMessages(data.messages || []);
    });
    return unsubscribe;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !conversation) return;

    try {
      setLoading(true);
      const userMessage = input.trim();
      setInput('');

      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: userMessage,
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[500px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <div className="text-4xl mb-3">✨</div>
              <p className="text-slate-600">Start a conversation to get assistance with your rescue operations!</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <MessageBubble key={idx} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me to generate a pet description, draft a post, or find matches..."
            disabled={loading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}