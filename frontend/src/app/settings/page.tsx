'use client';

import { useState } from 'react';
import {
  useAutoReplyRules,
  useCreateAutoReplyRule,
  useUpdateAutoReplyRule,
  useDeleteAutoReplyRule,
  useTokenHealth,
  useRunTokenHealthCheck,
} from '@/lib/hooks';
import type { FbAutoReplyRule } from '@/types';
import { maskToken } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Bot,
  Plus,
  Trash2,
  Edit,
  Send,
  Key,
  Globe,
  Shield,
  Settings,
  MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sendReply } from '@/lib/api';

export default function SettingsPage() {
  const { data: rulesRes, isLoading: rulesLoading } = useAutoReplyRules();
  const { data: tokenRes } = useTokenHealth();
  const createRule = useCreateAutoReplyRule();
  const updateRule = useUpdateAutoReplyRule();
  const deleteRule = useDeleteAutoReplyRule();
  const runCheck = useRunTokenHealthCheck();

  const rules = rulesRes?.data || [];
  const token = tokenRes?.data;

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editRule, setEditRule] = useState<FbAutoReplyRule | null>(null);
  const [newKeyword, setNewKeyword] = useState('');
  const [newReply, setNewReply] = useState('');
  const [editKeyword, setEditKeyword] = useState('');
  const [editReply, setEditReply] = useState('');
  const [testSenderId, setTestSenderId] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [sending, setSending] = useState(false);

  const fallbackRule = rules.find((r) => r.is_default);

  const handleAddRule = () => {
    if (!newKeyword.trim() || !newReply.trim()) return;
    createRule.mutate(
      { keyword: newKeyword.trim(), reply_text: newReply.trim() },
      {
        onSuccess: () => {
          setNewKeyword('');
          setNewReply('');
          setAddDialogOpen(false);
        },
      }
    );
  };

  const handleEditRule = () => {
    if (!editRule) return;
    updateRule.mutate(
      {
        id: editRule.id,
        keyword: editKeyword.trim() || undefined,
        reply_text: editReply.trim() || undefined,
      },
      {
        onSuccess: () => setEditRule(null),
      }
    );
  };

  const handleToggleRule = (rule: FbAutoReplyRule) => {
    updateRule.mutate({
      id: rule.id,
      is_active: !rule.is_active,
    });
  };

  const handleTestSend = async () => {
    if (!testSenderId.trim() || !testMessage.trim()) return;
    try {
      setSending(true);
      await sendReply(testSenderId.trim(), testMessage.trim());
      toast.success('Test message sent');
      setTestMessage('');
    } catch {
      toast.error('Failed to send test message');
    } finally {
      setSending(false);
    }
  };

  const pageId = process.env.NEXT_PUBLIC_FB_PAGE_ID || 'Configured in backend';

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <p className="text-muted-foreground">
        Configure your automation settings, keyword rules, and integrations.
      </p>

      {/* Auto-Reply Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Auto-Reply</CardTitle>
                <CardDescription>
                  Automatically respond to incoming messages based on keyword
                  rules
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  rules.some((r) => r.is_active) ? 'success' : 'secondary'
                }
              >
                {rules.some((r) => r.is_active) ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Keyword Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Keyword Rules
              </CardTitle>
              <CardDescription>
                Define keywords and their auto-reply messages
              </CardDescription>
            </div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Keyword Rule</DialogTitle>
                  <DialogDescription>
                    Create a new auto-reply rule for incoming messages
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Keyword</Label>
                    <Input
                      placeholder="e.g., pricing, hello, help"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Reply Message</Label>
                    <Textarea
                      placeholder="The auto-reply message..."
                      value={newReply}
                      onChange={(e) => setNewReply(e.target.value)}
                      className="mt-1.5"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddRule}
                    disabled={
                      !newKeyword.trim() ||
                      !newReply.trim() ||
                      createRule.isPending
                    }
                  >
                    Create Rule
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {rulesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>No keyword rules configured</p>
              <p className="text-sm">Add rules to enable auto-replies</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Keyword</TableHead>
                  <TableHead>Reply</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium font-mono text-sm">
                      {rule.keyword}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">
                      {rule.reply_text}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={rule.is_default ? 'default' : 'secondary'}
                      >
                        {rule.is_default ? 'Fallback' : 'Keyword'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() => handleToggleRule(rule)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditRule(rule);
                            setEditKeyword(rule.keyword);
                            setEditReply(rule.reply_text);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!rule.is_default && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteRule.mutate(rule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Rule Dialog */}
      <Dialog
        open={!!editRule}
        onOpenChange={(open) => !open && setEditRule(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Rule</DialogTitle>
            <DialogDescription>
              Update the keyword and reply message
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Keyword</Label>
              <Input
                value={editKeyword}
                onChange={(e) => setEditKeyword(e.target.value)}
                className="mt-1.5"
                disabled={editRule?.is_default}
              />
            </div>
            <div>
              <Label>Reply Message</Label>
              <Textarea
                value={editReply}
                onChange={(e) => setEditReply(e.target.value)}
                className="mt-1.5"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRule(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditRule}
              disabled={updateRule.isPending}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fallback Message */}
      {fallbackRule && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fallback Message</CardTitle>
            <CardDescription>
              Default reply when no keyword matches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm">{fallbackRule.reply_text}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Edit this in the keyword rules table above
            </p>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Page & Token Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Page Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <Label className="text-xs text-muted-foreground">Page ID</Label>
              <p className="font-mono text-sm mt-1">{pageId}</p>
            </div>
            <div className="rounded-lg border p-4">
              <Label className="text-xs text-muted-foreground">
                Token Status
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={token?.isValid ? 'success' : 'destructive'}>
                  {token?.isValid ? 'Valid' : 'Invalid'}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7"
                  onClick={() => runCheck.mutate()}
                  disabled={runCheck.isPending}
                >
                  Verify
                </Button>
              </div>
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <Label className="text-xs text-muted-foreground">
              Access Token (masked)
            </Label>
            <p className="font-mono text-sm mt-1 break-all">
              {maskToken(token?.appId || 'fb_access_token_configured')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Test Send API */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Send className="h-5 w-5" />
            Test Send API
          </CardTitle>
          <CardDescription>
            Send a test message to a Facebook user via the Send API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Recipient ID (PSID)</Label>
              <Input
                placeholder="Enter user's Page-Scoped ID"
                value={testSenderId}
                onChange={(e) => setTestSenderId(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Message</Label>
              <Input
                placeholder="Enter test message"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
          <Button
            onClick={handleTestSend}
            disabled={!testSenderId.trim() || !testMessage.trim() || sending}
          >
            <Send className="h-4 w-4 mr-2" />
            {sending ? 'Sending...' : 'Send Test Message'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
