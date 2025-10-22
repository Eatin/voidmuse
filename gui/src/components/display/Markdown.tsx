import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MarkdownCodeBlock from './MarkdownCodeBlock';
import { marked } from 'marked';
import './Markdown.scss';
import { useMemo } from 'react';
import { IDEService } from '@/api/IDEService';
interface MarkdownProps {
  content: string;
}

function parseMarkdownIntoBlocks(markdown: string) {
  const tokens = marked.lexer(markdown);
  return tokens.map(token => token.raw);
}

const Markdown = ({ content }: MarkdownProps) => {
  const components: Components = {
    a: ({ node, href, children, ...props }) => {
      return (
        <a
          href={href}
          onClick={(e) => {
            e.preventDefault();
            IDEService.getInstance().openUrl({ url: href || '' });
          }}
          {...props}
        >
          {children}
        </a>
      );
    },
    code: ({ node, className, children, ...rest }) => {
      return (
        <MarkdownCodeBlock className={className} {...rest}>
          {children}
        </MarkdownCodeBlock>
      );
    },
  };

  // Parse Markdown and render
  const blocks = useMemo(() => {
    // Only parse when content actually has content
    return content ? parseMarkdownIntoBlocks(content) : [];
  }, [content]);

  return (
    <>
      {blocks.map((block, index) => (
        <ReactMarkdown
          key={`${'markdown'}-block_${index}`}
          remarkPlugins={[remarkGfm]}
          components={components}
          className="fira-code-markdown"
        >
          {block}
        </ReactMarkdown>
      ))}
    </>
  );
};

export default Markdown;