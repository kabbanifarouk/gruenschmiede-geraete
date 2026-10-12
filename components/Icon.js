// Einheitlicher Symbolsatz (24er Raster, 1,8er Strich)
const P = {
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" /></>,
  werkzeug: <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z" />,
  lager: <><path d="m7.5 4.3 9 5.1" /><path d="M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></>,
  transporter: <><path d="M2 16.5V7a1 1 0 0 1 1-1h10.5v10.5" /><path d="M13.5 9h3.8l3.7 4.2v3.3" /><circle cx="7" cy="17.5" r="2" /><circle cx="17" cy="17.5" r="2" /><path d="M2 16.5h3M9 16.5h6M19 16.5h2" /></>,
  halle: <><path d="M3 21V9l9-5 9 5v12" /><path d="M2 21h20" /><path d="M8 21v-7h8v7" /><path d="M8 17.5h8" /></>,
  team: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" /><path d="M18.5 14.4A6.5 6.5 0 0 1 21.5 20" /></>,
  einstellungen: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
  nutzer: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  suche: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  zurueck: <path d="m15 18-6-6 6-6" />,
  weiter: <path d="m9 18 6-6-6-6" />,
  runter: <path d="m6 9 6 6 6-6" />,
  schliessen: <path d="M18 6 6 18M6 6l12 12" />,
  haken: <path d="M20 6 9 17l-5-5" />,
  warnung: <><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></>,
  abmelden: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></>,
  schluessel: <><circle cx="7.5" cy="15.5" r="4.5" /><path d="m10.7 12.3 9.3-9.3M17 6l3 3M14.5 8.5l2 2" /></>,
  schloss: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  kamera: <><path d="M14.5 4h-5L7.5 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.5z" /><circle cx="12" cy="13" r="3.5" /></>,
  verlauf: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l3.5 2" /></>,
  kalender: <><rect x="3" y="4.5" width="18" height="17" rx="2" /><path d="M16 2.5v4M8 2.5v4M3 10h18" /></>,
  pfeilHoch: <path d="M12 19V5M5 12l7-7 7 7" />,
  pfeilRunter: <path d="M12 5v14M19 12l-7 7-7-7" />,
  tauschen: <><path d="M16 3h5v5" /><path d="M21 3l-7 7" /><path d="M8 21H3v-5" /><path d="m3 21 7-7" /></>,
  bearbeiten: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
  loeschen: <><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
  mehr: <><circle cx="12" cy="5" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="12" cy="19" r="1.2" /></>,
  ort: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></>,
  waage: <><path d="M12 3v18M7 21h10" /><path d="M5 7h14" /><path d="m5 7-3 7a3.5 3.5 0 0 0 6 0z" /><path d="m19 7-3 7a3.5 3.5 0 0 0 6 0z" /></>,
  inventur: <><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="m9 14 2 2 4-4" /></>,
  schild: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></>,

  baustelle: <><path d="M2 19h20" /><path d="M4 19v-2.5a8 8 0 0 1 16 0V19" /><path d="M10 9V5.5h4V9" /><path d="M8 11.5v-2M16 11.5v-2" /></>,
  uhr: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.2 2" /></>,
  play: <path d="M7 4.6v14.8a1 1 0 0 0 1.5.86l12.1-7.4a1 1 0 0 0 0-1.72L8.5 3.74A1 1 0 0 0 7 4.6z" />,
  stopp: <rect x="6" y="6" width="12" height="12" rx="2.5" />,
  telefon: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />,
  route: <><path d="M3 6.5 9 3.5l6 3 6-3v14l-6 3-6-3-6 3z" /><path d="M9 3.5v14M15 6.5v14" /></>,
  stift: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>,

  notiz: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /><path d="M8 13h8M8 17h5" /></>,

  // Geräte-Arten
  motorgeraet: <><rect x="2" y="9" width="9" height="7" rx="1.5" /><path d="M11 10.6h9.4a1.4 1.4 0 0 1 0 2.8H11" /><path d="M12.5 9.4v-1M15 9.4v-1M17.5 9.4v-1M20 9.4v-1" /><path d="M4 9V7.4h4.2" /></>,
  maeher: <><path d="M4 14.2h16v-3a2 2 0 0 0-2-2H8.4L4 14.2z" /><circle cx="7" cy="17.6" r="2" /><circle cx="17" cy="17.6" r="2" /><path d="M18.6 9.2V6.6a1.6 1.6 0 0 1 1.6-1.6H22" /></>,
  anhaenger: <><rect x="3" y="7.6" width="13.5" height="7" rx="1.2" /><path d="M16.5 11.6H21" /><circle cx="8" cy="17.6" r="1.9" /><circle cx="13" cy="17.6" r="1.9" /></>,
  kiste: <><path d="M3 8.2 12 4l9 4.2v7.6L12 20l-9-4.2z" /><path d="m3 8.2 9 4.2 9-4.2M12 12.4V20" /></>,

  // Material-Arten
  sack: <><path d="M7 4h10l-1 2.5c2 1.5 3 4 3 7.5 0 4-2.5 7-7 7s-7-3-7-7c0-3.5 1-6 3-7.5z" /><path d="M8 6.5h8" /></>,
  steine: <><rect x="2.5" y="13" width="8.5" height="7" rx="1" /><rect x="13" y="13" width="8.5" height="7" rx="1" /><rect x="7.7" y="5" width="8.5" height="7" rx="1" /></>,
  haufen: <><path d="M2 20h20" /><path d="M3.5 20 9 9.5a1.5 1.5 0 0 1 2.7 0L14 14l1.3-2a1.5 1.5 0 0 1 2.5 0L21 20" /></>,
  pflanze: <><path d="M12 22v-9" /><path d="M12 13c0-4 2.5-7 7-7 0 4.5-3 7-7 7z" /><path d="M12 15.5c0-3.3-2.2-5.5-6-5.5 0 3.6 2.4 5.5 6 5.5z" /></>,
  rohr: <><path d="M4 8h9a6 6 0 0 1 6 6v6" /><path d="M4 14h9v6" /><path d="M3 6.5v9.5" /><path d="M11.5 21h9" /></>,
  holz: <><ellipse cx="7" cy="12" rx="4" ry="6" /><path d="M7 6h12a4 6 0 0 1 0 12H7" /><ellipse cx="7" cy="12" rx="1.5" ry="2.3" /></>,
  kanister: <><path d="M6 6h8l4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" /><path d="M9 3h4v3H9z" /><path d="m8 12 6 6M14 12l-6 6" /></>,
  palette: <><path d="M2 17h20M2 21h20" /><path d="M4 17v4M12 17v4M20 17v4" /><rect x="4" y="5" width="16" height="12" rx="1" /></>,
};

export default function Icon({ name, groesse = 20, staerke = 1.8, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24" width={groesse} height={groesse} aria-hidden="true"
      className={"icon " + className} fill="none" stroke="currentColor"
      strokeWidth={staerke} strokeLinecap="round" strokeLinejoin="round"
    >
      {P[name] || P.kiste}
    </svg>
  );
}
