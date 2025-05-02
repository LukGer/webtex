import { WorkspaceContext } from "@/utils/files";
import { SidebarIcon } from "lucide-react";
import {
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import MonacoEditor from "./MonacoEditor";

export interface WebTeXEditorHandle {
  saveFile: () => Promise<void>;
  getContent: () => string | undefined;
}

interface WebTeXEditorProps {
  wordWrap: boolean;
}

const EXTENSIONS_MAP = {
  tex: "latex",
  bib: "bibtex",
  sty: "latex",
  cls: "latex",
  bst: "bibtex",
  dtx: "latex",
  ins: "latex",
  ltx: "latex",
  lss: "latex",
} as const;

const WebTeXEditor = forwardRef<WebTeXEditorHandle, WebTeXEditorProps>(
  ({ wordWrap }, ref) => {
    const { selectedFile } = useContext(WorkspaceContext);

    const [path, setPath] = useState<string>("");
    const [value, setValue] = useState<string>("");
    const [language, setLanguage] = useState<string>("plaintext");

    useImperativeHandle(ref, () => ({
      saveFile: async () => {
        if (selectedFile) {
          const content = value;
          const fileHandle = selectedFile.fileHandle;
          const writable = await fileHandle.createWritable();
          await writable.write(content ?? "");
          await writable.close();
        }
      },
      getContent: () => {
        return value;
      },
    }));

    useEffect(() => {
      async function loadModel() {
        if (!selectedFile) return;

        const file = await selectedFile.fileHandle.getFile();
        const content = await file.text();
        const extension = selectedFile.path.split(".").pop() || "";
        const language =
          EXTENSIONS_MAP[extension as keyof typeof EXTENSIONS_MAP] ||
          "plaintext";

        setPath(selectedFile.path);
        setValue(content);
        setLanguage(language);
      }

      loadModel();
    }, [selectedFile]);

    return (
      <div className="h-full w-full relative">
        {!selectedFile && (
          <div className="rounded-lg z-10 absolute inset-0 bg-black/10 flex flex-row items-center justify-center gap-2">
            <SidebarIcon className="size-4" />
            <span className="text-sm">Select a file on the left</span>
          </div>
        )}
        <MonacoEditor
          path={path}
          value={value}
          language={language}
          onValueChange={(value) => setValue(value)}
          minimap={{ enabled: false }}
          wordWrap={wordWrap ? "on" : "off"}
        />
      </div>
    );
  }
);

export default WebTeXEditor;
