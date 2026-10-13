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
    <blockquote className="mb-2 border-l-4 border-slate-300 pl-3 text-slate-600 dark:border-slate-600 dark:text-slate-400">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) =>
    href ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="text-indigo-600 underline dark:text-indigo-400"
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
      <code className="rounded bg-slate-200 px-1 py-0.5 text-[0.85em] dark:bg-slate-700">
        {children}
      </code>
    ),
  pre: ({ children }) => (
    <pre className="mb-2 overflow-x-auto rounded-lg bg-slate-200 p-3 text-sm last:mb-0 dark:bg-slate-900 [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="mb-2 overflow-x-auto last:mb-0">
      <table className="min-w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-slate-300 px-2 py-1 text-left font-semibold dark:border-slate-600">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-slate-300 px-2 py-1 dark:border-slate-600">{children}</td>
  ),
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