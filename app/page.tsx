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
            See your spreadsheet
            <br />
            clearly. Finally.
          </h1>
        </Reveal>

        <Reveal delay={2}>
          <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-2xl">
            Upload any Excel or CSV file. We turn it into a clean, friendly
            view with charts, a plain-English summary, and easy editing. Share
            it with a link. Download it whenever you want.
          </p>
        </Reveal>

        <Reveal delay={3}>
          <div className="flex items-center gap-4">
            <Link
              href={session?.user ? "/dashboard" : "/signup"}
              className="inline-flex items-center gap-2 bg-black text-white px-5 py-3 rounded-md font-medium hover:bg-gray-800 transition group"
            >
              Try it free
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
            {/* Left: plain spreadsheet */}
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
                    <td className="px-3 py-2 text-gray-700">
                      Wireless Mouse
                    </td>
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

            {/* Right: SheetForge view */}
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm float-slow">
              <div className="bg-gray-50 border-b border-gray-200 px-3 py-2">
                <span className="text-xs text-gray-500">Inventory — SheetForge</span>
              </div>
              <div className="p-3">
                {/* Summary block */}
                <div className="border-l-2 border-black pl-2 mb-3">
                  <p className="text-[10px] font-semibold text-gray-700 mb-0.5">
                    Summary
                  </p>
                  <p className="text-[10px] text-gray-600 leading-relaxed">
                    24 products across 6 categories. Stock ranges from 4 to 84.
                    Total value $3,240.
                  </p>
                </div>
                {/* Mini chart */}
                <div className="flex items-end gap-1 h-10 mb-2">
                  <div className="flex-1 bg-black rounded-t" style={{ height: "80%" }}></div>
                  <div className="flex-1 bg-black rounded-t" style={{ height: "45%" }}></div>
                  <div className="flex-1 bg-black rounded-t" style={{ height: "65%" }}></div>
                  <div className="flex-1 bg-black rounded-t" style={{ height: "30%" }}></div>
                  <div className="flex-1 bg-black rounded-t" style={{ height: "90%" }}></div>
                  <div className="flex-1 bg-black rounded-t" style={{ height: "55%" }}></div>
                </div>
                {/* Mini table */}
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

      {/* HOW IT WORKS */}
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
              Three simple steps. No Excel knowledge needed.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <Reveal delay={1}>
              <Step
                n="01"
                title="Upload your file"
                body="Drop in any Excel or CSV file you already use. We read every sheet automatically — nothing to set up."
              />
            </Reveal>
            <Reveal delay={2}>
              <Step
                n="02"
                title="See it clearly"
                body="You get a friendly view with a plain-English summary, easy-to-read charts, and clean tables. No formulas, no confusion."
              />
            </Reveal>
            <Reveal delay={3}>
              <Step
                n="03"
                title="Edit, share, or download"
                body="Add or change rows without Excel. Share with a link. Download an updated file whenever you need it."
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
              A comfortable interface for a file that was never comfortable.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-10">
            <Reveal delay={1}>
              <Feature
                title="A summary you can read"
                body="Plain English description of what's inside your file — counts, ranges, and key trends. No spreadsheet expertise needed."
              />
            </Reveal>
            <Reveal delay={2}>
              <Feature
                title="Charts that make sense"
                body="See your data visually. Bar, line, and pie charts generated automatically based on what's in your file."
              />
            </Reveal>
            <Reveal delay={3}>
              <Feature
                title="Editing without Excel"
                body="Add, change, or remove rows through clean forms. Every change is saved instantly."
              />
            </Reveal>
            <Reveal delay={1}>
              <Feature
                title="Share with a link"
                body="Send anyone a URL and they'll see your data in the same clean view — no spreadsheet app needed on their end."
              />
            </Reveal>
            <Reveal delay={2}>
              <Feature
                title="Download anytime"
                body="Get your edited data back as CSV or Excel. Your file, updated, whenever you need it."
              />
            </Reveal>
            <Reveal delay={3}>
              <Feature
                title="Search and filter"
                body="Find any record in seconds. Narrow down by category, status, or any field — without Excel's cryptic filter menus."
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* BUILT RIGHT */}
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
                title="Your data stays yours"
                body="Your files and applications are private by default. Nobody else can see them, and nothing is used to train AI models."
              />
            </Reveal>
            <Reveal delay={2}>
              <Trust
                title="Made for real business files"
                body="Handles multiple sheets, thousands of rows, mixed data types, and messy headers. Built for the spreadsheets people actually use."
              />
            </Reveal>
            <Reveal delay={3}>
              <Trust
                title="AI that's checked, not guessed"
                body="Every AI decision is verified against your real data before anything is shown. If we're unsure, we say so."
              />
            </Reveal>
            <Reveal delay={4}>
              <Trust
                title="No lock-in"
                body="Your data belongs to you. Download it anytime. Delete your account and everything goes with it."
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
              Try it with your first spreadsheet.
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
              Try it free
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