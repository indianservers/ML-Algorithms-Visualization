import { useId } from "react";

/** A small decision tree story for the Learn panel, independent of the live model. */
export function DecisionTreeLearnIllustration() {
  const id = useId().replace(/:/g, "");

  return (
    <svg className="dt-learn-art" viewBox="0 0 480 300" role="img" aria-label="A decision question splits samples into two clearer class groups">
      <defs>
        <linearGradient id={`${id}-room`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#dcecff" />
          <stop offset="1" stopColor="#f5e8f4" />
        </linearGradient>
        <linearGradient id={`${id}-left`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#dcbbff" />
          <stop offset="1" stopColor="#8567e9" />
        </linearGradient>
        <linearGradient id={`${id}-right`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#bce6ff" />
          <stop offset="1" stopColor="#5ba8eb" />
        </linearGradient>
        <filter id={`${id}-shadow`} x="-30%" y="-40%" width="160%" height="190%">
          <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#416ba4" floodOpacity="0.2" />
        </filter>
      </defs>

      <rect width="480" height="300" rx="18" fill={`url(#${id}-room)`} />
      <path d="M0 242 H480 V300 H0Z" fill="#e8cda8" />
      <path d="M0 252 H480" stroke="#d7b78f" strokeWidth="2" />
      <path d="M0 272 H480" stroke="#d7b78f" strokeWidth="1" opacity=".55" />

      <g opacity=".75">
        <rect x="18" y="34" width="50" height="208" rx="7" fill="#b8cce1" />
        <path d="M24 99 H62 M24 172 H62" stroke="#edf6ff" strokeWidth="5" />
        <rect x="27" y="54" width="10" height="43" rx="2" fill="#8056be" />
        <rect x="40" y="66" width="10" height="31" rx="2" fill="#61a7db" />
        <rect x="52" y="59" width="7" height="38" rx="2" fill="#f2a86f" />
        <rect x="26" y="126" width="8" height="43" rx="2" fill="#6bbf9f" />
        <rect x="37" y="135" width="11" height="34" rx="2" fill="#f2b65e" />
        <rect x="51" y="123" width="8" height="46" rx="2" fill="#8679ce" />
        <path d="M28 214 Q35 196 40 208 Q48 190 53 211" fill="none" stroke="#48a887" strokeWidth="5" strokeLinecap="round" />
        <rect x="30" y="215" width="30" height="21" rx="3" fill="#d79b74" />
      </g>

      <g fill="none" stroke="#82a7cd" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M240 84 V105 Q240 115 226 115 H160 Q145 115 145 128 V145" />
        <path d="M240 105 Q240 115 254 115 H326 Q341 115 341 128 V145" />
      </g>
      <circle cx="240" cy="105" r="5" fill="#62a1df" />

      <g filter={`url(#${id}-shadow)`}>
        <rect x="135" y="19" width="210" height="67" rx="18" fill="#fff" />
        <rect x="137" y="21" width="206" height="63" rx="16" fill="none" stroke="#bcd1eb" strokeWidth="2" />
      </g>
      <text x="240" y="46" textAnchor="middle" fill="#152b61" fontSize="18" fontWeight="750">Is the feature</text>
      <text x="240" y="69" textAnchor="middle" fill="#235ad7" fontSize="20" fontWeight="800">below the split?</text>

      <g filter={`url(#${id}-shadow)`}>
        <rect x="112" y="127" width="66" height="32" rx="16" fill="#13bf95" />
        <rect x="311" y="127" width="61" height="32" rx="16" fill="#fa7288" />
      </g>
      <text x="145" y="148" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="800">Yes</text>
      <text x="341" y="148" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="800">No</text>

      <g filter={`url(#${id}-shadow)`}>
        <circle cx="145" cy="215" r="57" fill={`url(#${id}-left)`} stroke="#fff" strokeWidth="5" />
        <circle cx="341" cy="215" r="57" fill={`url(#${id}-right)`} stroke="#fff" strokeWidth="5" />
      </g>
      {[126, 160, 322, 356].map((x, index) => (
        <g key={x}>
          <path d={`M${x - 10} 190 H${x + 10} L${x + 7} 207 Q${x} 215 ${x - 7} 207 Z`} fill={index < 2 ? "#a93a74" : "#f6c867"} stroke="#fff" strokeWidth="2.5" />
          <path d={`M${x} 214 V232 M${x - 9} 233 H${x + 9}`} fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
          <path d={`M${x - 7} 197 H${x + 7}`} stroke="#fff" strokeWidth="1.5" opacity=".8" />
        </g>
      ))}

      <rect x="104" y="268" width="82" height="25" rx="12" fill="#fff" />
      <rect x="300" y="268" width="82" height="25" rx="12" fill="#fff" />
      <text x="145" y="285" textAnchor="middle" fill="#4b3196" fontSize="13" fontWeight="800">Class 0</text>
      <text x="341" y="285" textAnchor="middle" fill="#21649b" fontSize="13" fontWeight="800">Class 1</text>
    </svg>
  );
}
