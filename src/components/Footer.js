export default function Footer() {
  return (
    <footer className="mt-20 pt-8 pb-10 text-center text-xs text-white/45">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent mb-4" />
        <p>
          <span className="text-white/70">Zaika AI</span> ©{" "}
          {new Date().getFullYear()} • Crafted for intelligent Indian recipes.
        </p>
      </div>
    </footer>
  );
}
