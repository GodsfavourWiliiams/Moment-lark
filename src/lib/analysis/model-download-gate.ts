import type { AnalysisSnapshot } from "../../types/analysis";
type Request = NonNullable<AnalysisSnapshot["downloadRequest"]>;

/** Only the currently displayed request may resume model loading. */
export class ModelDownloadGate {
  private pending?: { id: string; resolve: () => void };
  wait(model: Request["model"], notify: (request: Request) => void) {
    return new Promise<void>((resolve) => {
      const id = crypto.randomUUID();
      this.pending = { id, resolve };
      notify({ id, model });
    });
  }
  approve(id: string) {
    if (this.pending?.id !== id) return;
    const { resolve } = this.pending;
    this.pending = undefined;
    resolve();
  }
}
