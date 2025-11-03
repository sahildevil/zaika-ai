export default function LoadingSpinner({ text = "Generating..." }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <div className="relative">
        <div className="h-12 w-12 border-3 border-[rgba(var(--accent-rgb)/0.3)] border-t-[rgba(var(--accent-rgb)/0.9)] rounded-full animate-spin" />
        <div
          className="absolute inset-0 h-12 w-12 border-3 border-transparent border-t-[rgba(var(--accent-rgb)/0.5)] rounded-full animate-spin"
          style={{ animationDuration: "1.5s", animationDirection: "reverse" }}
        />
      </div>
      <p className="text-sm text-white/70">{text}</p>
    </div>
  );
}
