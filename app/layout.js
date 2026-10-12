import "@fontsource-variable/archivo/wdth.css";
import "./globals.css";

export const metadata = {
  title: { default: "Grünschmiede", template: "%s · Grünschmiede" },
  description: "Geräte, Fahrzeuge und Lagerbestand der Grünschmiede Greenteam",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Grünschmiede" },
};

export const viewport = {
  themeColor: "#edefe9",
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
      <body>{children}</body>
    </html>
  );
}
