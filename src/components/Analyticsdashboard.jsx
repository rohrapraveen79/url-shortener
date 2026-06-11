import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { RefreshCw, TrendingUp } from "lucide-react";

export function AnalyticsDashboard({ urlId, shortCode }) {
  const [totalClicks, setTotalClicks] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, [urlId]);

  const fetchAnalytics = async () => {
    try {
      const { data: clickData, error: clickError } = await supabase
        .from("clicks")
        .select("created_at")
        .eq("url_id", urlId)
        .order("created_at", { ascending: true });

      if (clickError) throw clickError;

      setTotalClicks(clickData?.length || 0);

      const groupedData = {};
      clickData?.forEach((click) => {
        const date = new Date(click.created_at).toLocaleDateString("en-US");
        groupedData[date] = (groupedData[date] || 0) + 1;
      });

      const chartArray = Object.entries(groupedData)
        .map(([date, count]) => ({
          date,
          clicks: count,
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      setChartData(chartArray);
      setError(null);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const averageClicksPerDay =
    chartData.length > 0
      ? (totalClicks / chartData.length).toFixed(1)
      : 0;

  return (
    <div className="w-full space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Clicks Card */}
        <div className="bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20 p-6 rounded-lg border border-purple-200 dark:border-purple-700/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Total Clicks
              </h3>
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                {totalClicks}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Code: <span className="font-mono font-semibold">{shortCode}</span>
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-300 opacity-50" />
          </div>
        </div>

        {/* Average Clicks Card */}
        <div className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 p-6 rounded-lg border border-blue-200 dark:border-blue-700/50">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Avg Clicks/Day
          </h3>
          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
            {averageClicksPerDay}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Over {chartData.length} days
          </p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Click Trends
            </h3>
            <button
              onClick={fetchAnalytics}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Refresh data"
            >
              <RefreshCw size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border-tertiary)"
                opacity={0.3}
              />
              <XAxis
                dataKey="date"
                stroke="var(--color-text-secondary)"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                stroke="var(--color-text-secondary)"
                style={{ fontSize: "12px" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-background-secondary)",
                  border: "1px solid var(--color-border-tertiary)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                }}
                labelStyle={{ color: "var(--color-text-primary)" }}
                formatter={(value) => [value, "Clicks"]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="clicks"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ fill: "#8b5cf6", r: 4 }}
                activeDot={{ r: 6 }}
                name="Daily Clicks"
              />
            </LineChart>
          </ResponsiveContainer>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
      ) : loading ? (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-3">Loading analytics...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-700/50">
          <p className="text-sm text-red-600 dark:text-red-400">
            Error: {error}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No click data yet. Share your link to start tracking! 🚀
          </p>
        </div>
      )}
    </div>
  );
}
