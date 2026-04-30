import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Send, X, Bot, User, Sparkles, 
  Image as ImageIcon, Video, Music, Mic, Volume2, 
  Search, MapPin, Brain, Loader2, Paperclip,
  Maximize2, Minimize2, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import { 
  chatWithGemini, searchGrounding, mapsGrounding, 
  analyzeImage, generateImage, generateVideo, 
  generateMusic, textToSpeech, complexReasoning 
} from '@/services/gemini';
import { cn } from '@/lib/utils';
import { db, collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot, where } from '../firebase';
import { useAuth } from './AuthProvider';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'image' | 'video' | 'audio' | 'search' | 'maps' | 'thinking';
  metadata?: any;
  timestamp?: any;
}

import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export function NetworkAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'chat' | 'search' | 'maps' | 'image' | 'video' | 'music' | 'thinking'>('chat');
  const [attachedFile, setAttachedFile] = useState<{ data: string; type: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chats', user.uid, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `chats/${user.uid}/messages`);
    });

    return () => unsubscribe();
  }, [user]);

  const saveMessage = async (message: Omit<Message, 'id'>) => {
    if (!user) return;
    await addDoc(collection(db, 'chats', user.uid, 'messages'), {
      ...message,
      timestamp: serverTimestamp()
    });
  };

  const handleSend = async () => {
    if (!input.trim() && !attachedFile) return;

    const userMessage: Omit<Message, 'id'> = {
      role: 'user',
      content: input,
      type: attachedFile ? 'image' : 'text',
      metadata: attachedFile ? { image: attachedFile.data } : undefined
    };

    await saveMessage(userMessage);
    setInput('');
    setAttachedFile(null);
    setIsLoading(true);

    try {
      let response;
      const systemInstruction = "You are the Network AI Assistant for a large-scale infrastructure management platform. You help network engineers monitor, troubleshoot, and optimize their data centers and branch offices. You have access to real-time telemetry, site maps, and technical documentation.";

      if (attachedFile) {
        response = await analyzeImage(input || "Analyze this infrastructure image.", attachedFile.data.split(',')[1], attachedFile.type);
      } else if (mode === 'search') {
        response = await searchGrounding(input);
      } else if (mode === 'maps') {
        response = await mapsGrounding(input);
      } else if (mode === 'thinking') {
        response = await complexReasoning(input);
      } else if (mode === 'image') {
        const imageUrl = await generateImage(input);
        if (imageUrl) {
          await saveMessage({
            role: 'assistant',
            content: `Generated image for: ${input}`,
            type: 'image',
            metadata: { url: imageUrl }
          });
          setIsLoading(false);
          return;
        }
      } else if (mode === 'video') {
        const videoUrl = await generateVideo(input);
        if (videoUrl) {
          await saveMessage({
            role: 'assistant',
            content: `Generated video for: ${input}`,
            type: 'video',
            metadata: { url: videoUrl }
          });
          setIsLoading(false);
          return;
        }
      } else if (mode === 'music') {
        const musicUrl = await generateMusic(input);
        if (musicUrl) {
          await saveMessage({
            role: 'assistant',
            content: `Generated music for: ${input}`,
            type: 'audio',
            metadata: { url: musicUrl }
          });
          setIsLoading(false);
          return;
        }
      } else {
        response = await chatWithGemini(input, messages, systemInstruction);
      }

      const assistantMessage: Omit<Message, 'id'> = {
        role: 'assistant',
        content: response?.text || "I'm sorry, I couldn't process that request.",
        type: mode === 'thinking' ? 'thinking' : 'text',
        metadata: response?.candidates?.[0]?.groundingMetadata
      };

      await saveMessage(assistantMessage);
    } catch (error) {
      console.error("Gemini Error:", error);
      await saveMessage({
        role: 'assistant',
        content: "An error occurred while processing your request. Please check your API key and configuration."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedFile({
          data: event.target?.result as string,
          type: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const playTTS = async (text: string) => {
    const audioUrl = await textToSpeech(text);
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl z-50 transition-all duration-300",
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
      >
        <Bot className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary border-2 border-background rounded-full animate-pulse" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              "fixed z-50 bg-background border shadow-2xl overflow-hidden flex flex-col transition-all duration-300",
              isMaximized 
                ? "inset-6 rounded-2xl" 
                : "bottom-6 right-6 w-[400px] h-[600px] rounded-xl"
            )}
          >
            {/* Header */}
            <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Network AI Assistant</h3>
                  <div className="flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Gemini 3.1 Pro</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="icon" onClick={() => setIsMaximized(!isMaximized)} className="h-8 w-8">
                  {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Mode Selector */}
            <div className="flex items-center space-x-1 p-2 bg-muted/10 border-b overflow-x-auto no-scrollbar">
              {[
                { id: 'chat', icon: MessageSquare, label: 'Chat' },
                { id: 'search', icon: Search, label: 'Search' },
                { id: 'maps', icon: MapPin, label: 'Maps' },
                { id: 'thinking', icon: Brain, label: 'Thinking' },
                { id: 'image', icon: ImageIcon, label: 'Image' },
                { id: 'video', icon: Video, label: 'Video' },
                { id: 'music', icon: Music, label: 'Music' },
              ].map((m) => (
                <Button
                  key={m.id}
                  variant={mode === m.id ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setMode(m.id as any)}
                  className="h-7 text-[10px] px-2 flex-shrink-0"
                >
                  <m.icon className="w-3 h-3 mr-1" />
                  {m.label}
                </Button>
              ))}
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 p-8">
                  <div className="p-4 bg-primary/5 rounded-full">
                    <Sparkles className="w-12 h-12 text-primary/40" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-lg">How can I help you today?</h4>
                    <p className="text-sm text-muted-foreground">
                      I can analyze network diagrams, search for hardware specs, 
                      troubleshoot connectivity, or even generate custom alert tones.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <Button variant="outline" size="sm" className="text-[10px]" onClick={() => setInput("What's the latest firmware for Cisco Catalyst 9500?")}>
                      Check Firmware
                    </Button>
                    <Button variant="outline" size="sm" className="text-[10px]" onClick={() => setInput("Analyze the health of DC-A infrastructure.")}>
                      Health Audit
                    </Button>
                  </div>
                </div>
              )}

              {messages.map((m) => (
                <div key={m.id} className={cn(
                  "flex items-start space-x-3",
                  m.role === 'user' ? "flex-row-reverse space-x-reverse" : ""
                )}>
                  <div className={cn(
                    "p-2 rounded-lg",
                    m.role === 'user' ? "bg-primary/10" : "bg-muted"
                  )}>
                    {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={cn(
                    "max-w-[85%] space-y-2",
                    m.role === 'user' ? "items-end" : "items-start"
                  )}>
                    <Card className={cn(
                      "p-3 text-sm shadow-sm",
                      m.role === 'user' ? "bg-primary text-primary-foreground" : "bg-background"
                    )}>
                      {m.type === 'image' && m.metadata?.url && (
                        <img src={m.metadata.url} alt="Generated" className="rounded-lg mb-2 max-w-full" />
                      )}
                      {m.type === 'video' && m.metadata?.url && (
                        <video src={m.metadata.url} controls className="rounded-lg mb-2 max-w-full" />
                      )}
                      {m.type === 'audio' && m.metadata?.url && (
                        <audio src={m.metadata.url} controls className="w-full mb-2" />
                      )}
                      {m.metadata?.image && (
                        <img src={m.metadata.image} alt="Uploaded" className="rounded-lg mb-2 max-w-full opacity-80" />
                      )}
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                      {m.metadata?.groundingChunks && (
                        <div className="mt-2 pt-2 border-t border-muted-foreground/20 space-y-1">
                          <p className="text-[10px] font-bold uppercase opacity-60">Sources:</p>
                          {m.metadata.groundingChunks.map((chunk: any, i: number) => (
                            <a 
                              key={i} 
                              href={chunk.web?.uri || chunk.maps?.uri} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block text-[10px] text-blue-500 hover:underline truncate"
                            >
                              {chunk.web?.title || chunk.maps?.title || 'Grounding Source'}
                            </a>
                          ))}
                        </div>
                      )}
                    </Card>
                    {m.role === 'assistant' && (
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => playTTS(m.content)}>
                          <Volume2 className="w-3 h-3" />
                        </Button>
                        <span className="text-[8px] text-muted-foreground uppercase font-bold">
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Bot className="w-4 h-4" />
                  </div>
                  <Card className="p-3 bg-background shadow-sm flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">
                      {mode === 'thinking' ? 'Deep reasoning in progress...' : 'Gemini is processing...'}
                    </span>
                  </Card>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-background">
              {attachedFile && (
                <div className="mb-2 p-2 bg-muted rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-medium truncate max-w-[200px]">Image attached</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAttachedFile(null)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
              <div className="flex items-end space-x-2">
                <div className="flex-1 relative">
                  <textarea
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={
                      mode === 'image' ? 'Describe the image to generate...' :
                      mode === 'video' ? 'Describe the video to generate...' :
                      mode === 'music' ? 'Describe the music to generate...' :
                      'Type your message...'
                    }
                    className="w-full pl-3 pr-10 py-2 bg-muted/50 rounded-lg border text-sm outline-none resize-none min-h-[40px] max-h-[120px]"
                  />
                  <div className="absolute right-2 bottom-2 flex items-center space-x-1">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileUpload} 
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => fileInputRef.current?.click()}>
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Mic className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Button size="icon" className="h-10 w-10 shrink-0" onClick={handleSend} disabled={isLoading}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-[8px] text-muted-foreground uppercase font-bold">
                  Mode: <span className="text-primary">{mode}</span>
                </p>
                <Button variant="ghost" size="sm" className="h-5 text-[8px] uppercase font-bold" onClick={() => setMessages([])}>
                  <Trash2 className="w-3 h-3 mr-1" /> Clear Chat
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
