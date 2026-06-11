import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { QRCodeGenerator } from "@/components/QRCodeGenerator";
import { AnalyticsDashboard } from "@/components/Analyticsdashboard";
import { URLExpiration } from "@/components/URLExpiration";
import { BulkShortener } from "@/components/BulkShortener";
import { Copy, Trash2, Eye, Loader } from "lucide-react";
import { useState as useStateTab } from "react";

export default function Home() {
  const [originalUrl, setOriginalUrl] = useState("");
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("shorten");
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [copied, setCopied] = useState({});

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleShorten = async (e) => {
    e.preventDefault();
    setError("");

    if (!originalUrl.trim()) {
      setError("Please enter a URL");
      return;
    }

    if (!isValidUrl(originalUrl)) {
      setError("Please enter a valid URL (starting with http:// or https://)");
      return;
    }

    setLoading(true);

    try {
      const shortCode = generateCode();

      const { data, error: insertError } = await supabase
        .from("short_urls")
        .insert([
          {
            original_url: originalUrl.trim(),
            short_code: shortCode,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (insertError) throw insertError;

      if (data && data[0]) {
        setUrls([data[0], ...urls]);
        setOriginalUrl("");
        setError("");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "Failed to shorten URL");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (urlId) => {
    try {
      const { error: deleteError } = await supabase
        .from("short_urls")
        .delete()
        .eq("id", urlId);

      if (deleteError) throw deleteError;

      setUrls(urls.filter((url) => url.id !== urlId));
      if (selectedUrl?.id === urlId) {
        setSelectedUrl(null);
      }
    } catch (err) {
      console.error("Error deleting URL:", err);
      setError("Failed to delete URL");
    }
  };

  const handleCopy = (url) => {
    const fullUrl = `${window.location.origin}/${url.short_code}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied({ ...copied, [url.id]: true });
    setTimeout(() => {
      setCopied({ ...copied, [url.id]: false });
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Tab Navigation */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        {["shorten", "bulk", "list"].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setSelectedUrl(null);
            }}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === tab
                ? "bg-purple-600 text-white shadow-lg"
                : "bg-white/10 text-gray-200 hover:bg-white/20 border border-white/20"
            }`}
          >
            {tab === "shorten" && "✨ Shorten URL"}
            {tab === "bulk" && "📦 Bulk Upload"}
            {tab === "list" && "📋 My Links"}
          </button>
        ))}
      </div>

      {/* Shorten Tab */}
      {activeTab === "shorten" && (
        <div className="space-y-6">
          {/* Form Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Create Short URL
            </h2>

            <form onSubmit={handleShorten} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Original URL
                </label>
                <input
                  type="url"
                  value={originalUrl}
                  onChange={(e) => {
                    setOriginalUrl(e.target.value);
                    setError("");
                  }}
                  placeholder="https://example.com/very/long/url"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-purple-400 disabled:to-purple-500 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader size={18} className="animate-spin" /> Shortening...
                  </>
                ) : (
                  "🔗 Shorten URL"
                )}
              </button>
            </form>
          </div>

          {/* Quick Links Display */}
          {urls.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                Recent Links
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {urls.slice(0, 5).map((url) => (
                  <div
                    key={url.id}
                    onClick={() => setSelectedUrl(url)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedUrl?.id === url.id
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {url.original_url}
                        </p>
                        <p className="font-mono text-purple-600 dark:text-purple-400 font-semibold text-sm">
                          {window.location.origin}/{url.short_code}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(url);
                        }}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors flex-shrink-0"
                      >
                        {copied[url.id] ? (
                          <span className="text-green-600 text-xs font-semibold">
                            ✓
                          </span>
                        ) : (
                          <Copy size={16} className="text-gray-600 dark:text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bulk Tab */}
      {activeTab === "bulk" && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Bulk Shorten URLs
          </h2>
          <BulkShortener />
        </div>
      )}

      {/* List Tab with Details */}
      {activeTab === "list" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* URLs List */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
              All Links ({urls.length})
            </h3>

            {urls.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
                No links yet. Create one above! 👆
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {urls.map((url) => (
                  <div
                    key={url.id}
                    onClick={() => setSelectedUrl(url)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedUrl?.id === url.id
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                    }`}
                  >
                    <p className="text-xs font-mono text-purple-600 dark:text-purple-400 font-semibold">
                      {url.short_code}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {url.original_url}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-2 space-y-4">
            {selectedUrl ? (
              <>
                {/* Selected URL Info */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                      Link Details
                    </h3>
                    <button
                      onClick={() => handleDelete(selectedUrl.id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <Trash2 size={18} className="text-red-600 dark:text-red-400" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Short URL
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 p-2 bg-gray-100 dark:bg-slate-700 rounded text-sm text-purple-600 dark:text-purple-400 break-all">
                          {window.location.origin}/{selectedUrl.short_code}
                        </code>
                        <button
                          onClick={() => handleCopy(selectedUrl)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors"
                        >
                          {copied[selectedUrl.id] ? (
                            <span className="text-green-600 text-xs font-semibold">
                              ✓
                            </span>
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Original URL
                      </label>
                      <p className="mt-1 p-2 bg-gray-100 dark:bg-slate-700 rounded text-sm text-gray-700 dark:text-gray-300 break-all">
                        {selectedUrl.original_url}
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Created
                      </label>
                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                        {new Date(selectedUrl.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                  <QRCodeGenerator
                    shortUrl={`${window.location.origin}/${selectedUrl.short_code}`}
                  />
                </div>

                {/* Expiration */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-3">
                    Set Expiration
                  </h4>
                  <URLExpiration
                    urlId={selectedUrl.id}
                    onExpirationSet={(date) => {
                      // Update selected URL
                      setSelectedUrl({
                        ...selectedUrl,
                        expires_at: date.toISOString(),
                      });
                    }}
                  />
                </div>

                {/* Analytics */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-3">
                    Analytics
                  </h4>
                  <AnalyticsDashboard
                    urlId={selectedUrl.id}
                    shortCode={selectedUrl.short_code}
                  />
                </div>
              </>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
                <Eye size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Select a link from the left to see details
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
