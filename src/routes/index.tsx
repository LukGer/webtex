import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import WebTeXEditor from "@/components/WebTeXEditor";
import { WorkspaceContext, type SelectedFile } from "@/utils/files";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LoaderIcon } from "lucide-react";
import { useRef, useState } from "react";
import { usePdfTeXEngine } from "../hooks/usePdfTeXEngine";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const [selectedFile, setSelectedPath] = useState<SelectedFile | null>(null);

  const editorRef = useRef<any>(null);

  const engine = usePdfTeXEngine();

  const compilePdf = useMutation({
    mutationFn: async () => {
      if (!engine) {
        throw new Error("Engine not loaded yet.");
      }

      const latexCode = editorRef.current.getValue();

      console.log(latexCode);

      engine.writeMemFSFile("main.tex", latexCode);
      engine.setEngineMainFile("main.tex");
      const r = await engine.compileLaTeX();

      if (r.pdf) {
        const pdfBlob = new Blob([r.pdf], { type: "application/pdf" });
        return URL.createObjectURL(pdfBlob);
      } else {
        throw new Error(r.log);
      }
    },
  });

  return (
    <WorkspaceContext.Provider value={{ selectedFile, setSelectedPath }}>
      <AppSidebar />

      <main className="flex-1 flex flex-col gap-4 p-4 bg-gray-50">
        <div className="flex flex-row items-center">
          <div className="flex-1"></div>

          <Button
            onClick={() => compilePdf.mutate()}
            disabled={!engine}
            variant="default"
          >
            {compilePdf.isPending && (
              <LoaderIcon className="animate-spin mr-2" />
            )}
            Compile
          </Button>
        </div>

        <div className="flex-1 flex flex-row gap-4">
          <div className="flex-1 bg-white shadow-md rounded-lg p-4">
            <WebTeXEditor editorRef={editorRef} />
          </div>
          <div className="flex-1 flex bg-white shadow-md rounded-lg overflow-hidden justify-center items-center">
            {compilePdf.isSuccess ? (
              <iframe
                src={compilePdf.data}
                className="w-full h-full"
                style={{ border: "none" }}
                title="PDF Preview"
              />
            ) : compilePdf.isError ? (
              <span className="text-red-500">{compilePdf.error.message}</span>
            ) : (
              <span>No PDF available</span>
            )}
          </div>
        </div>
      </main>
    </WorkspaceContext.Provider>
  );
}
