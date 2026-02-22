'use client';

import {
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Users,
  FileText,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import Link from 'next/link';
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
import { usePosts } from '@/lib/hooks';
import { useLeadStats } from '@/lib/hooks';
import { useInsightsSummary } from '@/lib/hooks';
import { useTokenHealth } from '@/lib/hooks';
import { cn, formatRelativeTime } from '@/lib/utils';

export default function DashboardPage() {
  const { data: postsRes, isLoading: postsLoading } = usePosts();
  const { data: leadStatsRes, isLoading: leadsLoading } = useLeadStats();
  const { data: insightsRes, isLoading: insightsLoading } =
    useInsightsSummary();
  const { data: tokenRes } = useTokenHealth();

  const posts = postsRes?.data || [];
  const leadStats = leadStatsRes?.data;
  const insights = insightsRes?.data || [];
  const token = tokenRes?.data;

  const postStats = {
    total: posts.length,
    published: posts.filter((p) => p.status === 'published').length,
    pending: posts.filter((p) => p.status === 'pending').length,
    failed: posts.filter((p) => p.status === 'failed').length,
  };

  const impressions =
    insights.find((i) => i.metric_name === 'page_impressions')?.metric_value ||
    0;
  const engagements =
    insights.find((i) => i.metric_name === 'page_post_engagements')
      ?.metric_value || 0;
  const followers =
    insights.find((i) => i.metric_name === 'page_fan_adds')?.metric_value || 0;

  const kpiCards = [
    {
      title: 'Total Posts',
      value: postStats.total,
      change: `${postStats.published} published`,
      trending: 'up' as const,
      icon: FileText,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: 'New Leads',
      value: leadStats?.new_count ?? 0,
      change: `${leadStats?.total ?? 0} total`,
      trending: 'up' as const,
      icon: Users,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      title: 'Impressions',
      value: impressions.toLocaleString(),
      change: 'Latest snapshot',
      trending: 'up' as const,
      icon: BarChart3,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-100 dark:bg-violet-900/30',
    },
    {
      title: 'Engagements',
      value: engagements.toLocaleString(),
      change: 'Latest snapshot',
      trending: 'up' as const,
      icon: TrendingUp,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
    },
  ];

  const quickLinks = [
    {
      title: 'Messenger Inbox',
      description: 'View conversations and manage auto-replies',
      href: '/inbox',
      icon: MessageSquare,
    },
    {
      title: 'Analytics',
      description: 'View page insights and performance',
      href: '/analytics',
      icon: BarChart3,
    },
    {
      title: 'Lead Management',
      description: 'Manage and export your leads',
      href: '/leads',
      icon: Users,
    },
    {
      title: 'Create Post',
      description: 'Publish to Facebook, LinkedIn & Telegram',
      href: '/posts',
      icon: FileText,
    },
  ];

  const isLoading = postsLoading || leadsLoading || insightsLoading;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-3" />
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))
          : kpiCards.map((card) => (
              <Card key={card.title} className="animate-fade-in">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </p>
                    <div className={cn('rounded-lg p-2', card.bg)}>
                      <card.icon className={cn('h-4 w-4', card.color)} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold">{card.value}</p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      {card.trending === 'up' ? (
                        <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-red-500" />
                      )}
                      {card.change}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">System Status</CardTitle>
              <CardDescription>
                Quick overview of your automation system
              </CardDescription>
            </div>
            <Badge variant={token?.isValid ? 'success' : 'destructive'}>
              Token {token?.isValid ? 'Valid' : 'Invalid'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Posts Published</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {postStats.published}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Posts Pending</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {postStats.pending}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Posts Failed</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {postStats.failed}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/20 cursor-pointer group">
                <CardContent className="p-6">
                  <div className="rounded-lg bg-primary/10 p-3 w-fit mb-3 group-hover:bg-primary/20 transition-colors">
                    <link.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{link.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {link.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Posts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Posts</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/posts">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {postsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>No posts yet</p>
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <Link href="/posts">Create your first post</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.slice(0, 5).map((post) => (
                <div
                  key={post.id}
                  className="flex items-center gap-4 rounded-lg border p-3"
                >
                  <div
                    className={cn(
                      'h-10 w-10 rounded-lg flex items-center justify-center text-xs font-bold',
                      post.status === 'published'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : post.status === 'pending'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    )}
                  >
                    {post.status[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{post.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(post.created_at)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      post.status === 'published'
                        ? 'success'
                        : post.status === 'pending'
                        ? 'warning'
                        : 'destructive'
                    }
                  >
                    {post.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
