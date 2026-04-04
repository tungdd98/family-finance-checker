interface BadgeProps {
  variant: "positive" | "negative" | "gold";
  label?: string;
}

const variantStyles: Record<
  BadgeProps["variant"],
  { container: string; dot: string; label: string }
> = {
  positive: {
    container: "bg-[#4CAF5030]",
    dot: "bg-status-positive",
    label: "",
  },
  negative: {
    container: "bg-[#F4433620]",
    dot: "bg-status-negative",
    label: "",
  },
  gold: {
    container: "bg-accent-soft",
    dot: "bg-accent",
    label: "text-accent text-xs font-semibold uppercase",
  },
};

export function Badge({ variant, label }: Readonly<BadgeProps>) {
  const styles = variantStyles[variant];
  return (
    <span
      className={`inline-flex h-6 items-center gap-1.5 px-2.5 ${styles.container}`}
    >
      <span className={`block h-1.5 w-1.5 ${styles.dot}`} />
      {variant === "gold" && label && (
        <span className={styles.label}>{label}</span>
      )}
    </span>
  );
}
