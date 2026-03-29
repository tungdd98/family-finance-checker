import { GoldCoinLoader } from "@/components/GoldCoinLoader";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
      <GoldCoinLoader size={80} />
    </div>
  );
}
