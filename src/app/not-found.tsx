import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md space-y-3 px-4 py-10 text-center">
      <h1 className="text-2xl font-bold">Not found</h1>
      <p className="text-slate-600">That page or AED isn&apos;t here. It may have been removed or moved.</p>
      <Link href="/" className="btn-primary">
        Back to the map
      </Link>
    </div>
  );
}
