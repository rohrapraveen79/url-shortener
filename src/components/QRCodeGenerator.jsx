import { useRef } from "react";
import QRCode from "qrcode.react";
import { Download, Copy, Check } from "lucide-react";
import { useState } from "react";

export function QRCodeGenerator({ shortUrl }) {
  const qrRef = useRef();
  const [copied, setCopied] = useState(false);

  const downloadQR = () => {
    if (!qrRef.current) return;

    const canvas = qrRef.current.querySelector("canvas");
    if (!canvas) return;

    const link = document.createElement("a");
    const shortCode = shortUrl.split("/").pop();
    link.download = `qr-${shortCode}-${new Date().getTime()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-700/50">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        QR Code
      </h3>

      <div
        ref={qrRef}
        className="p-3 bg-white rounded-lg shadow-lg border border-gray-200"
      >
        <QRCode
          value={shortUrl}
          size={180}
          level="H"
          includeMargin={true}
          fgColor="#000000"
          bgColor="#ffffff"
        />
      </div>

      <div className="flex gap-2 w-full">
        <button
          onClick={downloadQR}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Download size={16} /> Download
        </button>
        <button
          onClick={copyToClipboard}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          {copied ? (
            <>
              <Check size={16} /> Copied
            </>
          ) : (
            <>
              <Copy size={16} /> Copy Link
            </>
          )}
        </button>
      </div>
    </div>
  );
}