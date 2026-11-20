"use client";
import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { EDITING_DEMO } from "@/config/editing-demo";
import { readLocalVideo } from "@/lib/media/read-local-video";
import { EditingContext } from "@/state/editing-context";
import { editingReducer, initialEditingState } from "@/state/editing";

export function EditingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(editingReducer, initialEditingState);
  const sourceUrl = useRef<string | null>(null);
  const request = useRef(0);
  const loadDemo = useCallback(() => {
    request.current++;
    if (sourceUrl.current) URL.revokeObjectURL(sourceUrl.current);
    sourceUrl.current = null;
    dispatch({ type: "load", document: EDITING_DEMO });
  }, []);
  const loadFile = useCallback(async (file: File) => {
    const id = ++request.current;
    const url = URL.createObjectURL(file);
    try {
      const document = await readLocalVideo(file, url);
      if (request.current !== id) {
        URL.revokeObjectURL(url);
        return false;
      }
      if (sourceUrl.current) URL.revokeObjectURL(sourceUrl.current);
      sourceUrl.current = url;
      dispatch({ type: "load", document });
      return true;
    } catch (error) {
      URL.revokeObjectURL(url);
      throw error;
    }
  }, []);
  useEffect(
    () => () => {
      request.current++;
      if (sourceUrl.current) URL.revokeObjectURL(sourceUrl.current);
    },
    [],
  );
  return (
    <EditingContext.Provider value={{ ...state, dispatch, loadFile, loadDemo }}>
      {children}
    </EditingContext.Provider>
  );
}
