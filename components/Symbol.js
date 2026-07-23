const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };

const PFADE = {
  transporter: (
    <g {...S}><path d="M2 16V7.5a1 1 0 0 1 1-1h10V16" /><path d="M13 8.5h3.6l3.4 4V16" />
      <circle cx="7" cy="17.4" r="1.9" /><circle cx="17" cy="17.4" r="1.9" />
      <path d="M2 16h3M8.9 16h6.2M18.9 16H22v-3.5" /></g>
  ),
  halle: (
    <g {...S}><path d="M3 21V9.2L12 4l9 5.2V21" /><path d="M2 21h20" />
      <path d="M8 21v-6.5h8V21" /><path d="M8 18h8" /></g>
  ),
  werkzeug: (
    <g {...S}><path d="M15.6 3.4a5 5 0 0 0-6 6.9l-6 6a2 2 0 0 0 0 2.8l1.3 1.3a2 2 0 0 0 2.8 0l6-6a5 5 0 0 0 6.9-6l-3.1 3.1-2.8-2.8z" /></g>
  ),
  motorgeraet: (
    <g {...S}><rect x="2" y="9" width="9" height="7" rx="1.5" /><path d="M11 10.6h9.4a1.4 1.4 0 0 1 0 2.8H11" />
      <path d="M12.5 9.4v-1M15 9.4v-1M17.5 9.4v-1M20 9.4v-1" /><path d="M4 9V7.4h4.2" /></g>
  ),
  maeher: (
    <g {...S}><path d="M4 14.2h16v-3a2 2 0 0 0-2-2H8.4L4 14.2z" /><circle cx="7" cy="17.6" r="2" />
      <circle cx="17" cy="17.6" r="2" /><path d="M18.6 9.2V6.6a1.6 1.6 0 0 1 1.6-1.6H22" /></g>
  ),
  anhaenger: (
    <g {...S}><rect x="3" y="7.6" width="13.5" height="7" rx="1.2" /><path d="M16.5 11.6H21" />
      <circle cx="8" cy="17.6" r="1.9" /><circle cx="13" cy="17.6" r="1.9" /></g>
  ),
  kiste: (
    <g {...S}><path d="M3 8.2 12 4l9 4.2v7.6L12 20l-9-4.2z" /><path d="m3 8.2 9 4.2 9-4.2M12 12.4V20" /></g>
  ),
};

export default function Symbol({ art, groesse = 22 }) {
  return (
    <svg viewBox="0 0 24 24" width={groesse} height={groesse} aria-hidden="true" className="symbol">
      {PFADE[art] || PFADE.kiste}
    </svg>
  );
}
