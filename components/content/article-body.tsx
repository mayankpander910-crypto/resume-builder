import type { Block } from "@/lib/content/types";

export function ArticleBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className="prose-page max-w-none">
      {blocks.map((block, index) => {
        if ("h" in block) {
          return block.h === 2 ? <h2 key={index}>{block.text}</h2> : <h3 key={index}>{block.text}</h3>;
        }
        if ("p" in block) return <p key={index}>{block.p}</p>;
        if ("ul" in block) {
          return (
            <ul key={index}>
              {block.ul.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          );
        }
        if ("ol" in block) {
          return (
            <ol key={index} className="mb-4 list-decimal space-y-1 pl-5 text-[14px] leading-relaxed text-ink-2">
              {block.ol.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          );
        }
        if ("quote" in block) return <blockquote key={index}>{block.quote}</blockquote>;
        if ("callout" in block) {
          return (
            <div key={index} className="my-5 rounded-[7px] border border-accent/25 bg-accent-soft/50 px-3.5 py-3 text-[13.5px] leading-relaxed text-accent-ink">
              {block.callout}
            </div>
          );
        }
        if ("table" in block) {
          return (
            <div key={index} className="my-5 overflow-x-auto rounded-[7px] border border-line">
              <table className="w-full border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-line bg-surface-2">
                    {block.table.head.map((cell) => (
                      <th key={cell} className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">
                        {cell}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.table.rows.map((row, r) => (
                    <tr key={r} className="border-b border-line last:border-0">
                      {row.map((cell, c) => (
                        <td key={c} className={`px-3 py-2 align-top leading-relaxed ${c === 0 ? "font-medium text-ink" : "text-ink-2"}`}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
