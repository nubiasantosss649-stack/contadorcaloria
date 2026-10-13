import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { palette } from '@/constants/palette';

/** Brand mark: white leaf on an emerald gradient tile. */
export function LogoMark({ size = 64, inverted = false }: { size?: number; inverted?: boolean }) {
  const leaf = inverted ? palette.emerald[600] : palette.white;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityRole="image">
      <Defs>
        <LinearGradient id="logo-gradient" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={palette.emerald[500]} />
          <Stop offset="1" stopColor={palette.emerald[700]} />
        </LinearGradient>
      </Defs>
      <Rect
        width="64"
        height="64"
        rx="18"
        fill={inverted ? palette.white : 'url(#logo-gradient)'}
      />
      <Path d="M45 19C30 18 19 27 19 45c18 1 27-11 26-26Z" fill={leaf} />
      <Path
        d="M22 42 39 25"
        stroke={inverted ? palette.white : palette.emerald[600]}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}
