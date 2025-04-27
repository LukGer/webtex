import { useEffect, useState } from "react";

export function usePdfTeXEngine() {
  const [engine, setEngine] = useState<any>(null);

  useEffect(() => {
    const initializeEngine = async () => {
      /* @ts-ignore */
      const pdfTeXEngine = new PdfTeXEngine();
      await pdfTeXEngine.loadEngine();
      setEngine(pdfTeXEngine);
    };

    initializeEngine();
  }, []);

  return engine;
}
