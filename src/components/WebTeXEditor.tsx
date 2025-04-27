import { WorkspaceContext } from "@/utils/files";
import { Editor } from "@monaco-editor/react";
import { use, useEffect, useState } from "react";

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
        const fileExtension = selectedFile.path.split(".").pop() ?? "";
        const detectedLanguage = LANGUAGE_MAP[fileExtension] ?? "plaintext";
        setLanguage(detectedLanguage);

        const file = await selectedFile.fileHandle.getFile();
        const content = await file.text();

        editorRef.current.setValue(content);
      } else if (!selectedFile && editorRef.current) {
        // Clear editor if no file is selected
        editorRef.current.setValue("// Select a file on the left to edit");
        setLanguage("plaintext"); // Reset language when no file is selected
      }
    }

    loadFile();
  }, [selectedFile, editorRef]);

  return (
    <Editor
      height="100%"
      language={language}
      onMount={(editor) => (editorRef.current = editor)}
      onChange={(value) => {
        if (selectedFile && editorRef.current) {
          selectedFile.fileHandle.createWritable().then((writer) => {
            writer.write(value ?? "");
            writer.close();
          });
        }
      }}
    />
  );
}
