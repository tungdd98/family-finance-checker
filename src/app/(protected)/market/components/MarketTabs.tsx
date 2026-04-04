interface Props {
  activeTab: "gold" | "coin";
  onTabChange: (tab: "gold" | "coin") => void;
}

export function MarketTabs({ activeTab, onTabChange }: Props) {
  return (
    <div className="border-border flex border-b">
      {(["gold", "coin"] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`px-4 py-2.5 text-[13px] font-bold uppercase transition-colors ${
            activeTab === tab
              ? "border-accent text-foreground border-b-2"
              : "text-foreground-muted"
          }`}
        >
          {tab === "gold" ? "Vàng" : "Coin"}
        </button>
      ))}
    </div>
  );
}
