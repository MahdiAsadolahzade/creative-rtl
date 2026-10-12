import { cacheLife } from "next/cache";
import { renderDocument } from "@/lib/markdown/pipeline";

// Rendered on the server with the same pipeline as the editor, so the guide shows real output.
async function renderExample(source: string) {
  "use cache";
  cacheLife("max");
  return renderDocument({ source, mode: "markdown", dir: "auto" });
}

type GuideExampleProps = { title: string; source: string };

export async function GuideExample({ title, source }: GuideExampleProps) {
  const result = await renderExample(source);
  return (
    <figure className="guide-example">
      <figcaption>{title}</figcaption>
      <div className="guide-example__grid">
        <pre dir="ltr"><code>{source}</code></pre>
        <div className="paper guide-example__paper">
          {result.blocks.map((block) => (
            <div key={block.id} dir={block.dir} dangerouslySetInnerHTML={{ __html: block.html }} />
          ))}
        </div>
      </div>
    </figure>
  );
}
