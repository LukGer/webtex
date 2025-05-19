import { AppSidebar } from "@/components/AppSidebar";
import { FileSelectionDialog } from "@/components/FileSelectionDialog";
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
import { useHotkeys } from "react-hotkeys-hook";
import { type PdfResult, usePdfTeXEngine } from "../hooks/usePdfTeXEngine";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const [selectedPath, setSelectedPath] = useQueryState("path");
  const [mainFilePath, setMainFilePath] = useState<string | null>("main.tex");

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
    mutationFn: async (): Promise<string> => {
      const root = opfsQuery.data?.root;
      const mailFilePath = mainFilePath;

      if (!engine?.isReady() || !root || !mailFilePath) {
        throw new Error("Engine or OPFS not ready yet.");
      }

      await syncOpfsToMemFs(root);

      engine.setEngineMainFile(mainFilePath);

      let result: PdfResult | undefined;
      for (let i = 0; i < 3; i++) {
        result = await engine.compileLaTeX();
      }

      if (result?.pdf) {
        return URL.createObjectURL(
          new Blob([result.pdf], { type: "application/pdf" })
        );
      }

      console.log(result);
      throw new Error(result?.log ?? "Compilation failed");
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

  useHotkeys(
    "meta+s",
    (e) => {
      e.preventDefault();
      saveFileMutation.mutate();
    },
    {
      enableOnFormTags: true,
    }
  );

  return (
    <WorkspaceContext.Provider
      value={{
        selectedPath,
        setSelectedPath,
        files: opfsQuery.data?.files ?? [],
        mainFilePath,
        setMainFilePath,
      }}
    >
      <AppSidebar />

      <main className="flex-1 flex flex-col gap-4 p-4 bg-gray-100 max-h-screen overflow-x-hidden">
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
                disabled={!engine || compilePdf.isPending}
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
          <ResizablePanel className="flex flex-col bg-white rounded-md">
            {compilePdf.isSuccess ? (
              <iframe
                className="w-full h-full"
                src={compilePdf.data}
                title="PDF Viewer"
              />
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
