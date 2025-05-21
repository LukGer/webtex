import { BIBTEX_LANG } from "@/utils/bibtex";
import { LATEX_COMPLETIONS, LATEX_LANG } from "@/utils/latex";
import { Editor } from "@monaco-editor/react";
import type * as monaco from "monaco-editor";
import * as React from "react";

type MonacoEditorProps = {
  path: string;
  value: string;
  language: string;
  onValueChange: (val: string) => void;
  [key: string]: unknown;
};

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  path,
  value,
  language,
  onValueChange,
  ...options
}) => {
  const editorRef = React.useRef<monaco.editor.IStandaloneCodeEditor | null>(
    null
  );

  React.useEffect(() => {
    return () => {
      try {
        editorRef.current?.getModel()?.dispose();
      } catch (error) {
        console.error("Error cleaning up Monaco editor:", error);
      }
    };
  }, []);

  return (
    <Editor
      beforeMount={(mon) => {
        mon.languages.register({ id: "latex" });
        mon.languages.register({ id: "bibtex" });
        mon.languages.setMonarchTokensProvider("latex", LATEX_LANG);
        mon.languages.setMonarchTokensProvider("bibtex", BIBTEX_LANG);
        mon.languages.registerCompletionItemProvider(
          "latex",
          LATEX_COMPLETIONS
        );
      }}
      onMount={(editor) => {
        editorRef.current = editor;
      }}
      path={path}
      defaultValue={value}
      defaultLanguage={language}
      className="h-full w-full"
      onChange={(value) => onValueChange(value ?? "")}
      options={options}
    />
  );
};

export default MonacoEditor;
