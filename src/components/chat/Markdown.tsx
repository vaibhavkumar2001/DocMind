"use client";

import { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Only plain web links survive. javascript:, data: and relative links are dropped.
function safeUrl(url: string) {
  return /^https?:\/\//i.test(url) ? url : null;
}

const components: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  h1: ({ children }) => <h3 className="mb-2 text-lg font-bold">{children}</h3>,
  h2: ({ children }) => <h3 className="mb-2 text-base font-bold">{children}</h3>,
  h3: ({ children }) => <h3 className="mb-2 text-base font-semibold">{children}</h3>,
  blockquote: ({ children }) => (
    <blockquote className="mb-2 border-l-4 border-primary/50 pl-3 text-muted-foreground">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) =>
    href ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="text-secondary underline underline-offset-2 hover:text-primary"
      >
        {children}
      </a>
    ) : (
      <span>{children}</span>
    ),
  code: ({ className, children }) =>
    className ? (
      <code className={className}>{children}</code>
    ) : (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-accent-foreground">
        {children}
      </code>
    ),
  pre: ({ children }) => (
    <pre className="mb-2 overflow-x-auto rounded-xl border bg-muted p-3 font-mono text-sm last:mb-0 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-foreground">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="mb-2 overflow-x-auto last:mb-0">
      <table className="min-w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border bg-muted px-2 py-1 text-left font-semibold">{children}</th>
  ),
  td: ({ children }) => <td className="border px-2 py-1">{children}</td>,
  // Images are never rendered: a remote image URL can leak data to another server
  img: () => null,
};

function MarkdownBase({ text }: { text: string }) {
  // No rehype-raw plugin on purpose: raw HTML in the text is never turned into real HTML
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components} urlTransform={safeUrl}>
      {text}
    </ReactMarkdown>
  );
}

export default memo(MarkdownBase);