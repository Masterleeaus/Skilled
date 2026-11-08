import Link from "next/link";

export const metadata = {
  title: "Credits and disclosures | SkilledAt.Work",
};

export default function CreditsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="mb-8 text-sm">
        <Link href="/" className="text-neutral-400 underline hover:text-neutral-200">
          Back to home
        </Link>
      </p>

      <h1 className="text-3xl font-semibold tracking-tight">Credits and disclosures</h1>

      <section aria-labelledby="artwork-heading" className="mt-8 space-y-3">
        <h2 id="artwork-heading" className="text-xl font-medium">
          Course artwork
        </h2>
        <p className="text-neutral-300">
          The course artwork on this site is synthetic and illustrative. It does not depict real
          people, sites, or work.
        </p>
        <p className="text-neutral-300">
          The artwork is not accreditation. It does not show certification, a licence, or any
          recognised qualification or badge.
        </p>
      </section>

      <section aria-labelledby="origin-heading" className="mt-8 space-y-3">
        <h2 id="origin-heading" className="text-xl font-medium">
          Origin and licence
        </h2>
        <p className="text-neutral-300">
          Titan Academy began from an inherited MIT-licensed full-stack learning management system,
          written by Farrukh Ali Khan. The copyright notice is kept in the LICENSE file of the source
          code, as the MIT licence requires.
        </p>
        <p className="text-neutral-300">
          Some inherited modules remain in the code where Titan Academy uses them. Their behaviour is
          not verified for Titan Academy.
        </p>
      </section>

      <section aria-labelledby="icons-heading" className="mt-8 space-y-3">
        <h2 id="icons-heading" className="text-xl font-medium">
          Icons
        </h2>
        <p className="text-neutral-300">
          Some icons are Font Awesome 4.7 glyph outlines. These are licensed under the SIL Open Font
          License 1.1. The license terms are at{" "}
          <a
            href="https://fontawesome.com/v4/license/"
            className="underline hover:text-neutral-100"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://fontawesome.com/v4/license/
          </a>
          .
        </p>
        <p className="text-neutral-300">
          The Font Awesome font files are not included in this site. Only the glyph outlines
          produced from them are used.
        </p>
      </section>
    </main>
  );
}
