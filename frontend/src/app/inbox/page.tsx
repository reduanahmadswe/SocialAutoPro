'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useMessages, useSendReply, useAutoReplyRules } from '@/lib/hooks';
import type { FbMessage, Conversation } from '@/types';
import { cn, formatRelativeTime } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Send,
  Search,
  MessageSquare,
  Bot,
  User,
  RefreshCw,
} from 'lucide-react';

export default function InboxPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messagesRes, isLoading, refetch } = useMessages({ limit: 200 });
  const sendReply = useSendReply();
  const { data: rulesRes } = useAutoReplyRules();

  const messages = messagesRes?.data || [];

  // Derive conversations from messages
  const conversations = useMemo(() => {
    const convMap = new Map<string, Conversation>();
    messages.forEach((msg: FbMessage) => {
      const existing = convMap.get(msg.sender_id);
      if (
        !existing ||
        new Date(msg.created_at) > new Date(existing.last_message_at)
      ) {
        convMap.set(msg.sender_id, {
          sender_id: msg.sender_id,
          sender_name: msg.sender_name,
          last_message: msg.message_text,
          last_message_at: msg.created_at,
          unread_count: (existing?.unread_count || 0) + (!msg.replied && msg.direction === 'incoming' ? 1 : 0),
          direction: msg.direction,
        });
      }
    });
    return Array.from(convMap.values()).sort(
      (a, b) =>
        new Date(b.last_message_at).getTime() -
        new Date(a.last_message_at).getTime()
    );
  }, [messages]);

  const filteredConversations = conversations.filter(
    (c) =>
      !searchQuery ||
      c.sender_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.sender_id.includes(searchQuery)
  );

  const threadMessages = useMemo(
    () =>
      messages
        .filter((m: FbMessage) => m.sender_id === selectedConversation)
        .sort(
          (a: FbMessage, b: FbMessage) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ),
    [messages, selectedConversation]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedConversation) return;
    sendReply.mutate(
      { sender_id: selectedConversation, message: replyText.trim() },
      { onSuccess: () => setReplyText('') }
    );
  };

  const autoReplyActive = (rulesRes?.data || []).some((r) => r.is_active);

  return (
    <div className="flex h-[calc(100vh-10rem)] gap-4 animate-fade-in">
      {/* Conversations Sidebar */}
      <div className="w-80 shrink-0 flex flex-col border rounded-lg bg-card">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Conversations
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant={autoReplyActive ? 'success' : 'secondary'} className="text-xs">
                <Bot className="h-3 w-3 mr-1" />
                {autoReplyActive ? 'Auto ON' : 'Auto OFF'}
              </Badge>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetch()}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No conversations</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.sender_id}
                  onClick={() => setSelectedConversation(conv.sender_id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                    selectedConversation === conv.sender_id
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-accent'
                  )}
                >
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">
                        {conv.sender_name || conv.sender_id}
                      </p>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {formatRelativeTime(conv.last_message_at)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {conv.direction === 'outgoing' && (
                        <span className="text-primary">You: </span>
                      )}
                      {conv.last_message}
                    </p>
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {conv.unread_count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Message Thread */}
      <div className="flex-1 flex flex-col border rounded-lg bg-card">
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Choose from the sidebar to view messages</p>
            </div>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="flex items-center gap-3 p-4 border-b">
              <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">
                  {conversations.find((c) => c.sender_id === selectedConversation)
                    ?.sender_name || selectedConversation}
                </p>
                <p className="text-xs text-muted-foreground">
                  ID: {selectedConversation}
                </p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {threadMessages.map((msg: FbMessage) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex',
                      msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[70%] rounded-2xl px-4 py-2.5 text-sm',
                        msg.direction === 'outgoing'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted rounded-bl-md'
                      )}
                    >
                      <p>{msg.message_text}</p>
                      <p
                        className={cn(
                          'text-[10px] mt-1',
                          msg.direction === 'outgoing'
                            ? 'text-primary-foreground/60'
                            : 'text-muted-foreground'
                        )}
                      >
                        {formatRelativeTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Reply Box */}
            <div className="p-4 border-t">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendReply();
                }}
                className="flex items-center gap-2"
              >
                <Input
                  placeholder="Type a message..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1"
                  disabled={sendReply.isPending}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!replyText.trim() || sendReply.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
