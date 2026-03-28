export default function Loading() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden">
      <div className="bg-accent h-full w-full animate-[progress-bar_1.2s_ease-in-out_infinite]" />
    </div>
  );
}
