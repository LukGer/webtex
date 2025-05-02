import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useSidebar } from "@/components/ui/sidebar";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import WebTeXEditor, {
  type WebTeXEditorHandle,
} from "@/components/WebTeXEditor";
import { useOpfs } from "@/hooks/use-opfs";
import { WorkspaceContext, type SelectedFile } from "@/utils/files";
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
import { useRef, useState } from "react";
import { usePdfTeXEngine } from "../hooks/usePdfTeXEngine";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const [selectedFile, setSelectedPath] = useState<SelectedFile | null>(null);
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
    mutationFn: async () => {
      const root = opfsQuery.data?.root;

      if (!engine || !root) {
        throw new Error("Engine or OPFS not ready yet.");
      }

      await syncOpfsToMemFs(root);

      engine.setEngineMainFile("main.tex");

      const result = await engine.compileLaTeX();

      if (result.pdf) {
        const pdfBlob = new Blob([result.pdf], { type: "application/pdf" });
        return URL.createObjectURL(pdfBlob);
      } else {
        console.log(result);
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
        <ResizablePanelGroup
          className="flex flex-row gap-2"
          direction="horizontal"
        >
          <ResizablePanel className="bg-white rounded-md p-4 flex flex-col gap-4">
            <div className="flex flex-row items-center">
              <Toggle
                onPressedChange={(toggled) => {
                  sidebar.setOpen(toggled);
                }}
              >
                {sidebar.open ? <SidebarCloseIcon /> : <SidebarOpenIcon />}
              </Toggle>

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
                  <Toggle
                    onPressedChange={(toggled) => {
                      setWordWrap(toggled);
                    }}
                  >
                    {wordWrap ? <WrapTextIcon /> : <AlignJustifyIcon />}
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle Word Wrap</p>
                </TooltipContent>
              </Tooltip>

              <div className="flex-1"></div>

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
              <iframe
                src={compilePdf.data}
                className="w-full h-full"
                style={{ border: "none" }}
                title="PDF Preview"
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
    </WorkspaceContext.Provider>
  );
}
