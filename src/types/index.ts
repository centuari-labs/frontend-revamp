export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
  fillColor?: string;
  strokeWidth?: number;
  className?: string;
}

/** Token option for market dropdowns (logo, value, label). */
export interface TokenOption {
  logo: string;
  value: string;
  label: string;
}

export * from "./positions";