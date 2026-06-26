export const bgPatterns = [
  {
    id: 'none',
    name: 'None',
    svg: '',
  },
  {
    id: 'dots',
    name: 'Dots',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="4" cy="4" r="1.1" fill="rgba(120,120,120,0.22)"/></svg>`,
  },
  {
    id: 'grid',
    name: 'Grid',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><path d="M28 0H0V28" fill="none" stroke="rgba(120,120,120,0.14)" stroke-width="1"/></svg>`,
  },
  {
    id: 'ruled',
    name: 'Ruled',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M0 31.5H32" fill="none" stroke="rgba(120,120,120,0.18)" stroke-width="1"/></svg>`,
  },
  {
    id: 'diagonal',
    name: 'Diagonal',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><path d="M-7 28L28-7M0 35L35 0" fill="none" stroke="rgba(120,120,120,0.12)" stroke-width="1"/></svg>`,
  },
];

export default bgPatterns;
