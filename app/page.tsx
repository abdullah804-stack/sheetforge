import Link from "next/link";
import { auth } from "@/auth";
import Reveal from "@/components/Reveal";

export default async function LandingPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-white">
      {/* NAVBAR */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-semibold text-lg tracking-tight">
            SheetForge
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <a
              href="https://github.com/abdullah804-stack/sheetforge"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 hidden sm:inline"
            >
              GitHub
            </a>
            {session?.user ? (
              <Link
                href="/dashboard"
                className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 hidden sm:inline"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <Reveal>
          <div className="inline-flex items-center gap-2 text-xs text-gray-600 border border-gray-200 rounded-full px-3 py-1 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            Now in early access
          </div>
        </Reveal>

        <Reveal delay={1}>
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] mb-6">
            Turn your spreadsheet
            <br />
            into a real application.
          </h1>
        </Reveal>

        <Reveal delay={2}>
          <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-2xl">
            Upload an Excel or CSV file. In a couple of minutes you get a
            working web app for your team — with search, filters, a live
            dashboard, and editing. No developers, no setup, no migration.
          </p>
        </Reveal>

        <Reveal delay={3}>
          <div className="flex items-center gap-4">
            <Link
              href={session?.user ? "/dashboard" : "/signup"}
              className="inline-flex items-center gap-2 bg-black text-white px-5 py-3 rounded-md font-medium hover:bg-gray-800 transition group"
            >
              Get started
              <span className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
            <a
              href="#how-it-works"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              See how it works
            </a>
          </div>
        </Reveal>

        {/* TRANSFORMATION VISUAL */}
        <Reveal delay={4}>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-8">
            {/* Spreadsheet card */}
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm float-slow">
              <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                <span className="ml-2 text-xs text-gray-500">
                  inventory.xlsx
                </span>
              </div>
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">
                      Product
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">
                      Stock
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-3 py-2 text-gray-700">Wireless Mouse</td>
                    <td className="px-3 py-2 text-gray-700">84</td>
                    <td className="px-3 py-2 text-gray-700">$24.99</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-gray-700">Keyboard</td>
                    <td className="px-3 py-2 text-gray-700">14</td>
                    <td className="px-3 py-2 text-gray-700">$79.99</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-gray-700">USB-C Hub</td>
                    <td className="px-3 py-2 text-gray-700">7</td>
                    <td className="px-3 py-2 text-gray-700">$39.99</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center text-gray-400">
              <span className="text-2xl pulse-arrow">→</span>
            </div>

            {/* Generated app card */}
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm float-slow">
              <div className="bg-gray-50 border-b border-gray-200 px-3 py-2">
                <span className="text-xs text-gray-500">
                  Inventory Manager
                </span>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="border border-gray-100 rounded p-2">
                    <p className="text-[10px] text-gray-500">Products</p>
                    <p className="text-sm font-semibold">128</p>
                  </div>
                  <div className="border border-gray-100 rounded p-2">
                    <p className="text-[10px] text-gray-500">Low stock</p>
                    <p className="text-sm font-semibold">9</p>
                  </div>
                  <div className="border border-gray-100 rounded p-2">
                    <p className="text-[10px] text-gray-500">Value</p>
                    <p className="text-sm font-semibold">$8.2k</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 bg-gray-50 rounded px-2 py-1 text-[10px] text-gray-400">
                    Search...
                  </div>
                  <div className="bg-black text-white text-[10px] rounded px-2 py-1">
                    + Add
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] py-1 border-b border-gray-100">
                    <span>Wireless Mouse</span>
                    <span className="text-green-600">84</span>
                  </div>
                  <div className="flex justify-between text-[11px] py-1 border-b border-gray-100">
                    <span>Keyboard</span>
                    <span className="text-yellow-600">14</span>
                  </div>
                  <div className="flex justify-between text-[11px] py-1">
                    <span>USB-C Hub</span>
                    <span className="text-red-600">7</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* HOW IT WORKS — user oriented */}
      <section
        id="how-it-works"
        className="border-t border-gray-100 bg-gray-50/50"
      >
        <div className="max-w-6xl mx-auto px-6 py-24">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-tight mb-3">
              How it works
            </h2>
            <p className="text-gray-600 mb-14 max-w-2xl">
              Three simple steps. No code, no configuration, no data migration.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <Reveal delay={1}>
              <Step
                n="01"
                title="Upload your spreadsheet"
                body="Drag in any Excel or CSV file you already use. We read every sheet automatically — nothing to set up."
              />
            </Reveal>
            <Reveal delay={2}>
              <Step
                n="02"
                title="We design your app"
                body="Our AI reads your columns, understands what they mean, and proposes a complete app layout. You review it before anything is created."
              />
            </Reveal>
            <Reveal delay={3}>
              <Step
                n="03"
                title="Start using it"
                body="Your data is imported and the app is live. Search, edit, add, and share it with your team using a simple link."
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-tight mb-3">
              What you get
            </h2>
            <p className="text-gray-600 mb-14 max-w-2xl">
              Everything a spreadsheet can't do — without hiring a developer.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-10">
            <Reveal delay={1}>
              <Feature
                title="A real database"
                body="Your data lives in PostgreSQL, not a fragile spreadsheet. Fast, reliable, and accessible from anywhere."
              />
            </Reveal>
            <Reveal delay={2}>
              <Feature
                title="Full editing"
                body="Add, edit, and remove records with clean forms. Every change is saved instantly."
              />
            </Reveal>
            <Reveal delay={3}>
              <Feature
                title="Search and filters"
                body="Find any record in seconds. Narrow by category, status, date, or any field you care about."
              />
            </Reveal>
            <Reveal delay={1}>
              <Feature
                title="Live dashboard"
                body="See totals, averages, and trends that update automatically as your data changes."
              />
            </Reveal>
            <Reveal delay={2}>
              <Feature
                title="Share with a link"
                body="Publish your app and send a URL to your team. They see a clean read-only version in their browser."
              />
            </Reveal>
            <Reveal delay={3}>
              <Feature
                title="No setup required"
                body="No configuration, no scripts, no fields to define. The AI reads your spreadsheet and does the work."
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* BUILT RIGHT — user-facing trust signals */}
      <section className="border-t border-gray-100 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-tight mb-3">
              Built right
            </h2>
            <p className="text-gray-600 mb-14 max-w-2xl">
              A serious product under the surface — so you don't have to think
              about it.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
            <Reveal delay={1}>
              <Trust
                title="AI that's checked, not guessed"
                body="Every AI decision is verified against your real spreadsheet before anything is created. If the AI can't be confident, it asks you."
              />
            </Reveal>
            <Reveal delay={2}>
              <Trust
                title="Your data is private by default"
                body="Your spreadsheets and applications are yours. No one else can see them, and nothing is used to train AI models."
              />
            </Reveal>
            <Reveal delay={3}>
              <Trust
                title="Built to last"
                body="PostgreSQL, modern encryption, and the same infrastructure trusted by thousands of companies. Not a prototype."
              />
            </Reveal>
            <Reveal delay={4}>
              <Trust
                title="No lock-in"
                body="Your data belongs to you. Export or delete it anytime, and everything goes with it."
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-24 text-center">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              Turn your first spreadsheet into an app.
            </h2>
          </Reveal>
          <Reveal delay={1}>
            <p className="text-gray-600 mb-8 max-w-xl mx-auto">
              Free to try. No credit card. Takes about 2 minutes.
            </p>
          </Reveal>
          <Reveal delay={2}>
            <Link
              href={session?.user ? "/dashboard" : "/signup"}
              className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-md font-medium hover:bg-gray-800 transition group"
            >
              Get started
              <span className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div>© {new Date().getFullYear()} SheetForge</div>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/abdullah804-stack/sheetforge"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900"
            >
              GitHub
            </a>
            <Link href="/login" className="hover:text-gray-900">
              Sign in
            </Link>
            <Link href="/signup" className="hover:text-gray-900">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Step({
  n,
  title,
  body,
}: {
  n: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div className="text-xs font-mono text-gray-400 mb-3">{n}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed text-sm">{body}</p>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{body}</p>
    </div>
  );
}

function Trust({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{body}</p>
    </div>
  );
}