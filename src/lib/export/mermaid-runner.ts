import { mermaidConfig } from "@/lib/mermaid/config";

export function buildMermaidRunner(): string {
  const config = JSON.stringify(mermaidConfig("Peyda Export"));
  return `(()=>{const run=async()=>{let index=0;const nodes=[...document.querySelectorAll(".mermaid-export")];if(window.mermaid&&nodes.length){const config=${config};config.fontFamily=getComputedStyle(document.body).fontFamily;window.mermaid.initialize(config);for(const node of nodes){try{const source=node.getAttribute("data-mermaid-src")||"";const result=await window.mermaid.render("export-"+index++,source);node.innerHTML=result.svg;node.classList.add("mermaid-rendered")}catch{node.setAttribute("data-mermaid-error","true")}}}window.__READY__=true};run().catch(()=>{window.__READY__=true})})();`;
}
