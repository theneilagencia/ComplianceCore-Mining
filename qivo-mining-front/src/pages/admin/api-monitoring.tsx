/**
 * API Monitoring Dashboard
 * 
 * Administrative dashboard for monitoring API usage, costs, and health
 */

import { useState, useEffect } from 'react';
import { trpc } from '../../utils/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  XCircle,
  RefreshCw,
} from 'lucide-react';

export default function APIMonitoringPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  // Queries
  const { data: summary, isLoading: summaryLoading } = trpc.radarAdmin.getDashboardSummary.useQuery(
    undefined,
    { refetchInterval: 60000 } // Refresh every minute
  );

  const { data: stats, isLoading: statsLoading } = trpc.radarAdmin.getAPIUsageStats.useQuery(
    undefined,
    { refetchInterval: 60000 }
  );

  const { data: quotaAlerts } = trpc.radarAdmin.getQuotaAlerts.useQuery({ threshold: 80 });
  const { data: costAlerts } = trpc.radarAdmin.getCostAlerts.useQuery({ threshold: 100 });
  const { data: healthChecks } = trpc.radarAdmin.getHealthChecks.useQuery(
    undefined,
    { refetchInterval: 300000 } // Refresh every 5 minutes
  );

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (summaryLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando métricas...</p>
        </div>
      </div>
    );
  }

  const summaryData = summary?.data?.summary;
  const statsData = stats?.data || [];
  const quotaAlertsData = quotaAlerts?.data || [];
  const costAlertsData = costAlerts?.data || [];
  const healthChecksData = healthChecks?.data || [];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Monitoramento de APIs</h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe o uso, custos e disponibilidade das APIs do Radar Regulatório
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Alerts */}
      {(quotaAlertsData.length > 0 || costAlertsData.length > 0) && (
        <div className="space-y-4 mb-8">
          {quotaAlertsData.map((alert: any) => (
            <Alert key={alert.source_id} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Alerta de Quota</AlertTitle>
              <AlertDescription>
                <strong>{alert.source_name}</strong> está com {alert.quota_used_percentage.toFixed(1)}% da quota utilizada.
                Restam {alert.requests_remaining} requisições este mês.
              </AlertDescription>
            </Alert>
          ))}

          {costAlertsData.map((alert: any) => (
            <Alert key={alert.source_id} variant="destructive">
              <DollarSign className="h-4 w-4" />
              <AlertTitle>Alerta de Custo</AlertTitle>
              <AlertDescription>
                <strong>{alert.source_name}</strong> ultrapassou o limite de custo: ${alert.total_cost.toFixed(2)} este mês.
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Requisições</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData?.total_requests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Taxa de sucesso: {summaryData?.success_rate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summaryData?.total_cost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latência Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData?.avg_response_time_ms.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground mt-1">
              Uptime: {summaryData?.avg_uptime_percentage.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">APIs Ativas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryData?.healthy_apis}/{summaryData?.total_sources}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summaryData?.unhealthy_apis > 0 && (
                <span className="text-destructive">
                  {summaryData?.unhealthy_apis} com problemas
                </span>
              )}
              {summaryData?.unhealthy_apis === 0 && (
                <span className="text-green-600">Todas operacionais</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usage">Uso de APIs</TabsTrigger>
          <TabsTrigger value="health">Status de Saúde</TabsTrigger>
        </TabsList>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas de Uso</CardTitle>
              <CardDescription>
                Métricas detalhadas de cada API integrada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>API</TableHead>
                    <TableHead className="text-right">Requisições</TableHead>
                    <TableHead className="text-right">Sucesso</TableHead>
                    <TableHead className="text-right">Falhas</TableHead>
                    <TableHead className="text-right">Latência Média</TableHead>
                    <TableHead className="text-right">Uptime</TableHead>
                    <TableHead className="text-right">Quota Usada</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statsData.map((stat: any) => (
                    <TableRow key={stat.source_id}>
                      <TableCell className="font-medium">{stat.source_name}</TableCell>
                      <TableCell className="text-right">{stat.total_requests}</TableCell>
                      <TableCell className="text-right text-green-600">
                        {stat.successful_requests}
                      </TableCell>
                      <TableCell className="text-right text-destructive">
                        {stat.failed_requests}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(stat.avg_response_time_ms).toFixed(0)}ms
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={Number(stat.uptime_percentage) >= 99 ? 'default' : 'destructive'}>
                          {Number(stat.uptime_percentage).toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {stat.quota_used_percentage ? (
                          <Badge variant={Number(stat.quota_used_percentage) >= 80 ? 'destructive' : 'secondary'}>
                            {Number(stat.quota_used_percentage).toFixed(1)}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        ${Number(stat.total_cost).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status de Saúde</CardTitle>
              <CardDescription>
                Verificação de disponibilidade e performance das APIs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {healthChecksData.map((check: any) => (
                  <div
                    key={check.source_id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      {check.is_healthy ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      ) : (
                        <XCircle className="h-6 w-6 text-destructive" />
                      )}
                      <div>
                        <h3 className="font-semibold">{check.source_name}</h3>
                        {check.error_message && (
                          <p className="text-sm text-muted-foreground">{check.error_message}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {check.status_code && (
                        <Badge variant={check.is_healthy ? 'default' : 'destructive'}>
                          HTTP {check.status_code}
                        </Badge>
                      )}
                      {check.response_time_ms && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {check.response_time_ms}ms
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
