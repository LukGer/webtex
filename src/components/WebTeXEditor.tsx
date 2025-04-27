import { WorkspaceContext } from "@/utils/files";
import { Editor } from "@monaco-editor/react";
import { use, useEffect, useState } from "react";
import { Button } from "./ui/button";

const LANGUAGE_MAP: { [key: string]: string } = {
  tex: "tex",
  bib: "bibtex",
  cls: "tex",
  sty: "tex",
};

export default function WebTeXEditor({
  editorRef,
}: {
  editorRef: React.RefObject<any>;
}) {
  const [language, setLanguage] = useState("tex");

  const { selectedFile } = use(WorkspaceContext);

  useEffect(() => {
    async function loadFile() {
      if (selectedFile && editorRef.current) {
        const fileExtension = selectedFile.path.split(".").pop() || "";
        const detectedLanguage = LANGUAGE_MAP[fileExtension] || "plaintext"; // Default to plaintext if extension not found
        setLanguage(detectedLanguage);

        const file = await selectedFile.fileHandle.getFile();
        const content = await file.text();

        editorRef.current.setValue(content);
      } else if (!selectedFile && editorRef.current) {
        // Clear editor if no file is selected
        editorRef.current.setValue("");
        setLanguage("plaintext"); // Reset language when no file is selected
      }
    }

    loadFile();
  }, [selectedFile, editorRef]);

  const onSave = async () => {
    if (selectedFile) {
      const fileHandle = selectedFile.fileHandle;
      const writable = await fileHandle.createWritable();
      const content = editorRef.current.getValue();
      await writable.write(content);
      await writable.close();
    }
  };

  return (
    <>
      <div className="flex flex-row items-center p-2 gap-4">
        <Button onClick={onSave} variant="ghost" size="sm">
          Save
        </Button>
        <Button variant="default" size="sm">
          Compile
        </Button>
      </div>

      <Editor
        height="100%"
        language={language} // Use the dynamic language state
        onMount={(editor) => (editorRef.current = editor)}
      />
    </>
  );
}
