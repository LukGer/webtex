import { useEffect, useState } from "react";

export interface PdfResult {
  status: string;
  log: string;
  pdf: Uint8Array<ArrayBuffer>;
}

export interface LaTexEngine {
  loadEngine: () => Promise<void>;
  isReady: () => boolean;
  writeMemFSFile: (fileName: string, srccode: string | Uint8Array) => void;
  makeMemFSFolder: (folderName: string) => void;
  setEngineMainFile: (fileName: string) => void;
  compileLaTeX: () => Promise<PdfResult>;
  flushCache: () => void;
  closeWorker: () => void;
  setTexliveEndpoint: (endpoint: string) => void;
  compileFormat: () => Promise<void>;
}

export function usePdfTeXEngine() {
  const [engine, setEngine] = useState<LaTexEngine | null>(null);

  useEffect(() => {
    const initializeEngine = async () => {
      /* @ts-ignore */
      const pdfTeXEngine: LaTexEngine = new PdfTeXEngine();
      await pdfTeXEngine.loadEngine();

      setEngine(pdfTeXEngine);
    };

    initializeEngine();
  }, []);

  return engine;
}
