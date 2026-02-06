// Tanzania Coat of Arms - SVG as base64 data URI for embedding in reports
// This is a simplified representation; replace with the actual coat of arms image base64 if available.
export const TRAT_LOGO_BASE64 = `data:image/svg+xml;base64,${Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220" width="200" height="220">
  <!-- Shield -->
  <path d="M100 20 L160 50 L160 120 Q160 170 100 200 Q40 170 40 120 L40 50 Z" fill="#FFD700" stroke="#1a1a1a" stroke-width="2"/>
  <path d="M100 30 L150 55 L150 118 Q150 162 100 190 Q50 162 50 118 L50 55 Z" fill="#00A3DD"/>

  <!-- Horizontal stripes on shield -->
  <rect x="50" y="80" width="100" height="12" fill="#FCD116"/>
  <rect x="50" y="96" width="100" height="12" fill="#1EB53A"/>
  <rect x="50" y="112" width="100" height="12" fill="#000"/>

  <!-- Torch / flame at top -->
  <ellipse cx="100" cy="15" rx="10" ry="12" fill="#FF6600"/>
  <ellipse cx="100" cy="12" rx="6" ry="8" fill="#FFD700"/>

  <!-- Supporters (simplified figures) -->
  <g transform="translate(20,60)">
    <ellipse cx="10" cy="10" rx="8" ry="10" fill="#8B4513"/>
    <rect x="4" y="20" width="12" height="30" fill="#8B4513"/>
    <line x1="10" y1="35" x2="25" y2="50" stroke="#8B4513" stroke-width="3"/>
  </g>
  <g transform="translate(160,60) scale(-1,1)">
    <ellipse cx="10" cy="10" rx="8" ry="10" fill="#8B4513"/>
    <rect x="4" y="20" width="12" height="30" fill="#8B4513"/>
    <line x1="10" y1="35" x2="25" y2="50" stroke="#8B4513" stroke-width="3"/>
  </g>

  <!-- Banner -->
  <path d="M40 195 Q100 210 160 195 L155 210 Q100 225 45 210 Z" fill="#1EB53A"/>
  <text x="100" y="208" text-anchor="middle" fill="white" font-size="8" font-family="Arial" font-weight="bold">UHURU NA UMOJA</text>
</svg>
`).toString('base64')}`;
