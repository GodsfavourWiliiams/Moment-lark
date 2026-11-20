import { Suspense } from "react";
import { EditorPage } from "@/features/editor";
export default function EditorRoute() {
  return (
    <Suspense
      fallback={
        <p role="status" className="p-6 text-on-surface-variant">
          Opening editor…
        </p>
      }
    >
      <EditorPage />
    </Suspense>
  );
}
