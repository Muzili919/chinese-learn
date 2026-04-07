// Pet assets configuration supporting a single dragon pet across levels
// BASE URL for assets can be provided via VITE_PET_ASSETS_BASE (env var in Vite)
export const PET_ASSETS_BASE = import.meta.env.VITE_PET_ASSETS_BASE || ''

// Mapping: groupIndex 0 => 1-10, 1 => 11-20, 2 => 21-30
export const getAssetFor = (groupIndex, state) => {
  // state: 'normal'|'happy'|'upgrade'
  const mapping = {
    0: ['01','02','03'],
    1: ['04','05','06'],
    2: ['07','08','09']
  }
  const idx = mapping[groupIndex] ? mapping[groupIndex][state === 'happy' ? 1 : state === 'upgrade' ? 2 : 0] : '01'
  if (!idx) return null
  // If BASE provided, use that; else fallback to embedded assets
  if (PET_ASSETS_BASE) {
    // allow both SVG/PNG, default to SVG extension
    return `${PET_ASSETS_BASE}/dragon_${idx}.svg`
  }
  // Fallback handled by Pet.jsx with embedded assets
  return null
}
