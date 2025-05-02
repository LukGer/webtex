import { BIBTEX } from "@/utils/bibtex";
import { LATEX } from "@/utils/latex";
import { Editor } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import * as React from "react";

type MonacoEditorProps = {
  path: string;
  value: string;
  language: string;
  onValueChange: (val: string) => void;
  [key: string]: any; // For any other Monaco editor options
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
    if (editorRef.current) {
      let model = monaco.editor.getModel(monaco.Uri.parse(path));

      if (!model) {
        model = monaco.editor.createModel(
          value,
          language,
          monaco.Uri.parse(path)
        );
      }

      editorRef.current?.setModel(model);
      editorRef.current?.updateOptions(options);
    }

    return () => {
      editorRef.current?.dispose();
    };
  }, [editorRef]);

  // Update on prop changes
  React.useEffect(() => {
    const editor = editorRef.current;
    const model = editor?.getModel();

    if (editor && model) {
      editor.updateOptions(options);

      if (value !== model.getValue()) {
        model.setValue(value);
      }
    }
  }, [value, options]);

  return (
    <Editor
      beforeMount={(mon) => {
        mon.languages.register({ id: "latex" });
        mon.languages.register({ id: "bibtex" });

        mon.languages.setMonarchTokensProvider("latex", LATEX);
        mon.languages.setMonarchTokensProvider("bibtex", BIBTEX);
      }}
      onMount={(editor) => (editorRef.current = editor)}
      language={language}
      className="w-full h-full"
      onChange={(value) => onValueChange(value ?? "")}
    />
  );
};

export default MonacoEditor;
