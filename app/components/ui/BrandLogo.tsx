import { AppLogo } from "@/components/ui/AppLogo";
import type { AppLogoId } from "@/lib/types";

interface BrandLogoProps {
  logo: AppLogoId;
  size?: number;
  showLabel?: boolean;
  label?: string;
}

/** @deprecated Use AppLogo directly */
export function BrandLogo({ logo, ...rest }: BrandLogoProps) {
  return <AppLogo id={logo} {...rest} />;
}