import Link from "next/link";
import { ModelTransfer } from "@/features/analysis/components/model-transfer";

export default function ModelsPage() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
      <h1 className="text-headline-lg font-bold text-on-surface">
        Your local AI models
      </h1>
      <p className="text-body-md text-on-surface-variant">
        Move saved models between browsers without downloading them again. Open
        this page in the browser where you previously ran analysis to export,
        then open it in the new browser to import.
      </p>
      <ModelTransfer />
      <Link href="/" className="text-primary underline">
        Back to Import
      </Link>
    </section>
  );
}
