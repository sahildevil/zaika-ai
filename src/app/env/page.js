export default function EnvInfoPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight text-white/90">Environment Setup</h2>
      <p className="text-sm text-white/65">
        This project does not import <code>./env</code>. To use environment variables in Next.js, create a file named <code>.env.local</code> in the project root and prefix variables used on the client with <code>NEXT_PUBLIC_</code>.
      </p>
      <pre className="text-xs glass p-4 rounded-xl border border-white/10 overflow-auto">
{`# .env.local
NEXT_PUBLIC_API_BASE=https://api.example.com
`}
      </pre>
      <p className="text-sm text-white/65">
        Access server-side vars via <code>process.env.MY_SECRET</code> in server files, and client-safe vars via <code>process.env.NEXT_PUBLIC_*</code> in client components.
      </p>
    </div>
  );
}



