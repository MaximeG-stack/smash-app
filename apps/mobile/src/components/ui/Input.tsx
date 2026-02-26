import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import type { TextInputProps } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View className="w-full gap-1">
      {label && (
        <Text className="text-sm font-medium text-neutral-700 mb-1">{label}</Text>
      )}
      <View
        className={[
          "flex-row items-center h-12 px-4 rounded-button border bg-white",
          focused ? "border-primary" : error ? "border-danger" : "border-neutral-200",
        ].join(" ")}
      >
        {leftIcon && <View className="mr-2">{leftIcon}</View>}
        <TextInput
          className="flex-1 text-base text-neutral-900 h-full"
          placeholderTextColor="#6B7280"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={style}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} className="ml-2">
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text className="text-xs text-danger mt-1">{error}</Text>}
    </View>
  );
}
