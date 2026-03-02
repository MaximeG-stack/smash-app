import { TouchableOpacity, Text, ActivityIndicator, View, StyleSheet } from "react-native";
import type { TouchableOpacityProps } from "react-native";

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: "primary" | "secondary" | "tertiary" | "danger";
  size?: "lg" | "md" | "sm";
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

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
  const isDisabled = disabled || loading;

  const containerStyle = [
    styles.base,
    variant === "primary" && styles.containerPrimary,
    variant === "secondary" && styles.containerSecondary,
    variant === "tertiary" && styles.containerTertiary,
    variant === "danger" && styles.containerDanger,
    size === "lg" && styles.heightLg,
    size === "md" && styles.heightMd,
    size === "sm" && styles.heightSm,
    fullWidth ? styles.fullWidth : styles.selfStart,
    isDisabled && styles.disabled,
    style,
  ];

  const textStyle = [
    variant === "primary" && styles.textPrimary,
    variant === "secondary" && styles.textSecondary,
    variant === "tertiary" && styles.textTertiary,
    variant === "danger" && styles.textDanger,
    size === "lg" && styles.textLg,
    size === "md" && styles.textMd,
    size === "sm" && styles.textSm,
  ];

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isDisabled}
      style={containerStyle}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" ? "#2ECC71" : "#fff"} size="small" />
      ) : (
        <>
          {icon && <View>{icon}</View>}
          <Text style={textStyle}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
  },
  containerPrimary: {
    backgroundColor: "#2ECC71",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  containerSecondary: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#2ECC71",
  },
  containerTertiary: {
    backgroundColor: "transparent",
  },
  containerDanger: {
    backgroundColor: "#E74C3C",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  heightLg: {
    height: 52,
  },
  heightMd: {
    height: 44,
  },
  heightSm: {
    height: 36,
  },
  fullWidth: {
    width: "100%",
  },
  selfStart: {
    alignSelf: "flex-start",
    paddingHorizontal: 24,
  },
  disabled: {
    opacity: 0.5,
  },
  textPrimary: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  textSecondary: {
    color: "#2ECC71",
    fontWeight: "500",
  },
  textTertiary: {
    color: "#2ECC71",
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  textDanger: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  textLg: {
    fontSize: 16,
  },
  textMd: {
    fontSize: 14,
  },
  textSm: {
    fontSize: 12,
  },
});
