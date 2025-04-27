import { AppSidebar } from "@/components/AppSidebar";
import WebTeXEditor from "@/components/WebTeXEditor";
import { WorkspaceContext, type SelectedFile } from "@/utils/files";
import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { usePdfTeXEngine } from "../hooks/usePdfTeXEngine";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const [selectedFile, setSelectedPath] = useState<SelectedFile | null>(null);

  const editorRef = useRef<any>(null);
  const [pdfUrl, setPdfUrl] = useState("");

  const engine = usePdfTeXEngine();

  const compilePdf = async () => {
    if (!engine) {
      console.error("Engine not loaded yet.");
      return;
    }

    const latexCode = editorRef.current.getValue();

    console.log(latexCode);

    engine.writeMemFSFile("main.tex", latexCode);
    engine.setEngineMainFile("main.tex");
    let r = await engine.compileLaTeX();

    if (r.pdf) {
      const pdfBlob = new Blob([r.pdf], { type: "application/pdf" });
      const pdfUrl = URL.createObjectURL(pdfBlob);

      setPdfUrl(pdfUrl);
    }
  };

  return (
    <WorkspaceContext.Provider value={{ selectedFile, setSelectedPath }}>
      <AppSidebar />

      <main className="flex-1 grid grid-cols-2">
        <div className="h-full">
          <WebTeXEditor editorRef={editorRef} />
        </div>
        <div className="h-full overflow-auto">
          <iframe
            src={pdfUrl}
            width="100%"
            height="100%"
            style={{ border: "none" }}
            title="PDF Preview"
          />
        </div>

        <button
          onClick={() => compilePdf()}
          disabled={!engine}
          className="py-4 col-span-2 bg-blue-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-2xl">
            {engine ? "Compile" : "Loading Engine..."}
          </span>
        </button>
      </main>
    </WorkspaceContext.Provider>
  );
}
