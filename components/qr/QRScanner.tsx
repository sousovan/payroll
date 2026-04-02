"use client";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Wifi, MapPin, CheckCircle, XCircle, Loader2, Camera, CameraOff } from "lucide-react";
import { toast } from "sonner";

export default function QRScanner() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [wifi, setWifi] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    // Try to get location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
    return () => stopCamera();
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setScanning(true);
      // Use html5-qrcode via dynamic import
      startQRDetection();
    } catch {
      toast.error("Cannot access camera");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setScanning(false);
  }

  function startQRDetection() {
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || !scanning) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(videoRef.current, 0, 0);
        // Use BarcodeDetector if available
        if ("BarcodeDetector" in window) {
          const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
          const barcodes = await detector.detect(canvas);
          if (barcodes.length > 0) {
            stopCamera();
            await processQR(barcodes[0].rawValue);
          }
        }
      } catch {}
    }, 500);
  }

  async function processQR(rawValue: string) {
    setLoading(true);
    try {
      const data = JSON.parse(rawValue);
      const res = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrToken: data.token,
          method: "QR",
          lat: location?.lat,
          lng: location?.lng,
          wifiSsid: wifi || undefined,
          deviceId: localStorage.getItem("device_id"),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setResult(json);
      toast.success(`${json.action === "checkin" ? "Checked In" : "Checked Out"} — ${json.employee?.firstName} ${json.employee?.lastName}`);
    } catch (e: any) {
      toast.error(e.message || "QR scan failed");
      setResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  }

  // Manual token entry for testing
  async function handleManualTest(token: string) {
    await processQR(JSON.stringify({ token }));
  }

  const [manualToken, setManualToken] = useState("");

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" /> Location & WiFi
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            {location ? (
              <span className="text-sm text-green-600 font-medium">GPS: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
            ) : (
              <span className="text-sm text-slate-400">Location not available</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-slate-400" />
            <input
              className="text-sm border rounded px-2 py-1 w-40"
              placeholder="WiFi SSID (optional)"
              value={wifi}
              onChange={e => setWifi(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Camera className="w-4 h-4 text-blue-600" />QR Scanner</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-square max-w-sm mx-auto">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {!scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3">
                <QrCode className="w-12 h-12 text-blue-400" />
                <p className="text-sm text-slate-300">Camera is off</p>
              </div>
            )}
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-blue-400 rounded-xl opacity-70" />
              </div>
            )}
          </div>
          <div className="flex gap-3 justify-center">
            {!scanning ? (
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={startCamera}>
                <Camera className="w-4 h-4 mr-2" />Start Camera
              </Button>
            ) : (
              <Button variant="outline" onClick={stopCamera}>
                <CameraOff className="w-4 h-4 mr-2" />Stop Camera
              </Button>
            )}
          </div>
          {loading && (
            <div className="flex items-center justify-center gap-2 text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />Processing...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual entry for testing */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Manual Token Check-In (Testing)</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <input
            className="flex-1 text-sm border rounded px-3 py-2"
            placeholder="Paste QR token here..."
            value={manualToken}
            onChange={e => setManualToken(e.target.value)}
          />
          <Button onClick={() => handleManualTest(manualToken)} disabled={!manualToken || loading} className="bg-blue-600 hover:bg-blue-700">
            Check In
          </Button>
        </CardContent>
      </Card>

      {result && !result.error && (
        <Card className="border-0 shadow-sm border-l-4 border-l-green-500">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="font-semibold text-slate-800">{result.action === "checkin" ? "Checked In" : "Checked Out"} Successfully</p>
              <p className="text-sm text-slate-500">{result.employee?.firstName} {result.employee?.lastName}</p>
              <p className="text-xs text-slate-400">
                {result.record?.lateMinutes > 0 ? `⚠️ Late by ${result.record.lateMinutes} minutes` : "✓ On time"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      {result?.error && (
        <Card className="border-0 shadow-sm border-l-4 border-l-red-500">
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="w-8 h-8 text-red-600" />
            <p className="font-medium text-red-700">{result.error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
