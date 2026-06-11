import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Upload, Download, AlertCircle, CheckCircle, Trash2 } from "lucide-react";
import Papa from "papaparse";

export function BulkShortener() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef();

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

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const text = await file.text();
      const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (lines.length === 0) {
        setError("No URLs found in file");
        setLoading(false);
        return;
      }

      const successResults = [];
      const failedURLs = [];

      for (const url of lines) {
        if (!isValidUrl(url)) {
          failedURLs.push({
            url,
            reason: "Invalid URL format",
          });
          continue;
        }

        try {
          const shortCode = generateCode();

          const { data, error: insertError } = await supabase
            .from("short_urls")
            .insert([
              {
                original_url: url,
                short_code: shortCode,
                created_at: new Date().toISOString(),
              },
            ])
            .select();

          if (insertError) throw insertError;

          successResults.push({
            original: url,
            shortened: `${window.location.origin}/${shortCode}`,
            code: shortCode,
            status: "success",
          });
        } catch (err) {
          failedURLs.push({
            url,
            reason: err.message || "Unknown error",
          });
        }
      }

      setResults({
        successful: successResults,
        failed: failedURLs,
      });

      if (failedURLs.length > 0) {
        setError(`${failedURLs.length} URL(s) failed to shorten`);
      }
    } catch (err) {
      console.error("Error processing file:", err);
      setError(err.message || "Error processing file");
    } finally {
      setLoading(false);
    }
  };

  const downloadResults = () => {
    if (!results?.successful || results.successful.length === 0) {
      alert("No successful results to download");
      return;
    }

    const csv = [
      "Original URL,Shortened URL,Short Code",
      ...results.successful.map(
        (r) => `"${r.original}","${r.shortened}","${r.code}"`
      ),
    ].join("\n");

    const link = document.createElement("a");
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    link.download = `shortened_urls_${new Date().getTime()}.csv`;
    link.click();
  };

  const resetForm = () => {
    setResults(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Upload Area */}
      <div
        className="border-2 border-dashed border-purple-400 dark:border-purple-500 rounded-lg p-8 text-center bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFileUpload}
          disabled={loading}
          className="hidden"
        />
        <Upload className="w-8 h-8 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Click to upload CSV or TXT file
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          One URL per line (supports .csv and .txt formats)
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-3">
            Processing {results?.successful?.length || 0} URLs...
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-4">
          {/* Success Summary */}
          {results.successful.length > 0 && (
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                ✓ {results.successful.length} URL(s) shortened successfully
              </p>
            </div>
          )}

          {/* Results Table */}
          {results.successful.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-slate-700">
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">
                        Original URL
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">
                        Short Code
                      </th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.successful.map((result, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                      >
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 truncate text-xs break-all">
                          {result.original}
                        </td>
                        <td className="px-4 py-3 font-mono text-purple-600 dark:text-purple-400 font-medium">
                          {result.code}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            <CheckCircle size={12} /> Done
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Failed URLs */}
          {results.failed.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                ⚠️ {results.failed.length} URL(s) failed:
              </p>
              <ul className="space-y-1 max-h-32 overflow-y-auto">
                {results.failed.map((failed, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-yellow-700 dark:text-yellow-400"
                  >
                    <span className="font-mono break-all">{failed.url}</span>
                    <span className="text-yellow-600 dark:text-yellow-500">
                      {" "}
                      - {failed.reason}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {results.successful.length > 0 && (
              <button
                onClick={downloadResults}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
              >
                <Download size={16} /> Download Results (CSV)
              </button>
            )}
            <button
              onClick={resetForm}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium text-sm"
            >
              <Trash2 size={16} /> Clear & Upload New
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
