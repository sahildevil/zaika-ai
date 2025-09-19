export default function LoadingSpinner() {
  return (
    <div className="flex items-center gap-2 text-sm text-neutral-500">
      <div className="h-4 w-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      Generating...
    </div>
  );
}
