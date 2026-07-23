import "./globals.css";

export const metadata = {
  title: "Grünschmiede – Gerätebestand",
  description: "Gerätebestand der Grünschmiede Greenteam",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Grünschmiede" },
};

export const viewport = { themeColor: "#15181A", width: "device-width", initialScale: 1 };

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
