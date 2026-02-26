import { TouchableOpacity, Text, ActivityIndicator, View } from "react-native";
import type { TouchableOpacityProps } from "react-native";

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: "primary" | "secondary" | "tertiary" | "danger";
  size?: "lg" | "md" | "sm";
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const VARIANT_STYLES = {
  primary: {
    container: "bg-primary rounded-button shadow-sm",
    text: "text-white font-semibold",
    height: "h-btn-primary",
  },
  secondary: {
    container: "bg-white border border-primary rounded-button",
    text: "text-primary font-medium",
    height: "h-btn-secondary",
  },
  tertiary: {
    container: "bg-transparent rounded-button",
    text: "text-primary font-medium underline",
    height: "h-btn-tertiary",
  },
  danger: {
    container: "bg-danger rounded-button shadow-sm",
    text: "text-white font-semibold",
    height: "h-btn-primary",
  },
} as const;

const TEXT_SIZE = {
  lg: "text-base",
  md: "text-sm",
  sm: "text-xs",
} as const;

export function Button({
  label,
  variant = "primary",
  size = "lg",
  loading = false,
  icon,
  fullWidth = true,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const v = VARIANT_STYLES[variant];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isDisabled}
      style={style}
      className={[
        v.container,
        v.height,
        fullWidth ? "w-full" : "self-start px-6",
        "flex-row items-center justify-center gap-2",
        isDisabled ? "opacity-50" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" ? "#2ECC71" : "#fff"} size="small" />
      ) : (
        <>
          {icon && <View>{icon}</View>}
          <Text className={`${v.text} ${TEXT_SIZE[size]}`}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
