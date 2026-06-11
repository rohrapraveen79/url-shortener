import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Clock, AlertCircle } from "lucide-react";

export function URLExpiration({ urlId, onExpirationSet }) {
  const [duration, setDuration] = useState("24h");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const durationMap = {
    "1h": 1,
    "6h": 6,
    "24h": 24,
    "7d": 7 * 24,
    "30d": 30 * 24,
  };

  const durationLabels = {
    "1h": "1 Hour",
    "6h": "6 Hours",
    "24h": "24 Hours",
    "7d": "7 Days",
    "30d": "30 Days",
  };

  const handleSetExpiration = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const hours = durationMap[duration];
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + hours);

      const { error } = await supabase
        .from("short_urls")
        .update({ expires_at: expiresAt.toISOString() })
        .eq("id", urlId);

      if (error) throw error;

      setMessage({
        type: "success",
        text: `Link will expire in ${durationLabels[duration]}`,
      });
      onExpirationSet(expiresAt);

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error setting expiration:", error);
      setMessage({
        type: "error",
        text: "Failed to set expiration. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          disabled={loading}
          className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="1h">Expires in 1 Hour</option>
          <option value="6h">Expires in 6 Hours</option>
          <option value="24h">Expires in 24 Hours</option>
          <option value="7d">Expires in 7 Days</option>
          <option value="30d">Expires in 30 Days</option>
        </select>

        <button
          onClick={handleSetExpiration}
          disabled={loading}
          className="px-6 py-2.5 flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-lg transition-colors font-medium text-sm"
        >
          <Clock size={16} />
          {loading ? "Setting..." : "Set Expiration"}
        </button>
      </div>

      {message && (
        <div
          className={`flex items-start gap-2 px-4 py-3 rounded-lg border ${
            message.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/50"
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50"
          }`}
        >
          <AlertCircle
            size={16}
            className={`flex-shrink-0 mt-0.5 ${
              message.type === "success"
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          />
          <p
            className={`text-sm ${
              message.type === "success"
                ? "text-green-800 dark:text-green-300"
                : "text-red-800 dark:text-red-300"
            }`}
          >
            {message.text}
          </p>
        </div>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-2">
        <Clock size={14} className="mt-0.5 flex-shrink-0" />
        Links will be automatically disabled after expiration
      </p>
    </div>
  );
}
