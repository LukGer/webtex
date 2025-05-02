import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import WebTeXEditor, {
  type WebTeXEditorHandle,
} from "@/components/WebTeXEditor";
import { WorkspaceContext, type SelectedFile } from "@/utils/files";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BlocksIcon, CommandIcon, LoaderIcon, SaveIcon } from "lucide-react";
import { useRef, useState } from "react";
import { usePdfTeXEngine } from "../hooks/usePdfTeXEngine";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const [selectedFile, setSelectedPath] = useState<SelectedFile | null>(null);

  const editorRef = useRef<WebTeXEditorHandle | null>(null);

  const engine = usePdfTeXEngine();

  const compilePdf = useMutation({
    mutationFn: async () => {
      if (!engine) {
        throw new Error("Engine not loaded yet.");
      }

      const latexCode = editorRef.current?.getContent();

      engine.writeMemFSFile("main.tex", latexCode);
      engine.setEngineMainFile("main.tex");

      const result = await engine.compileLaTeX();

      if (result.pdf) {
        const pdfBlob = new Blob([result.pdf], { type: "application/pdf" });
        return URL.createObjectURL(pdfBlob);
      } else {
        throw new Error(result.log);
      }
    },
  });

  const saveFileMutation = useMutation({
    mutationFn: async () => {
      await editorRef.current?.saveFile();
    },
  });

  return (
    <WorkspaceContext.Provider value={{ selectedFile, setSelectedPath }}>
      <AppSidebar />

      <main className="flex-1 flex flex-col gap-4 p-4 bg-gray-100">
        <div className="flex flex-row items-center bg-white p-2 rounded-md gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => saveFileMutation.mutate()}
          >
            {saveFileMutation.isPending ? (
              <LoaderIcon className="animate-spin" />
            ) : (
              <SaveIcon />
            )}
            Save
            <span className="text-xs text-muted-foreground uppercase inline-flex flex-row items-center">
              <CommandIcon className="size-3 mr-0.5" /> S
            </span>
          </Button>

          <Button
            onClick={() => compilePdf.mutate()}
            disabled={!engine}
            variant="default"
            size="sm"
          >
            {compilePdf.isPending ? (
              <LoaderIcon className="animate-spin" />
            ) : (
              <BlocksIcon />
            )}
            Compile
            <span className="text-xs text-muted-foreground uppercase inline-flex flex-row items-center">
              <CommandIcon className="size-3 mr-0.5" /> P
            </span>
          </Button>
        </div>

        <ResizablePanelGroup
          className="flex flex-row gap-2"
          direction="horizontal"
        >
          <ResizablePanel className="bg-white rounded-md p-4">
            <WebTeXEditor ref={editorRef} />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel className="flex bg-white rounded-md overflow-hidden justify-center items-center">
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
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </WorkspaceContext.Provider>
  );
}
