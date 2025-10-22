import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react';
import { Document } from '@tiptap/extension-document';
import Text from '@tiptap/extension-text';
import Paragraph from '@tiptap/extension-paragraph';
import { useEffect, useRef } from 'react';
import Mention from '@tiptap/extension-mention';
import '../tiptap/styles.scss';
import MentionComponent from "../tiptap/MentionComponent";
import { debounce } from 'lodash';

interface UserDisplayProps {
  content: string;
}

const UserDisplay: React.FC<UserDisplayProps> = ({ content }) => {

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
      }).extend({
        addAttributes() {
          return {
            ...(this.parent?.() || {}),
            readonly: {
              default: true,  
              parseHTML: element => element.getAttribute('readonly') === 'true',
            },
            type: {},
            path: {
              default: null,
              parseHTML: element => element.getAttribute('expansion-data-path'),
            },
            line: {
              default: null,
              parseHTML: element => element.getAttribute('expansion-data-line'),
            },
          };
        },
        addNodeView() {
          return ReactNodeViewRenderer(MentionComponent)
        }
      }),
    ],
    content: '',
    editable: false,
  });

  useEffect(() => {
    if (editor) {
      editor.commands.setContent(content);

      // Find all mention nodes and set readonly attribute
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'mention') {
          editor.commands.command(({ tr }) => {
            tr.setNodeAttribute(pos, 'readonly', true);
            return true;
          });
        }
        return true;
      });
    }
  }, [editor, content]);

  return <EditorContent editor={editor} />;
};

export default UserDisplay;
