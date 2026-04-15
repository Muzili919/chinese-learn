import React from 'react'

// ============================================================
//  宠物 SVG 精灵图系统 — 8只宠物 × 3成长阶段
//  风格：Chibi 圆润卡通，200×200 viewBox
//  stage 1 = Lv 1-10 (幼年)
//  stage 2 = Lv 11-20 (成长期)
//  stage 3 = Lv 21-30 (成熟体/完全体)
// ============================================================

/* ---------- 通用眼睛表情组件 ----------
   emotion: 'normal'|'happy'|'excited'|'bliss'|'laugh'|'cheer'|'sad1'|'sad2'|'sad3'
*/
function Eyes({ lx, ly, rx, ry, size = 9, emotion = 'normal', eyeColor = '#1a1a2e' }) {
  const s = size

  if (emotion === 'happy' || emotion === 'cheer' || emotion === 'bliss') {
    return (
      <g>
        <path d={`M${lx - s} ${ly} a${s} ${s * 0.7} 0 0 1 ${s * 2} 0`}
          stroke={eyeColor} strokeWidth="2.8" fill="none" strokeLinecap="round" />
        <path d={`M${rx - s} ${ry} a${s} ${s * 0.7} 0 0 1 ${s * 2} 0`}
          stroke={eyeColor} strokeWidth="2.8" fill="none" strokeLinecap="round" />
      </g>
    )
  }
  if (emotion === 'laugh') {
    return (
      <g>
        <path d={`M${lx - s} ${ly - s * 0.3} l${s} ${s * 0.8} l${s} -${s * 0.8}`}
          stroke={eyeColor} strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M${rx - s} ${ry - s * 0.3} l${s} ${s * 0.8} l${s} -${s * 0.8}`}
          stroke={eyeColor} strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    )
  }
  if (emotion === 'excited') {
    return (
      <g>
        <ellipse cx={lx} cy={ly} rx={s * 1.15} ry={s * 1.35} fill={eyeColor} />
        <circle cx={lx - s * 0.3} cy={ly - s * 0.4} r={s * 0.32} fill="white" />
        <ellipse cx={rx} cy={ry} rx={s * 1.15} ry={s * 1.35} fill={eyeColor} />
        <circle cx={rx - s * 0.3} cy={ry - s * 0.4} r={s * 0.32} fill="white" />
      </g>
    )
  }
  if (emotion === 'sad1' || emotion === 'sad2' || emotion === 'sad3') {
    return (
      <g>
        <ellipse cx={lx} cy={ly} rx={s * 0.9} ry={s} fill={eyeColor} />
        <ellipse cx={rx} cy={ry} rx={s * 0.9} ry={s} fill={eyeColor} />
        <path d={`M${lx - s} ${ly - s * 1.6} Q${lx} ${ly - s * 1.9} ${lx + s * 0.6} ${ly - s * 1.35}`}
          stroke={eyeColor} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d={`M${rx + s} ${ry - s * 1.6} Q${rx} ${ry - s * 1.9} ${rx - s * 0.6} ${ry - s * 1.35}`}
          stroke={eyeColor} strokeWidth="2" fill="none" strokeLinecap="round" />
        {(emotion === 'sad2' || emotion === 'sad3') && (
          <>
            <ellipse cx={lx} cy={ly + s * 1.8} rx={s * 0.3} ry={s * 0.55} fill="#93c5fd" opacity="0.9" />
            <ellipse cx={rx} cy={ry + s * 1.8} rx={s * 0.3} ry={s * 0.55} fill="#93c5fd" opacity="0.9" />
          </>
        )}
      </g>
    )
  }
  // normal
  return (
    <g>
      <ellipse cx={lx} cy={ly} rx={s * 0.88} ry={s} fill={eyeColor} />
      <circle cx={lx - s * 0.28} cy={ly - s * 0.32} r={s * 0.3} fill="white" />
      <ellipse cx={rx} cy={ry} rx={s * 0.88} ry={s} fill={eyeColor} />
      <circle cx={rx - s * 0.28} cy={ry - s * 0.32} r={s * 0.3} fill="white" />
    </g>
  )
}

// ============================================================
//  🐱 小橘猫 — N级 — lazy
// ============================================================
function KittenSprite({ stage, emotion }) {
  if (stage === 1) return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="118" r="68" fill="#FF9147" />
      <ellipse cx="100" cy="133" rx="36" ry="28" fill="#FFD8A8" />
      <polygon points="56,64 44,24 82,55" fill="#FF9147" />
      <polygon points="60,62 51,34 79,56" fill="#FFB8C8" />
      <polygon points="144,64 156,24 118,55" fill="#FF9147" />
      <polygon points="140,62 149,34 121,56" fill="#FFB8C8" />
      <Eyes lx="82" ly="108" rx="118" ry="108" size="9" emotion={emotion} />
      <polygon points="100,120 95,127 105,127" fill="#FF9FB1" />
      <path d="M95,128 Q100,133 105,128" stroke="#CC4466" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M160,148 Q184,130 178,112" stroke="#E07020" strokeWidth="9" fill="none" strokeLinecap="round" />
    </svg>
  )
  if (stage === 2) return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="152" rx="48" ry="37" fill="#FF9147" />
      <ellipse cx="100" cy="160" rx="29" ry="23" fill="#FFD8A8" />
      <circle cx="100" cy="92" r="52" fill="#FF9147" />
      <path d="M89,63 Q100,57 111,63" stroke="#D05500" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M85,72 Q100,65 115,72" stroke="#D05500" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <polygon points="58,58 48,22 84,50" fill="#FF9147" />
      <polygon points="62,56 54,32 81,50" fill="#FFB8C8" />
      <polygon points="142,58 152,22 116,50" fill="#FF9147" />
      <polygon points="138,56 146,32 119,50" fill="#FFB8C8" />
      <Eyes lx="82" ly="88" rx="118" ry="88" size="10" emotion={emotion} />
      <polygon points="100,101 95,108 105,108" fill="#FF9FB1" />
      <path d="M95,109 Q100,114 105,109" stroke="#CC4466" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <line x1="46" y1="99" x2="89" y2="103" stroke="#c8a07a" strokeWidth="1.3" opacity="0.7" />
      <line x1="46" y1="106" x2="89" y2="107" stroke="#c8a07a" strokeWidth="1.3" opacity="0.7" />
      <line x1="154" y1="99" x2="111" y2="103" stroke="#c8a07a" strokeWidth="1.3" opacity="0.7" />
      <line x1="154" y1="106" x2="111" y2="107" stroke="#c8a07a" strokeWidth="1.3" opacity="0.7" />
      <ellipse cx="70" cy="179" rx="18" ry="12" fill="#FF9147" />
      <ellipse cx="130" cy="179" rx="18" ry="12" fill="#FF9147" />
      <path d="M150,168 Q182,150 176,124 Q170,106 154,112" stroke="#E07020" strokeWidth="10" fill="none" strokeLinecap="round" />
    </svg>
  )
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="154" rx="52" ry="39" fill="#FF9147" />
      <ellipse cx="100" cy="162" rx="31" ry="25" fill="#FFD8A8" />
      <circle cx="100" cy="89" r="54" fill="#FF9147" />
      <text x="81" y="78" fontSize="21" fontWeight="bold" fill="#D05500" fontFamily="sans-serif">王</text>
      <polygon points="57,53 44,16 82,46" fill="#FF9147" />
      <polygon points="61,51 53,26 79,46" fill="#FFB8C8" />
      <polygon points="143,53 156,16 118,46" fill="#FF9147" />
      <polygon points="139,51 147,26 121,46" fill="#FFB8C8" />
      <Eyes lx="81" ly="87" rx="119" ry="87" size="11" emotion={emotion} />
      <polygon points="100,102 94,110 106,110" fill="#FF9FB1" />
      <path d="M94,111 Q100,117 106,111" stroke="#CC4466" strokeWidth="2" fill="none" strokeLinecap="round" />
      <line x1="40" y1="99" x2="87" y2="103" stroke="#c8a07a" strokeWidth="1.4" opacity="0.7" />
      <line x1="40" y1="106" x2="87" y2="108" stroke="#c8a07a" strokeWidth="1.4" opacity="0.7" />
      <line x1="40" y1="113" x2="87" y2="113" stroke="#c8a07a" strokeWidth="1.4" opacity="0.7" />
      <line x1="160" y1="99" x2="113" y2="103" stroke="#c8a07a" strokeWidth="1.4" opacity="0.7" />
      <line x1="160" y1="106" x2="113" y2="108" stroke="#c8a07a" strokeWidth="1.4" opacity="0.7" />
      <line x1="160" y1="113" x2="113" y2="113" stroke="#c8a07a" strokeWidth="1.4" opacity="0.7" />
      <ellipse cx="67" cy="181" rx="20" ry="13" fill="#FF9147" />
      <ellipse cx="133" cy="181" rx="20" ry="13" fill="#FF9147" />
      <path d="M150,171 Q190,149 184,120 Q178,100 158,108 Q144,115 150,126" stroke="#E07020" strokeWidth="12" fill="none" strokeLinecap="round" />
      <circle cx="150" cy="126" r="7" fill="#FFD8A8" />
    </svg>
  )
}

// ============================================================
//  🐶 小柴犬 — N级 — loyal
// ============================================================
function PuppySprite({ stage, emotion }) {
  if (stage === 1) return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="120" r="64" fill="#E8904A" />
      <ellipse cx="100" cy="136" rx="39" ry="30" fill="#F3CA8C" />
      <ellipse cx="54" cy="88" rx="22" ry="40" fill="#C05E18" transform="rotate(-22,54,88)" />
      <ellipse cx="146" cy="88" rx="22" ry="40" fill="#C05E18" transform="rotate(22,146,88)" />
      <Eyes lx="82" ly="113" rx="118" ry="113" size="9" emotion={emotion} />
      <ellipse cx="100" cy="128" rx="9" ry="7" fill="#3a1e00" />
      <circle cx="96" cy="125" r="2.5" fill="white" opacity="0.55" />
      <ellipse cx="162" cy="116" rx="12" ry="9" fill="#C05E18" transform="rotate(25,162,116)" />
    </svg>
  )
  if (stage === 2) return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="152" rx="46" ry="36" fill="#E8904A" />
      <ellipse cx="100" cy="159" rx="28" ry="22" fill="#F3CA8C" />
      <circle cx="100" cy="92" r="50" fill="#E8904A" />
      <ellipse cx="100" cy="104" rx="35" ry="30" fill="#F3CA8C" />
      <ellipse cx="57" cy="60" rx="20" ry="35" fill="#C05E18" transform="rotate(-12,57,60)" />
      <ellipse cx="143" cy="60" rx="20" ry="35" fill="#C05E18" transform="rotate(12,143,60)" />
      <Eyes lx="82" ly="87" rx="118" ry="87" size="10" emotion={emotion} />
      <ellipse cx="100" cy="104" rx="10" ry="8" fill="#3a1e00" />
      <circle cx="96" cy="101" r="2.8" fill="white" opacity="0.55" />
      <ellipse cx="70" cy="179" rx="16" ry="11" fill="#E8904A" />
      <ellipse cx="130" cy="179" rx="16" ry="11" fill="#E8904A" />
      <path d="M144,162 Q178,146 174,124 Q170,108 154,116" stroke="#C05E18" strokeWidth="11" fill="none" strokeLinecap="round" />
    </svg>
  )
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="153" rx="50" ry="38" fill="#E8904A" />
      <ellipse cx="100" cy="161" rx="30" ry="24" fill="#F3CA8C" />
      <circle cx="100" cy="88" r="52" fill="#E8904A" />
      <ellipse cx="100" cy="101" rx="37" ry="31" fill="#F3CA8C" />
      <polygon points="53,54 43,16 80,48" fill="#E8904A" />
      <polygon points="57,53 49,26 77,48" fill="#C05E18" />
      <polygon points="147,54 157,16 120,48" fill="#E8904A" />
      <polygon points="143,53 151,26 123,48" fill="#C05E18" />
      <Eyes lx="81" ly="85" rx="119" ry="85" size="11" emotion={emotion} />
      <ellipse cx="100" cy="102" rx="11" ry="9" fill="#3a1e00" />
      <circle cx="96" cy="99" r="3" fill="white" opacity="0.6" />
      <path d="M92,114 Q100,121 108,114" fill="#FF6B8A" stroke="none" />
      <ellipse cx="100" cy="117" rx="7" ry="5" fill="#FF6B8A" />
      <ellipse cx="67" cy="181" rx="18" ry="13" fill="#E8904A" />
      <ellipse cx="133" cy="181" rx="18" ry="13" fill="#E8904A" />
      <circle cx="61" cy="186" r="3.5" fill="#C05E18" opacity="0.5" />
      <circle cx="70" cy="188" r="3.5" fill="#C05E18" opacity="0.5" />
      <circle cx="79" cy="186" r="3.5" fill="#C05E18" opacity="0.5" />
      <path d="M147,166 Q184,150 181,124 Q178,104 162,110 Q147,116 152,129 Q156,141 147,149" stroke="#E8904A" strokeWidth="13" fill="none" strokeLinecap="round" />
      <path d="M152,129 Q156,141 147,149" stroke="#F3CA8C" strokeWidth="6" fill="none" strokeLinecap="round" />
    </svg>
  )
}

// ============================================================
//  🦊 灵狐 — R级 — smart
// ============================================================
function FoxSprite({ stage, emotion }) {
  if (stage === 1) return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="148" rx="76" ry="55" fill="#FF6820" />
      <ellipse cx="100" cy="169" rx="46" ry="28" fill="#F5F0E8" />
      <circle cx="100" cy="90" r="38" fill="#FF6820" />
      <ellipse cx="100" cy="99" rx="25" ry="22" fill="#F5F0E8" />
      <polygon points="72,64 61,26 91,59" fill="#FF6820" />
      <polygon points="75,62 67,36 89,59" fill="#FFB8C0" />
      <polygon points="128,64 139,26 109,59" fill="#FF6820" />
      <polygon points="125,62 133,36 111,59" fill="#FFB8C0" />
      <Eyes lx="85" ly="87" rx="115" ry="87" size="9" emotion={emotion} eyeColor="#2d1a00" />
      <ellipse cx="100" cy="99" rx="6" ry="5" fill="#CC3300" />
    </svg>
  )
  if (stage === 2) return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <path d="M148,166 Q187,138 184,106 Q181,83 163,90 Q145,97 149,116 Q152,131 140,146" stroke="#FF6820" strokeWidth="23" fill="none" strokeLinecap="round" />
      <circle cx="142" cy="146" r="14" fill="#F5F0E8" />
      <ellipse cx="100" cy="151" rx="44" ry="34" fill="#FF6820" />
      <ellipse cx="100" cy="158" rx="26" ry="20" fill="#F5F0E8" />
      <ellipse cx="100" cy="87" rx="48" ry="44" fill="#FF6820" />
      <ellipse cx="100" cy="100" rx="32" ry="28" fill="#F5F0E8" />
      <polygon points="61,53 49,16 82,46" fill="#FF6820" />
      <polygon points="65,51 56,26 80,46" fill="#FFB8C0" />
      <polygon points="139,53 151,16 118,46" fill="#FF6820" />
      <polygon points="135,51 144,26 120,46" fill="#FFB8C0" />
      <circle cx="55" cy="19" r="6" fill="#F5F0E8" />
      <circle cx="145" cy="19" r="6" fill="#F5F0E8" />
      <Eyes lx="82" ly="84" rx="118" ry="84" size="10" emotion={emotion} eyeColor="#2d1a00" />
      <ellipse cx="100" cy="102" rx="8" ry="6" fill="#CC3300" />
      <circle cx="97" cy="99" r="2" fill="white" opacity="0.5" />
    </svg>
  )
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <path d="M148,158 Q197,128 190,88 Q185,66 168,75" stroke="#FF6820" strokeWidth="14" fill="none" strokeLinecap="round" opacity="0.45" />
      <path d="M143,163 Q193,148 189,116 Q186,93 170,99" stroke="#FF6820" strokeWidth="13" fill="none" strokeLinecap="round" opacity="0.6" />
      <path d="M142,168 Q186,158 183,134 Q181,117 165,122" stroke="#FF6820" strokeWidth="15" fill="none" strokeLinecap="round" opacity="0.75" />
      <path d="M138,173 Q178,168 176,148 Q175,132 160,136" stroke="#FF8030" strokeWidth="14" fill="none" strokeLinecap="round" opacity="0.88" />
      <path d="M135,177 Q168,174 168,159 Q168,147 154,150" stroke="#FF9940" strokeWidth="13" fill="none" strokeLinecap="round" />
      <path d="M144,171 Q178,160 178,145 Q178,129 162,133" stroke="#FFAA50" strokeWidth="17" fill="none" strokeLinecap="round" />
      <circle cx="162" cy="133" r="11" fill="#FFF8E8" opacity="0.85" />
      <ellipse cx="100" cy="153" rx="48" ry="36" fill="#FF6820" />
      <ellipse cx="100" cy="160" rx="28" ry="22" fill="#F5F0E8" />
      <ellipse cx="100" cy="85" rx="50" ry="46" fill="#FF6820" />
      <ellipse cx="100" cy="99" rx="34" ry="30" fill="#F5F0E8" />
      <polygon points="57,50 43,10 80,43" fill="#FF6820" />
      <polygon points="61,48 51,20 78,43" fill="#FFB8C0" />
      <circle cx="50" cy="14" r="7" fill="#F5F0E8" />
      <polygon points="143,50 157,10 120,43" fill="#FF6820" />
      <polygon points="139,48 149,20 122,43" fill="#FFB8C0" />
      <circle cx="150" cy="14" r="7" fill="#F5F0E8" />
      <Eyes lx="81" ly="83" rx="119" ry="83" size="11" emotion={emotion} eyeColor="#2d1a00" />
      {emotion === 'normal' && (
        <>
          <ellipse cx="81" cy="83" rx="4" ry="11" fill="#8B4000" opacity="0.55" />
          <ellipse cx="119" cy="83" rx="4" ry="11" fill="#8B4000" opacity="0.55" />
        </>
      )}
      <ellipse cx="100" cy="102" rx="9" ry="7" fill="#CC3300" />
      <circle cx="97" cy="99" r="2.5" fill="white" opacity="0.5" />
      <path d="M44,27 Q38,16 42,8 Q48,16 44,27" fill="#FFB020" opacity="0.65" />
      <path d="M156,27 Q162,16 158,8 Q152,16 156,27" fill="#FFB020" opacity="0.65" />
    </svg>
  )
}

// ============================================================
//  🐼 滚滚 — R级 — clumsy
// ============================================================
function PandaSprite({ stage, emotion }) {
  if (stage === 1) return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="118" r="70" fill="#F5F5F5" />
      <circle cx="62" cy="60" r="25" fill="#1a1a2e" />
      <circle cx="138" cy="60" r="25" fill="#1a1a2e" />
      <ellipse cx="80" cy="106" rx="20" ry="18" fill="#1a1a2e" />
      <ellipse cx="120" cy="106" rx="20" ry="18" fill="#1a1a2e" />
      <Eyes lx="80" ly="106" rx="120" ry="106" size="9" emotion={emotion} eyeColor="#F5F5F5" />
      {emotion === 'normal' && (
        <>
          <circle cx="80" cy="106" r="5" fill="#1a1a2e" />
          <circle cx="78" cy="104" r="1.6" fill="white" />
          <circle cx="120" cy="106" r="5" fill="#1a1a2e" />
          <circle cx="118" cy="104" r="1.6" fill="white" />
        </>
      )}
      <ellipse cx="100" cy="123" rx="9" ry="7" fill="#2a2a3e" />
      <path d="M95,131 Q100,137 105,131" stroke="#2a2a3e" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <circle cx="72" cy="179" r="18" fill="#1a1a2e" />
      <circle cx="128" cy="179" r="18" fill="#1a1a2e" />
    </svg>
  )
  if (stage === 2) return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="153" rx="50" ry="40" fill="#F5F5F5" />
      <ellipse cx="67" cy="161" rx="22" ry="26" fill="#1a1a2e" />
      <ellipse cx="133" cy="161" rx="22" ry="26" fill="#1a1a2e" />
      <circle cx="100" cy="92" r="52" fill="#F5F5F5" />
      <circle cx="59" cy="51" r="24" fill="#1a1a2e" />
      <circle cx="141" cy="51" r="24" fill="#1a1a2e" />
      <ellipse cx="81" cy="87" rx="19" ry="17" fill="#1a1a2e" />
      <ellipse cx="119" cy="87" rx="19" ry="17" fill="#1a1a2e" />
      <Eyes lx="81" ly="87" rx="119" ry="87" size="9.5" emotion={emotion} eyeColor="#F5F5F5" />
      {emotion === 'normal' && (
        <>
          <circle cx="81" cy="87" r="5.5" fill="#1a1a2e" />
          <circle cx="79" cy="85" r="1.8" fill="white" />
          <circle cx="119" cy="87" r="5.5" fill="#1a1a2e" />
          <circle cx="117" cy="85" r="1.8" fill="white" />
        </>
      )}
      <ellipse cx="100" cy="104" rx="10" ry="8" fill="#2a2a3e" />
      <circle cx="97" cy="101" r="2.5" fill="white" opacity="0.4" />
      <path d="M94,113 Q100,119 106,113" stroke="#2a2a3e" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <ellipse cx="70" cy="183" rx="16" ry="12" fill="#1a1a2e" />
      <ellipse cx="130" cy="183" rx="16" ry="12" fill="#1a1a2e" />
    </svg>
  )
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="48" width="8" height="132" rx="4" fill="#4CAF50" />
      <rect x="20" y="79" width="8" height="6" rx="2" fill="#388E3C" />
      <rect x="20" y="109" width="8" height="6" rx="2" fill="#388E3C" />
      <rect x="20" y="139" width="8" height="6" rx="2" fill="#388E3C" />
      <ellipse cx="16" cy="54" rx="11" ry="5" fill="#66BB6A" transform="rotate(-30,16,54)" />
      <ellipse cx="32" cy="50" rx="11" ry="5" fill="#66BB6A" transform="rotate(25,32,50)" />
      <ellipse cx="105" cy="153" rx="52" ry="40" fill="#F5F5F5" />
      <ellipse cx="70" cy="163" rx="24" ry="28" fill="#1a1a2e" />
      <ellipse cx="140" cy="163" rx="24" ry="28" fill="#1a1a2e" />
      <circle cx="105" cy="87" r="54" fill="#F5F5F5" />
      <circle cx="62" cy="46" r="26" fill="#1a1a2e" />
      <circle cx="148" cy="46" r="26" fill="#1a1a2e" />
      <ellipse cx="84" cy="85" rx="21" ry="19" fill="#1a1a2e" transform="rotate(-10,84,85)" />
      <ellipse cx="126" cy="85" rx="21" ry="19" fill="#1a1a2e" transform="rotate(10,126,85)" />
      <Eyes lx="84" ly="85" rx="126" ry="85" size="10.5" emotion={emotion} eyeColor="#F5F5F5" />
      {emotion === 'normal' && (
        <>
          <circle cx="84" cy="85" r="6" fill="#1a1a2e" />
          <circle cx="81.5" cy="82.5" r="2" fill="white" />
          <circle cx="126" cy="85" r="6" fill="#1a1a2e" />
          <circle cx="123.5" cy="82.5" r="2" fill="white" />
        </>
      )}
      <ellipse cx="105" cy="103" rx="11" ry="9" fill="#2a2a3e" />
      <circle cx="101" cy="100" r="2.8" fill="white" opacity="0.4" />
      <path d="M99,114 Q105,121 111,114" stroke="#2a2a3e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <ellipse cx="70" cy="183" rx="18" ry="13" fill="#1a1a2e" />
      <ellipse cx="140" cy="183" rx="18" ry="13" fill="#1a1a2e" />
      <ellipse cx="40" cy="156" rx="16" ry="12" fill="#1a1a2e" transform="rotate(-48,40,156)" />
    </svg>
  )
}

// ============================================================
//  🐉 无牙仔 — SR级 — tsundere
// ============================================================
function ToothlessSprite({ stage, emotion }) {
  if (stage === 1) return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="120" r="62" fill="#1a1a2e" />
      <ellipse cx="85" cy="94" rx="30" ry="20" fill="#16213e" opacity="0.65" />
      <ellipse cx="62" cy="64" rx="15" ry="35" fill="#0f3460" transform="rotate(-22,62,64)" />
      <ellipse cx="62" cy="64" rx="10" ry="25" fill="#1a1a2e" transform="rotate(-22,62,64)" />
      <ellipse cx="138" cy="64" rx="15" ry="35" fill="#0f3460" transform="rotate(22,138,64)" />
      <ellipse cx="138" cy="64" rx="10" ry="25" fill="#1a1a2e" transform="rotate(22,138,64)" />
      <ellipse cx="82" cy="113" rx="14" ry="16" fill="#00b386" />
      <ellipse cx="118" cy="113" rx="14" ry="16" fill="#00b386" />
      <ellipse cx="82" cy="113" rx="5" ry="14" fill="#0d0d1a" />
      <ellipse cx="118" cy="113" rx="5" ry="14" fill="#0d0d1a" />
      <circle cx="86" cy="107" r="3" fill="white" opacity="0.75" />
      <circle cx="122" cy="107" r="3" fill="white" opacity="0.75" />
      <path d="M85,136 Q100,146 115,136" stroke="#0f3460" strokeWidth="3.2" fill="#0a0a1e" strokeLinecap="round" />
      <path d="M156,149 Q182,138 176,122" stroke="#1a1a2e" strokeWidth="14" fill="none" strokeLinecap="round" />
      <ellipse cx="178" cy="120" rx="12" ry="18" fill="#0f3460" transform="rotate(28,178,120)" />
    </svg>
  )
  if (stage === 2) return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <path d="M64,119 Q23,88 26,60 Q47,72 65,92" fill="#0f3460" opacity="0.88" />
      <path d="M136,119 Q177,88 174,60 Q153,72 135,92" fill="#0f3460" opacity="0.88" />
      <ellipse cx="100" cy="148" rx="44" ry="34" fill="#1a1a2e" />
      <ellipse cx="100" cy="89" rx="52" ry="46" fill="#1a1a2e" />
      <ellipse cx="88" cy="75" rx="25" ry="18" fill="#1e2d5a" opacity="0.55" />
      <ellipse cx="60" cy="54" rx="14" ry="33" fill="#0f3460" transform="rotate(-26,60,54)" />
      <ellipse cx="60" cy="54" rx="9" ry="23" fill="#1a1a2e" transform="rotate(-26,60,54)" />
      <ellipse cx="140" cy="54" rx="14" ry="33" fill="#0f3460" transform="rotate(26,140,54)" />
      <ellipse cx="140" cy="54" rx="9" ry="23" fill="#1a1a2e" transform="rotate(26,140,54)" />
      <ellipse cx="82" cy="87" rx="14" ry="16" fill="#00c896" />
      <ellipse cx="118" cy="87" rx="14" ry="16" fill="#00c896" />
      <ellipse cx="82" cy="87" rx="5" ry="14" fill="#0d0d1a" />
      <ellipse cx="118" cy="87" rx="5" ry="14" fill="#0d0d1a" />
      <circle cx="86" cy="81" r="3.5" fill="white" opacity="0.78" />
      <circle cx="122" cy="81" r="3.5" fill="white" opacity="0.78" />
      <path d="M83,108 Q100,118 117,108" stroke="#0f3460" strokeWidth="3.5" fill="#0a0a1e" strokeLinecap="round" />
      <path d="M140,162 Q177,148 174,127" stroke="#1a1a2e" strokeWidth="13" fill="none" strokeLinecap="round" />
      <ellipse cx="176" cy="124" rx="14" ry="20" fill="#0f3460" transform="rotate(24,176,124)" />
      <ellipse cx="176" cy="124" rx="9" ry="14" fill="#1a1a2e" transform="rotate(24,176,124)" />
    </svg>
  )
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <path d="M61,126 Q7,74 14,33 Q42,54 62,89" fill="#0f3460" />
      <path d="M139,126 Q193,74 186,33 Q158,54 138,89" fill="#0f3460" />
      <circle cx="16" cy="36" r="5" fill="#16213e" />
      <circle cx="184" cy="36" r="5" fill="#16213e" />
      <ellipse cx="100" cy="153" rx="48" ry="36" fill="#1a1a2e" />
      <ellipse cx="100" cy="149" rx="38" ry="28" fill="#16213e" opacity="0.65" />
      <ellipse cx="100" cy="87" rx="54" ry="50" fill="#1a1a2e" />
      <ellipse cx="88" cy="73" rx="28" ry="20" fill="#1e2d5a" opacity="0.58" />
      <ellipse cx="56" cy="47" rx="14" ry="34" fill="#0f3460" transform="rotate(-29,56,47)" />
      <ellipse cx="56" cy="47" rx="9" ry="24" fill="#1a1a2e" transform="rotate(-29,56,47)" />
      <ellipse cx="144" cy="47" rx="14" ry="34" fill="#0f3460" transform="rotate(29,144,47)" />
      <ellipse cx="144" cy="47" rx="9" ry="24" fill="#1a1a2e" transform="rotate(29,144,47)" />
      <ellipse cx="80" cy="85" rx="16" ry="18" fill="#00e5aa" />
      <ellipse cx="120" cy="85" rx="16" ry="18" fill="#00e5aa" />
      <ellipse cx="80" cy="85" rx="5.5" ry="16" fill="#090912" />
      <ellipse cx="120" cy="85" rx="5.5" ry="16" fill="#090912" />
      <circle cx="85" cy="78" r="4" fill="white" opacity="0.82" />
      <circle cx="125" cy="78" r="4" fill="white" opacity="0.82" />
      <rect x="91" y="108" width="5" height="8" rx="2.5" fill="white" />
      <rect x="99" y="109" width="5" height="8" rx="2.5" fill="white" />
      <rect x="107" y="108" width="5" height="8" rx="2.5" fill="white" />
      <path d="M84,107 Q100,118 116,107" stroke="#090912" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M143,166 Q181,148 179,127" stroke="#1a1a2e" strokeWidth="14" fill="none" strokeLinecap="round" />
      <ellipse cx="181" cy="124" rx="16" ry="22" fill="#0f3460" transform="rotate(21,181,124)" />
      <ellipse cx="181" cy="124" rx="10" ry="15" fill="#1a1a2e" transform="rotate(21,181,124)" />
      <ellipse cx="100" cy="87" rx="54" ry="50" fill="none" stroke="#4a90e2" strokeWidth="1.5" opacity="0.28" />
      <ellipse cx="71" cy="182" rx="16" ry="11" fill="#1a1a2e" />
      <ellipse cx="129" cy="182" rx="16" ry="11" fill="#1a1a2e" />
    </svg>
  )
}

// ============================================================
//  🔥 小凤凰 — SR级 — noble
// ============================================================
function PhoenixSprite({ stage, emotion }) {
  if (stage === 1) return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="115" r="58" fill="#FF8C00" />
      <ellipse cx="74" cy="100" rx="22" ry="18" fill="#FF4500" transform="rotate(-16,74,100)" />
      <ellipse cx="126" cy="100" rx="22" ry="18" fill="#FFD700" transform="rotate(16,126,100)" />
      <ellipse cx="100" cy="84" rx="20" ry="14" fill="#FF6B35" transform="rotate(5,100,84)" />
      <ellipse cx="87" cy="130" rx="18" ry="13" fill="#FFD700" transform="rotate(-12,87,130)" />
      <ellipse cx="113" cy="130" rx="18" ry="13" fill="#FF4500" transform="rotate(12,113,130)" />
      <circle cx="100" cy="105" r="28" fill="#FFAA30" />
      <Eyes lx="87" ly="100" rx="113" ry="100" size="8" emotion={emotion} eyeColor="#8B2500" />
      <polygon points="100,112 95,119 105,119" fill="#FF5500" />
      <path d="M93,78 Q100,62 107,78" stroke="#FFD700" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <path d="M86,81 Q91,65 97,80" stroke="#FF4500" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M103,80 Q109,64 114,81" stroke="#FF8C00" strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  )
  if (stage === 2) return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <path d="M100,171 Q83,196 73,189" stroke="#FFD700" strokeWidth="8.5" fill="none" strokeLinecap="round" />
      <path d="M100,171 Q100,199 100,193" stroke="#FF8C00" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M100,171 Q117,196 127,189" stroke="#FF4500" strokeWidth="8.5" fill="none" strokeLinecap="round" />
      <path d="M64,119 Q26,94 28,70 Q51,81 67,101" fill="#FF8C00" opacity="0.88" />
      <path d="M136,119 Q174,94 172,70 Q149,81 133,101" fill="#FF8C00" opacity="0.88" />
      <circle cx="29" cy="73" r="8" fill="#FFD700" opacity="0.72" />
      <circle cx="171" cy="73" r="8" fill="#FFD700" opacity="0.72" />
      <ellipse cx="100" cy="149" rx="42" ry="32" fill="#FF8C00" />
      <ellipse cx="100" cy="155" rx="24" ry="18" fill="#FFAA30" />
      <circle cx="100" cy="89" r="48" fill="#FF8C00" />
      <ellipse cx="100" cy="98" rx="32" ry="28" fill="#FFAA30" />
      <path d="M84,54 Q87,30 92,50" stroke="#FFD700" strokeWidth="5.5" fill="none" strokeLinecap="round" />
      <path d="M92,50 Q100,24 108,50" stroke="#FF4500" strokeWidth="6.5" fill="none" strokeLinecap="round" />
      <path d="M108,50 Q113,30 116,54" stroke="#FFD700" strokeWidth="5.5" fill="none" strokeLinecap="round" />
      <circle cx="87" cy="31" r="4.5" fill="#FFD700" />
      <circle cx="100" cy="25" r="5" fill="#FF4500" />
      <circle cx="113" cy="31" r="4.5" fill="#FFD700" />
      <Eyes lx="83" ly="87" rx="117" ry="87" size="10" emotion={emotion} eyeColor="#8B2500" />
      <polygon points="100,104 94,113 106,113" fill="#FF5500" />
    </svg>
  )
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <path d="M100,172 Q70,199 56,193" stroke="#FFD700" strokeWidth="7.5" fill="none" strokeLinecap="round" />
      <path d="M100,172 Q81,200 74,196" stroke="#FF6B35" strokeWidth="7.5" fill="none" strokeLinecap="round" />
      <path d="M100,172 Q100,200 100,196" stroke="#FFD700" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M100,172 Q119,200 126,196" stroke="#FF6B35" strokeWidth="7.5" fill="none" strokeLinecap="round" />
      <path d="M100,172 Q130,199 144,193" stroke="#FFD700" strokeWidth="7.5" fill="none" strokeLinecap="round" />
      <circle cx="56" cy="193" r="6.5" fill="#FFA000" opacity="0.92" />
      <circle cx="100" cy="196" r="7.5" fill="#FF4500" opacity="0.92" />
      <circle cx="144" cy="193" r="6.5" fill="#FFA000" opacity="0.92" />
      <path d="M59,121 Q10,79 13,40 Q44,59 64,95" fill="#FF8C00" />
      <path d="M141,121 Q190,79 187,40 Q156,59 136,95" fill="#FF8C00" />
      <path d="M59,121 Q10,79 13,40 Q44,59 64,95" fill="none" stroke="#FFD700" strokeWidth="1.8" opacity="0.5" />
      <path d="M141,121 Q190,79 187,40 Q156,59 136,95" fill="none" stroke="#FFD700" strokeWidth="1.8" opacity="0.5" />
      <circle cx="17" cy="44" r="9.5" fill="#FFD700" opacity="0.82" />
      <circle cx="183" cy="44" r="9.5" fill="#FFD700" opacity="0.82" />
      <ellipse cx="100" cy="151" rx="46" ry="34" fill="#FF8C00" />
      <ellipse cx="100" cy="157" rx="26" ry="20" fill="#FFAA30" />
      <circle cx="100" cy="87" r="50" fill="#FF8C00" />
      <ellipse cx="100" cy="97" rx="34" ry="30" fill="#FFAA30" />
      <path d="M74,53 Q79,26 85,48" stroke="#FFD700" strokeWidth="5.8" fill="none" strokeLinecap="round" />
      <path d="M84,48 Q89,20 95,44" stroke="#FF4500" strokeWidth="6.5" fill="none" strokeLinecap="round" />
      <path d="M95,44 Q100,16 105,44" stroke="#FFD700" strokeWidth="7.5" fill="none" strokeLinecap="round" />
      <path d="M105,44 Q111,20 116,48" stroke="#FF4500" strokeWidth="6.5" fill="none" strokeLinecap="round" />
      <path d="M116,48 Q121,26 126,53" stroke="#FFD700" strokeWidth="5.8" fill="none" strokeLinecap="round" />
      <circle cx="81" cy="27" r="5.5" fill="#FFD700" />
      <circle cx="91" cy="20" r="6" fill="#FF4500" />
      <circle cx="100" cy="16" r="6.5" fill="#FFD700" />
      <circle cx="109" cy="20" r="6" fill="#FF4500" />
      <circle cx="119" cy="27" r="5.5" fill="#FFD700" />
      <Eyes lx="82" ly="85" rx="118" ry="85" size="11" emotion={emotion} eyeColor="#8B2500" />
      <polygon points="100,103 93,114 107,114" fill="#FF5500" />
      <ellipse cx="100" cy="87" rx="50" ry="50" fill="none" stroke="#FFD700" strokeWidth="2.2" opacity="0.22" />
    </svg>
  )
}

// ============================================================
//  🐲 龙王 — SSR级 — majestic
// ============================================================
function DragonKingSprite({ stage, emotion }) {
  if (stage === 1) return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="138" rx="56" ry="46" fill="#FFD700" />
      <ellipse cx="100" cy="149" rx="38" ry="32" fill="#FFF5B0" />
      <circle cx="100" cy="88" r="52" fill="#FFD700" />
      <path d="M78,44 Q71,16 82,27" stroke="#B8860B" strokeWidth="6.5" fill="none" strokeLinecap="round" />
      <path d="M122,44 Q129,16 118,27" stroke="#B8860B" strokeWidth="6.5" fill="none" strokeLinecap="round" />
      <path d="M86,105 Q69,99 53,102" stroke="#B8860B" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <path d="M86,111 Q69,108 53,108" stroke="#B8860B" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <path d="M114,105 Q131,99 147,102" stroke="#B8860B" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <path d="M114,111 Q131,108 147,108" stroke="#B8860B" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <Eyes lx="82" ly="88" rx="118" ry="88" size="11" emotion={emotion} eyeColor="#8B2500" />
      {emotion === 'normal' && (
        <>
          <circle cx="87" cy="83" r="3.5" fill="#FFF5B0" opacity="0.72" />
          <circle cx="123" cy="83" r="3.5" fill="#FFF5B0" opacity="0.72" />
        </>
      )}
      <ellipse cx="100" cy="103" rx="9" ry="7" fill="#CC7700" />
      <path d="M54,148 Q20,127 24,106 Q42,117 55,132" fill="#DAA520" opacity="0.75" />
      <path d="M146,148 Q180,127 176,106 Q158,117 145,132" fill="#DAA520" opacity="0.75" />
      <ellipse cx="72" cy="176" rx="17" ry="12" fill="#FFD700" />
      <ellipse cx="128" cy="176" rx="17" ry="12" fill="#FFD700" />
      <path d="M64,181 L62,189" stroke="#B8860B" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M70,183 L70,191" stroke="#B8860B" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M76,181 L78,189" stroke="#B8860B" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  )
  if (stage === 2) return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <path d="M100,173 Q126,156 139,141 Q152,126 146,108 Q141,92 129,90" stroke="#FFD700" strokeWidth="29" fill="none" strokeLinecap="round" />
      <path d="M100,173 Q126,156 139,141 Q152,126 146,108 Q141,92 129,90" stroke="#FFF5B0" strokeWidth="18" fill="none" strokeLinecap="round" opacity="0.72" />
      <ellipse cx="100" cy="149" rx="46" ry="34" fill="#FFD700" />
      <ellipse cx="100" cy="156" rx="30" ry="22" fill="#FFF5B0" />
      <ellipse cx="100" cy="85" rx="52" ry="46" fill="#FFD700" />
      <path d="M75,47 Q67,18 80,31" stroke="#B8860B" strokeWidth="7.5" fill="none" strokeLinecap="round" />
      <path d="M125,47 Q133,18 120,31" stroke="#B8860B" strokeWidth="7.5" fill="none" strokeLinecap="round" />
      <circle cx="69" cy="20" r="5.5" fill="#DAA520" />
      <circle cx="131" cy="20" r="5.5" fill="#DAA520" />
      <path d="M83,101 Q59,95 36,98" stroke="#B8860B" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M83,108 Q59,106 36,106" stroke="#B8860B" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M117,101 Q141,95 164,98" stroke="#B8860B" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M117,108 Q141,106 164,106" stroke="#B8860B" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Eyes lx="82" ly="84" rx="118" ry="84" size="12" emotion={emotion} eyeColor="#8B2500" />
      {emotion === 'normal' && (
        <>
          <circle cx="88" cy="78" r="4" fill="#FFF5B0" opacity="0.72" />
          <circle cx="124" cy="78" r="4" fill="#FFF5B0" opacity="0.72" />
        </>
      )}
      <ellipse cx="100" cy="100" rx="10" ry="8" fill="#CC7700" />
      <path d="M82,51 Q100,41 118,51" stroke="#DAA520" strokeWidth="3.5" fill="none" />
    </svg>
  )
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="155" r="12" fill="#FFF5B0" opacity="0.52" />
      <circle cx="40" cy="148" r="16" fill="#FFF5B0" opacity="0.52" />
      <circle cx="20" cy="145" r="10" fill="#FFF5B0" opacity="0.44" />
      <circle cx="172" cy="155" r="12" fill="#FFF5B0" opacity="0.52" />
      <circle cx="160" cy="148" r="16" fill="#FFF5B0" opacity="0.52" />
      <circle cx="180" cy="145" r="10" fill="#FFF5B0" opacity="0.44" />
      <path d="M100,173 Q133,163 149,149 Q165,134 159,118 Q153,104 139,108 Q128,112 130,124" stroke="#FFD700" strokeWidth="25" fill="none" strokeLinecap="round" />
      <path d="M100,173 Q133,163 149,149 Q165,134 159,118 Q153,104 139,108 Q128,112 130,124" stroke="#FFF5B0" strokeWidth="15" fill="none" strokeLinecap="round" opacity="0.62" />
      <path d="M151,153 L159,142" stroke="#B8860B" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M161,141 L169,130" stroke="#B8860B" strokeWidth="4.5" strokeLinecap="round" />
      <ellipse cx="100" cy="151" rx="50" ry="36" fill="#FFD700" />
      <ellipse cx="100" cy="159" rx="32" ry="24" fill="#FFF5B0" />
      <path d="M54,129 Q8,89 11,50 Q42,71 62,103" fill="#DAA520" opacity="0.88" />
      <path d="M146,129 Q192,89 189,50 Q158,71 138,103" fill="#DAA520" opacity="0.88" />
      <path d="M54,129 Q8,89 11,50 Q42,71 62,103" fill="none" stroke="#B8860B" strokeWidth="1.8" opacity="0.52" />
      <path d="M146,129 Q192,89 189,50 Q158,71 138,103" fill="none" stroke="#B8860B" strokeWidth="1.8" opacity="0.52" />
      <path d="M14,54 L28,67" stroke="#B8860B" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M186,54 L172,67" stroke="#B8860B" strokeWidth="3.5" strokeLinecap="round" />
      <ellipse cx="100" cy="83" rx="54" ry="48" fill="#FFD700" />
      <ellipse cx="88" cy="69" rx="30" ry="22" fill="#DAA520" opacity="0.38" />
      <path d="M71,44 Q60,12 76,25" stroke="#B8860B" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M129,44 Q140,12 124,25" stroke="#B8860B" strokeWidth="9" fill="none" strokeLinecap="round" />
      <circle cx="62" cy="14" r="7.5" fill="#FFD700" opacity="0.82" />
      <circle cx="138" cy="14" r="7.5" fill="#FFD700" opacity="0.82" />
      <path d="M80,97 Q51,89 20,93" stroke="#B8860B" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <path d="M80,104 Q51,102 20,102" stroke="#B8860B" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <path d="M80,111 Q51,113 20,111" stroke="#B8860B" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <path d="M120,97 Q149,89 180,93" stroke="#B8860B" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <path d="M120,104 Q149,102 180,102" stroke="#B8860B" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <path d="M120,111 Q149,113 180,111" stroke="#B8860B" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <Eyes lx="81" ly="82" rx="119" ry="82" size="13" emotion={emotion} eyeColor="#8B2500" />
      {emotion === 'normal' && (
        <>
          <circle cx="88" cy="76" r="4.5" fill="#FFF5B0" opacity="0.72" />
          <circle cx="125" cy="76" r="4.5" fill="#FFF5B0" opacity="0.72" />
        </>
      )}
      <ellipse cx="100" cy="100" rx="12" ry="9" fill="#CC7700" />
      <circle cx="96" cy="97" r="3" fill="#FFF5B0" opacity="0.42" />
      <path d="M76,44 Q88,34 100,30 Q112,34 124,44" stroke="#DAA520" strokeWidth="4.5" fill="none" />
      <ellipse cx="100" cy="83" rx="56" ry="50" fill="none" stroke="#FFD700" strokeWidth="2.2" opacity="0.28" />
    </svg>
  )
}

// ============================================================
//  ⭐ 星灵 — SSR级 — mystic
// ============================================================
function StarSprite({ stage, emotion }) {
  if (stage === 1) return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="110" r="60" fill="#0D1B2A" opacity="0.38" />
      <polygon points="100,50 113,88 152,88 120,112 132,150 100,128 68,150 80,112 48,88 87,88" fill="#4B79FF" />
      <polygon points="100,50 113,88 152,88 120,112 132,150 100,128 68,150 80,112 48,88 87,88" fill="none" stroke="#93C5FD" strokeWidth="2.2" opacity="0.8" />
      <polygon points="100,66 109,88 133,88 113,102 121,126 100,112 79,126 87,102 67,88 91,88" fill="#6B9FFF" opacity="0.62" />
      <circle cx="100" cy="100" r="3.5" fill="white" opacity="0.85" />
      <circle cx="88" cy="108" r="2.2" fill="white" opacity="0.62" />
      <circle cx="112" cy="108" r="2.2" fill="white" opacity="0.62" />
      <circle cx="95" cy="92" r="1.8" fill="white" opacity="0.52" />
      <circle cx="105" cy="118" r="1.8" fill="white" opacity="0.52" />
      <Eyes lx="88" ly="100" rx="112" ry="100" size="8.5" emotion={emotion} eyeColor="white" />
      <circle cx="156" cy="58" r="2.8" fill="white" opacity="0.82" />
      <circle cx="44" cy="68" r="2.2" fill="white" opacity="0.72" />
      <circle cx="162" cy="142" r="1.8" fill="white" opacity="0.65" />
      <circle cx="37" cy="147" r="2.2" fill="white" opacity="0.65" />
    </svg>
  )
  if (stage === 2) return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="135" cy="141" rx="43" ry="22" fill="#4B79FF" opacity="0.28" transform="rotate(25,135,141)" />
      <ellipse cx="146" cy="159" rx="33" ry="17" fill="#7B2FBE" opacity="0.22" transform="rotate(20,146,159)" />
      <circle cx="138" cy="133" r="2.2" fill="#93C5FD" opacity="0.82" />
      <circle cx="149" cy="149" r="1.8" fill="#C4B5FD" opacity="0.75" />
      <circle cx="156" cy="163" r="2.2" fill="#93C5FD" opacity="0.65" />
      <circle cx="95" cy="102" r="62" fill="#0D1B2A" opacity="0.18" />
      <polygon points="95,42 111,86 158,86 122,112 136,156 95,130 54,156 68,112 32,86 79,86" fill="#4B79FF" />
      <polygon points="95,42 111,86 158,86 122,112 136,156 95,130 54,156 68,112 32,86 79,86" fill="none" stroke="#B8D4FF" strokeWidth="2.2" opacity="0.72" />
      <polygon points="95,58 107,86 134,86 112,102 120,130 95,114 70,130 78,102 56,86 83,86" fill="#6B9FFF" opacity="0.52" />
      <circle cx="95" cy="96" r="4" fill="white" opacity="0.88" />
      <circle cx="82" cy="104" r="2.8" fill="white" opacity="0.68" />
      <circle cx="108" cy="104" r="2.8" fill="white" opacity="0.68" />
      <circle cx="88" cy="88" r="2.2" fill="white" opacity="0.58" />
      <circle cx="102" cy="116" r="2.2" fill="white" opacity="0.58" />
      <circle cx="78" cy="116" r="1.8" fill="#C4B5FD" opacity="0.72" />
      <circle cx="112" cy="118" r="1.8" fill="#C4B5FD" opacity="0.72" />
      <Eyes lx="83" ly="98" rx="107" ry="98" size="9.5" emotion={emotion} eyeColor="white" />
      <circle cx="167" cy="46" r="3.2" fill="white" opacity="0.92" />
      <circle cx="26" cy="53" r="2.8" fill="white" opacity="0.82" />
      <circle cx="174" cy="160" r="2.2" fill="#C4B5FD" opacity="0.75" />
      <circle cx="20" cy="152" r="2.8" fill="#C4B5FD" opacity="0.72" />
    </svg>
  )
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="95" fill="#0a0a1e" opacity="0.38" />
      <path d="M100,171 Q149,163 163,141 Q173,122 161,108" stroke="#4B79FF" strokeWidth="21" fill="none" opacity="0.32" strokeLinecap="round" />
      <path d="M100,171 Q149,163 163,141 Q173,122 161,108" stroke="#7B2FBE" strokeWidth="13" fill="none" opacity="0.28" strokeLinecap="round" />
      <circle cx="146" cy="166" r="2.8" fill="#93C5FD" opacity="0.92" />
      <circle cx="159" cy="153" r="2.2" fill="white" opacity="0.82" />
      <circle cx="164" cy="139" r="2" fill="#C4B5FD" opacity="0.82" />
      <circle cx="163" cy="121" r="2.2" fill="white" opacity="0.72" />
      <circle cx="100" cy="95" r="78" fill="none" stroke="#4B79FF" strokeWidth="1.8" opacity="0.22" />
      <circle cx="100" cy="95" r="68" fill="none" stroke="#7B2FBE" strokeWidth="1.2" opacity="0.28" />
      <polygon points="100,22 118,75 174,75 128,108 146,162 100,130 54,162 72,108 26,75 82,75" fill="#4B79FF" />
      <polygon points="100,22 118,75 174,75 128,108 146,162 100,130 54,162 72,108 26,75 82,75" fill="none" stroke="#93C5FD" strokeWidth="3" opacity="0.62" />
      <polygon points="100,42 113,78 150,78 120,100 132,138 100,116 68,138 80,100 50,78 87,78" fill="#6B9FFF" opacity="0.52" />
      <ellipse cx="100" cy="95" rx="28" ry="22" fill="#7B2FBE" opacity="0.42" transform="rotate(-30,100,95)" />
      <ellipse cx="100" cy="95" rx="18" ry="14" fill="#4B79FF" opacity="0.52" transform="rotate(15,100,95)" />
      <circle cx="100" cy="90" r="4.5" fill="white" opacity="0.96" />
      <circle cx="86" cy="98" r="3.2" fill="white" opacity="0.78" />
      <circle cx="114" cy="98" r="3.2" fill="white" opacity="0.78" />
      <circle cx="92" cy="82" r="2.8" fill="#C4B5FD" opacity="0.82" />
      <circle cx="108" cy="108" r="2.8" fill="#C4B5FD" opacity="0.82" />
      <circle cx="82" cy="108" r="2.2" fill="white" opacity="0.65" />
      <circle cx="118" cy="82" r="2.2" fill="white" opacity="0.65" />
      <Eyes lx="85" ly="91" rx="115" ry="91" size="10.5" emotion={emotion} eyeColor="white" />
      <circle cx="21" cy="33" r="4" fill="white" opacity="0.92" />
      <circle cx="179" cy="28" r="3.5" fill="white" opacity="0.88" />
      <circle cx="14" cy="120" r="3" fill="#93C5FD" opacity="0.82" />
      <circle cx="186" cy="115" r="3.2" fill="#93C5FD" opacity="0.82" />
      <circle cx="33" cy="177" r="2.2" fill="#C4B5FD" opacity="0.72" />
      <circle cx="170" cy="180" r="2.8" fill="#C4B5FD" opacity="0.72" />
      <line x1="21" y1="33" x2="30" y2="42" stroke="white" strokeWidth="1.4" opacity="0.62" />
      <line x1="179" y1="28" x2="170" y2="37" stroke="white" strokeWidth="1.4" opacity="0.62" />
    </svg>
  )
}

// ============================================================
//  导出映射表
// ============================================================
const SPRITE_MAP = {
  pet_kitten:    KittenSprite,
  pet_puppy:     PuppySprite,
  pet_fox:       FoxSprite,
  pet_panda:     PandaSprite,
  pet_toothless: ToothlessSprite,
  pet_phoenix:   PhoenixSprite,
  pet_dragon:    DragonKingSprite,
  pet_star:      StarSprite,
}

/** 获取宠物 SVG 组件（如无则返回 null，走 PNG fallback） */
export function getPetSvgComponent(poolId) {
  return SPRITE_MAP[poolId] || null
}

/**
 * PetSvgSprite — 统一渲染入口
 * @param {string} poolId
 * @param {number} level   1–30
 * @param {string} emotion normal|happy|excited|bliss|laugh|cheer|sad1|sad2|sad3
 * @param {number} size    显示尺寸 px
 * @param {object} style   额外样式（transform/animation 等从 petStyle 传入）
 */
export default function PetSvgSprite({ poolId, level = 1, emotion = 'normal', size = 160, style = {} }) {
  const Component = SPRITE_MAP[poolId]
  if (!Component) return null
  const stage = level >= 21 ? 3 : level >= 11 ? 2 : 1
  return (
    <div style={{ width: size, height: size, flexShrink: 0, ...style }}>
      <Component stage={stage} emotion={emotion} />
    </div>
  )
}
