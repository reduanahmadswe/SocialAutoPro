'use client';

import {
  useHealthCheck,
  useTokenHealth,
  useTokenHealthHistory,
  useRunTokenHealthCheck,
  useMessages,
} from '@/lib/hooks';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Activity,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Server,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Webhook,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

export default function SystemPage() {
  const { data: healthRes, isLoading: healthLoading } = useHealthCheck();
  const { data: tokenRes, isLoading: tokenLoading } = useTokenHealth();
  const { data: historyRes, isLoading: historyLoading } =
    useTokenHealthHistory(20);
  const { data: messagesRes } = useMessages({ limit: 5 });
  const runCheck = useRunTokenHealthCheck();

  const token = tokenRes?.data;
  const history = historyRes?.data || [];
  const recentMessages = messagesRes?.data || [];
  const apiOnline = healthRes?.success === true;

  return (
    <div className="space-y-6 animate-fade-in">
      <p className="text-muted-foreground">
        Monitor your automation system health, token status, and webhook events.
      </p>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* API Health */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'rounded-full p-3',
                  apiOnline
                    ? 'bg-emerald-100 dark:bg-emerald-900/30'
                    : 'bg-red-100 dark:bg-red-900/30'
                )}
              >
                <Server
                  className={cn(
                    'h-5 w-5',
                    apiOnline
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  )}
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">API Health</p>
                {healthLoading ? (
                  <Skeleton className="h-6 w-16 mt-1" />
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={apiOnline ? 'success' : 'destructive'}>
                      {apiOnline ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Token Status */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'rounded-full p-3',
                  token?.isValid
                    ? 'bg-emerald-100 dark:bg-emerald-900/30'
                    : 'bg-red-100 dark:bg-red-900/30'
                )}
              >
                {token?.isValid ? (
                  <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Token Status</p>
                {tokenLoading ? (
                  <Skeleton className="h-6 w-16 mt-1" />
                ) : (
                  <Badge
                    variant={token?.isValid ? 'success' : 'destructive'}
                    className="mt-1"
                  >
                    {token?.isValid ? 'Valid' : 'Invalid'}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Token Expiry */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-3 bg-blue-100 dark:bg-blue-900/30">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Token Expires</p>
                {tokenLoading ? (
                  <Skeleton className="h-6 w-24 mt-1" />
                ) : (
                  <p className="font-medium text-sm mt-1">
                    {token?.expiresAt
                      ? formatDate(token.expiresAt)
                      : 'Never / Unknown'}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Token Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Token Details
              </CardTitle>
              <CardDescription>
                Facebook Page Access Token information
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => runCheck.mutate()}
              disabled={runCheck.isPending}
            >
              <RefreshCw
                className={cn(
                  'h-4 w-4 mr-2',
                  runCheck.isPending && 'animate-spin'
                )}
              />
              Run Check
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tokenLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : token ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">App ID</p>
                <p className="font-mono text-sm mt-1">
                  {token.appId || 'N/A'}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="font-mono text-sm mt-1">
                  {token.type || 'N/A'}
                </p>
              </div>
              <div className="rounded-lg border p-3 sm:col-span-2">
                <p className="text-xs text-muted-foreground">Scopes</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {token.scopes?.length > 0 ? (
                    token.scopes.map((scope) => (
                      <Badge key={scope} variant="secondary" className="text-xs">
                        {scope}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No scopes
                    </span>
                  )}
                </div>
              </div>
              {token.error && (
                <div className="rounded-lg border border-destructive/50 p-3 sm:col-span-2">
                  <p className="text-xs text-destructive">Error</p>
                  <p className="text-sm mt-1">{token.error}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No token data available</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Webhook Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Recent Webhook Events
          </CardTitle>
          <CardDescription>
            Latest incoming messages (webhook-triggered)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Webhook className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>No recent webhook events</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="flex items-center gap-3 rounded-lg border p-3 text-sm"
                >
                  <div
                    className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center',
                      msg.direction === 'incoming'
                        ? 'bg-blue-100 dark:bg-blue-900/30'
                        : 'bg-emerald-100 dark:bg-emerald-900/30'
                    )}
                  >
                    {msg.direction === 'incoming' ? (
                      <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {msg.sender_name || msg.sender_id}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {msg.message_text}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDate(msg.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Check History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Token Health History</CardTitle>
          <CardDescription>
            Historical token validation results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No health check history
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Checked At</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {entry.is_valid ? (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Valid
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Invalid
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(entry.checked_at)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.expires_at
                        ? formatDate(entry.expires_at)
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {entry.error || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
