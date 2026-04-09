import { useEditor, EditorContent } from '@tiptap/react';
import { editorExtensions } from '../lib/tiptap-config';
import { loadMarkdownIntoEditor } from '../lib/markdown-utils';
import { useEffect } from 'react';

interface TipTapEditorProps {
  content: string;
  onChange?: (content: string) => void;
  editable?: boolean;
}

export function TipTapEditor({ content, onChange, editable = true }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: editorExtensions,
    content: '',
    editable,
    onUpdate: ({ editor }) => {
      if (onChange) {
        // Get HTML content
        const html = editor.getHTML();
        onChange(html);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[500px] p-4',
      },
    },
  });

  // Load markdown content when it changes
  useEffect(() => {
    if (editor && content) {
      loadMarkdownIntoEditor(editor, content);
    }
  }, [editor, content]);

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="border rounded-lg bg-white">
      {editable && (
        <div className="border-b p-2 flex gap-2 flex-wrap bg-gray-50">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-3 py-1 rounded ${
              editor.isActive('bold') ? 'bg-gray-300' : 'bg-gray-200 hover:bg-gray-300'
            }`}
            type="button"
          >
            Bold
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-3 py-1 rounded ${
              editor.isActive('italic') ? 'bg-gray-300' : 'bg-gray-200 hover:bg-gray-300'
            }`}
            type="button"
          >
            Italic
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`px-3 py-1 rounded ${
              editor.isActive('strike') ? 'bg-gray-300' : 'bg-gray-200 hover:bg-gray-300'
            }`}
            type="button"
          >
            Strike
          </button>
          <div className="border-l mx-2"></div>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-3 py-1 rounded ${
              editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : 'bg-gray-200 hover:bg-gray-300'
            }`}
            type="button"
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-3 py-1 rounded ${
              editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : 'bg-gray-200 hover:bg-gray-300'
            }`}
            type="button"
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-3 py-1 rounded ${
              editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : 'bg-gray-200 hover:bg-gray-300'
            }`}
            type="button"
          >
            H3
          </button>
          <div className="border-l mx-2"></div>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-3 py-1 rounded ${
              editor.isActive('bulletList') ? 'bg-gray-300' : 'bg-gray-200 hover:bg-gray-300'
            }`}
            type="button"
          >
            Bullet List
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-3 py-1 rounded ${
              editor.isActive('orderedList') ? 'bg-gray-300' : 'bg-gray-200 hover:bg-gray-300'
            }`}
            type="button"
          >
            Numbered List
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`px-3 py-1 rounded ${
              editor.isActive('blockquote') ? 'bg-gray-300' : 'bg-gray-200 hover:bg-gray-300'
            }`}
            type="button"
          >
            Quote
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`px-3 py-1 rounded ${
              editor.isActive('codeBlock') ? 'bg-gray-300' : 'bg-gray-200 hover:bg-gray-300'
            }`}
            type="button"
          >
            Code
          </button>
          <div className="border-l mx-2"></div>
          <button
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
            type="button"
          >
            Horizontal Rule
          </button>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
