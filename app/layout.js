import "@fontsource-variable/archivo/wdth.css";
import "./globals.css";
import PwaRegister from "@/components/Pwa";

export const metadata = {
  title: { default: "Grünschmiede", template: "%s · Grünschmiede" },
  description: "Aufträge, Geräte, Lager und Arbeitszeiten der Grünschmiede Greenteam",
  applicationName: "Grünschmiede",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Grünschmiede" },
  formatDetection: { telephone: false },
  other: { "mobile-web-app-capable": "yes" },
};

export const viewport = {
  themeColor: "#edefe9",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
