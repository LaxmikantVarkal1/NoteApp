export interface BgPattern {
  id: string;
  name: string;
  svg: string;
}

const pb1 = `<svg width="359" height="907" viewBox="0 0 359 907" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<rect opacity="0.5" width="359" height="986" rx="40" fill="url(#pattern0_7_67)"/>
<defs>
<pattern id="pattern0_7_67" patternContentUnits="objectBoundingBox" width="0.195961" height="0.106491">
<use xlink:href="#image0_7_67" transform="scale(0.00292479 0.00106491)"/>
</pattern>
<image id="image0_7_67" width="67" height="100" preserveAspectRatio="none" xlink:href="data:image/png;base64,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"/>
</defs>
</svg>
`

const pb2 = `<svg width="358" height="907" viewBox="0 0 358 907" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<rect opacity="0.7" width="358" height="986" rx="40" fill="url(#pattern0_7_68)"/>
<defs>
<pattern id="pattern0_7_68" patternContentUnits="objectBoundingBox" width="0.768156" height="0.278905">
<use xlink:href="#image0_7_68" transform="scale(0.00186446 0.000676953)"/>
</pattern>
<image id="image0_7_68" width="412" height="412" preserveAspectRatio="none" xlink:href="data:image/png;base64,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"/>
</defs>
</svg>
`

const pb3 = `<svg width="450" height="450" viewBox="0 0 450 450" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<rect opacity="0.5" width="450" height="450" fill="url(#pattern0_1_63)"/>
<defs>
<pattern id="pattern0_1_63" patternContentUnits="objectBoundingBox" width="0.142222" height="0.284444">
<use xlink:href="#image0_1_63" transform="scale(0.00177778)"/>
</pattern>
<image id="image0_1_63" width="80" height="160" preserveAspectRatio="none" xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAACgAgMAAADm7QMnAAAADFBMVEWIiIixsbGxsbGxsbF0SLUbAAAABHRSTlP/bytS3QghxwAAAEVJREFUeAFjYA3FAA4Mq17tWrcalVhBtOBK7IL/McFf4rUPZYtGLRq1aNSiUYtGLSJcoYzWR4PBolGLRi0atWjUotH6CAA67a9q5+gpSAAAAABJRU5ErkJggg=="/>
</defs>
</svg>
`

const pb4 = `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Defines the seamless repeating dot pattern -->
    <pattern id="dot-pattern" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="12" cy="12" r="1.5" fill="#d9e0e84a" />
    </pattern>
  </defs>

  <!-- Fills the full SVG area with the pattern -->
  <rect width="100%" height="100%" fill="url(#dot-pattern)" />
</svg>`

const pb5 = `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Defines the seamless repeating grid line pattern -->
    <pattern id="grid-pattern" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#5e5f602c" stroke-width="1" />
    </pattern>
  </defs>

  <!-- Fills the full SVG area with the pattern -->
  <rect width="100%" height="100%" fill="url(#grid-pattern)" />
</svg>

`

const pb6 = `
<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Defines the seamless repeating horizontal line pattern -->
    <pattern id="line-pattern" x="0" y="0" width="24" height="20" patternUnits="userSpaceOnUse">
      <line x1="0" y1="12" x2="24" y2="12" stroke="#d9e0e84a" stroke-width="1" />
    </pattern>
  </defs>

  <!-- Fills the full SVG area with the pattern -->
  <rect width="100%" height="100%" fill="url(#line-pattern)" />
</svg>
`

export const bgPatterns: BgPattern[] = [
  { id: 'none', name: 'None', svg: '' },
  { id: 'paper', name: 'Paper', svg: pb1 },
  { id: 'texture', name: 'Texture', svg: pb2 },
  { id: 'blocks', name: 'Blocks', svg: pb3 },
  { id: 'dots', name: 'Dots', svg: pb4 },
  { id: 'grid', name: 'Grid', svg: pb5 },
  { id: 'ruled', name: 'Ruled', svg: pb6 },
];

export { pb1, pb2, pb3, pb4, pb5, pb6 };
export default bgPatterns;
