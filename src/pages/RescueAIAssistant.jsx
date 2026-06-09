import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft, Send, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import MessageBubble from '@/components/agents/MessageBubble';

export default function RescueAIAssistant() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch user
  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoadingUser(false));
  }, []);

  // Initialize conversation
  useEffect(() => {
    if (user && !initialized) {
      initializeConversation();
    }
  }, [user, initialized]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeConversation = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: 'rescueAIAssistant',
        metadata: {
          name: `${user.full_name || 'Rescue'} AI Assistant`,
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

      // Messages will update via subscription
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'rescue' && user.role !== 'shelter')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
          <p className="text-slate-600 mb-4">Only shelters and rescues can access the AI Assistant.</p>
          <Link to={createPageUrl('Home')}>
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link to={createPageUrl('RescueDashboard')}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">AI Assistant</h1>
              <p className="text-sm text-slate-600">Generate descriptions, draft posts, and find matches</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="max-w-4xl mx-auto w-full px-4 py-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900 font-medium mb-2">💡 What I can help with:</p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✨ Generate compelling pet descriptions to attract adopters</li>
            <li>📱 Draft engaging social media posts about adoptions and events</li>
            <li>💑 Suggest potential matches between pets and adoption applicants</li>
          </ul>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 pb-6">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 h-[500px] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
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
      </div>
    </div>
  );
}