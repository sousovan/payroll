import QRScanner from "@/components/qr/QRScanner";
import { auth } from "@/lib/auth";

export default async function QRPage() {
  const session = await auth();
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">QR Check-In / Check-Out</h1>
        <p className="text-slate-500 text-sm mt-1">Scan QR code to record attendance with GPS/WiFi verification</p>
      </div>
      <QRScanner />
    </div>
  );
}
