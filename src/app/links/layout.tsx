import { GoogleAnalytics } from "@next/third-parties/google";
import { gaMeasurementId } from "@/lib/analytics-config";
import "@/app/globals.css";

export default function LinksLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="links-body">
        {children}
        {gaMeasurementId && <GoogleAnalytics gaId={gaMeasurementId} />}
      </body>
    </html>
  );
}
