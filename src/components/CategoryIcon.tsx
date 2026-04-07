'use client';
/**
 * CategoryIcon — renders a Lucide outline icon inside a tinted rounded square.
 * Website mirror of mobile _KeiprApp/src/components/CategoryIcon.tsx
 */
import { getCategoryIcon } from '@/lib/categoryIcons';

interface Props {
  category: string;
  size?: number;
  iconScale?: number;
  isDark: boolean;
}

export default function CategoryIcon({ category, size = 30, iconScale = 0.5, isDark }: Props) {
  const icon = getCategoryIcon(category, isDark);
  const svgSize = Math.round(size * iconScale);
  const borderRadius = Math.round(size * 0.23);

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      borderRadius,
      backgroundColor: icon.bg,
      flexShrink: 0,
    }}>
      <svg
        width={svgSize}
        height={svgSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke={icon.stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {icon.paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
        {icon.circles?.map((c, i) => (
          <circle key={`c${i}`} cx={c.cx} cy={c.cy} r={c.r} fill="none" />
        ))}
      </svg>
    </span>
  );
}
