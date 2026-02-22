'use client';

import { useState } from 'react';
import {
  useInsights,
  useInsightsSummary,
  useCollectInsights,
  usePosts,
} from '@/lib/hooks';
import { InsightsLineChart } from '@/components/charts/insights-line-chart';
import { InsightsBarChart } from '@/components/charts/insights-bar-chart';
import { KpiCard } from '@/components/charts/kpi-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Eye, TrendingUp, UserPlus, RefreshCw, BarChart3 } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

const DATE_RANGES = [
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
];

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);

  const { data: insightsRes, isLoading } = useInsights({ days });
  const { data: summaryRes, isLoading: summaryLoading } =
    useInsightsSummary();
  const { data: postsRes } = usePosts();
  const collectInsights = useCollectInsights();

  const insights = insightsRes?.data || [];
  const summary = summaryRes?.data || [];
  const posts = postsRes?.data || [];

  const getMetricValue = (metric: string) =>
    summary.find((s) => s.metric_name === metric)?.metric_value || 0;

  const impressions = getMetricValue('page_impressions');
  const engagements = getMetricValue('page_post_engagements');
  const followers = getMetricValue('page_fan_adds');
  const engagementRate =
    impressions > 0 ? ((engagements / impressions) * 100).toFixed(2) : '0';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-muted-foreground">
            Track your Facebook page performance and engagement metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border bg-card">
            {DATE_RANGES.map((range) => (
              <button
                key={range.value}
                onClick={() => setDays(range.value)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  days === range.value
                    ? 'bg-primary text-primary-foreground rounded-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => collectInsights.mutate()}
            disabled={collectInsights.isPending}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${
                collectInsights.isPending ? 'animate-spin' : ''
              }`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {summaryLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <KpiCard
              title="Total Impressions"
              value={impressions.toLocaleString()}
              description="Latest daily snapshot"
              icon={Eye}
              trend="up"
            />
            <KpiCard
              title="Engagement Rate"
              value={`${engagementRate}%`}
              description={`${engagements.toLocaleString()} engagements`}
              icon={TrendingUp}
              trend="up"
            />
            <KpiCard
              title="New Followers"
              value={followers.toLocaleString()}
              description="Latest daily snapshot"
              icon={UserPlus}
              trend="up"
            />
          </>
        )}
      </div>

      {/* Charts */}
      <Tabs defaultValue="impressions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="impressions">Impressions</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="followers">Followers</TabsTrigger>
        </TabsList>

        <TabsContent value="impressions">
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ) : (
            <InsightsLineChart
              data={insights}
              metric="page_impressions"
              title="Page Impressions"
              color="hsl(221, 83%, 53%)"
            />
          )}
        </TabsContent>

        <TabsContent value="engagement">
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ) : (
            <InsightsBarChart
              data={insights}
              metric="page_post_engagements"
              title="Post Engagements"
              color="hsl(142, 76%, 36%)"
            />
          )}
        </TabsContent>

        <TabsContent value="followers">
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ) : (
            <InsightsLineChart
              data={insights}
              metric="page_fan_adds"
              title="New Followers"
              color="hsl(270, 76%, 53%)"
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Post Performance Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Post Performance
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No posts to display
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.slice(0, 10).map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium max-w-[300px] truncate">
                      {post.title}
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatRelativeTime(post.created_at)}
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
