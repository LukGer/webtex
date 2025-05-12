import { useEffect, useState } from "react";

export interface LaTexEngine {
  loadEngine: () => Promise<void>;
  isReady: () => boolean;
  writeMemFSFile: (fileName: string, srccode: string | Uint8Array) => void;
  makeMemFSFolder: (folderName: string) => void;
  setEngineMainFile: (fileName: string) => void;
  compileLaTeX: () => Promise<{ status: string; log: string; pdf: Uint8Array }>;
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
      const pdfTeXEngine: LaTexEngine = new XeTeXEngine();
      await pdfTeXEngine.loadEngine();
      pdfTeXEngine.setTexliveEndpoint("https://texlive.swiftlatex.com");

      setEngine(pdfTeXEngine);
    };

    initializeEngine();
  }, []);

  return engine;
}
