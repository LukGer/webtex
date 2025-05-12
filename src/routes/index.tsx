import { AppSidebar } from "@/components/AppSidebar";
import { FileSelectionDialog } from "@/components/FileSelectionDialog";
import PDFViewer from "@/components/PdfViewer";
import WebTeXEditor, {
  type WebTeXEditorHandle,
} from "@/components/WebTeXEditor";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useOpfs } from "@/hooks/use-opfs";
import { WorkspaceContext } from "@/utils/files";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlignJustifyIcon,
  BlocksIcon,
  CommandIcon,
  LoaderIcon,
  SaveIcon,
  SidebarCloseIcon,
  SidebarOpenIcon,
  WrapTextIcon,
} from "lucide-react";
import { useQueryState } from "nuqs";
import { useRef, useState } from "react";
import { usePdfTeXEngine } from "../hooks/usePdfTeXEngine";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const [selectedPath, setSelectedPath] = useQueryState("path");

  const [wordWrap, setWordWrap] = useState(false);

  const editorRef = useRef<WebTeXEditorHandle | null>(null);

  const sidebar = useSidebar();

  const engine = usePdfTeXEngine();

  const opfsQuery = useOpfs();

  const syncOpfsToMemFs = async (
    dirHandle: FileSystemDirectoryHandle,
    currentPath = ""
  ) => {
    if (!engine) return;

    for await (const entry of dirHandle.values()) {
      const entryPath = currentPath
        ? `${currentPath}/${entry.name}`
        : entry.name;
      if (entry.kind === "file") {
        const file = await entry.getFile();
        const content = await file.text();
        engine.writeMemFSFile(entryPath, content);
      } else if (entry.kind === "directory") {
        engine.makeMemFSFolder(entryPath);
        await syncOpfsToMemFs(entry, entryPath);
      }
    }
  };

  const compilePdf = useMutation({
    mutationFn: async (): Promise<ArrayBuffer> => {
      const root = opfsQuery.data?.root;

      if (!engine?.isReady() || !root) {
        throw new Error("Engine or OPFS not ready yet.");
      }

      await syncOpfsToMemFs(root);

      engine.setEngineMainFile("main.tex");

      const result = await engine.compileLaTeX();

      if (result.pdf) {
        return result.pdf.buffer as ArrayBuffer;
      }

      console.log(result);
      throw new Error(result.log);
    },
  });

  const saveFileMutation = useMutation({
    mutationFn: async () => {
      await editorRef.current?.saveFile();
    },
  });

  const handleCommand = async (command: string, payload?: string) => {
    switch (command) {
      case "compile": {
        compilePdf.mutate();
        break;
      }
      case "open": {
        const path = payload;
        setSelectedPath(path!);
      }
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        selectedPath,
        setSelectedPath,
        files: opfsQuery.data?.files ?? [],
      }}
    >
      <AppSidebar />

      <main className="flex-1 flex flex-col gap-4 p-4 bg-gray-100">
        <ResizablePanelGroup
          className="flex flex-row gap-2"
          direction="horizontal"
        >
          <ResizablePanel className="bg-white rounded-md p-4 flex flex-col gap-4">
            <div className="flex flex-row items-center">
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      sidebar.toggleSidebar();
                    }}
                  >
                    {sidebar.open ? <SidebarCloseIcon /> : <SidebarOpenIcon />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="flex flex-row items-center gap-2">
                  {sidebar.open ? "Close" : "Open"} Sidebar
                </TooltipContent>
              </Tooltip>

              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
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
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="flex flex-row items-center gap-2">
                  Save
                  <span className="text-xs text-muted-foreground uppercase inline-flex flex-row items-center">
                    <CommandIcon className="size-3 mr-0.5" /> S
                  </span>
                </TooltipContent>
              </Tooltip>

              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setWordWrap((prev) => !prev);
                    }}
                  >
                    {wordWrap ? <WrapTextIcon /> : <AlignJustifyIcon />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle Word Wrap</p>
                </TooltipContent>
              </Tooltip>

              <div className="flex-1" />

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
            <WebTeXEditor ref={editorRef} wordWrap={wordWrap} />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel className="flex bg-white rounded-md overflow-hidden justify-center items-center gap-2">
            {compilePdf.isSuccess ? (
              // <iframe
              //   src={compilePdf.data}
              //   className="w-full h-full"
              //   style={{ border: "none" }}
              //   title="PDF Preview"
              // />
              <PDFViewer pdf={compilePdf.data} />
            ) : compilePdf.isError ? (
              <span className="text-red-500">{compilePdf.error.message}</span>
            ) : (
              <>
                <BlocksIcon className="size-4" />
                <span className="text-sm">No PDF available</span>
              </>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
      <FileSelectionDialog
        onCommandSelect={(command, payload) => handleCommand(command, payload)}
      />
    </WorkspaceContext.Provider>
  );
}
