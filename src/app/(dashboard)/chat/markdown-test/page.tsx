import Markdown from "@/components/chat/Markdown";

const NASTY = `**Bold** works, and so does a list:

- item one
- item two

[Safe link](https://example.com)
[Bad link](javascript:alert(1))

![tracking pixel](https://example.com/pixel.png?leak=secret)

<script>alert("xss")</script>
<img src=x onerror=alert(1)>

| Col A | Col B |
|---|---|
| 1 | 2 |
`;

export default function MarkdownTestPage() {
  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="mb-4 text-xl font-bold">Markdown safety test (delete after)</h1>
      <div className="rounded-2xl bg-slate-100 px-4 py-2 dark:bg-slate-800">
        <Markdown text={NASTY} />
      </div>
    </main>
  );
}