import type { NormalizedArticle } from "../../types";

export function ArticlePreview({ article }: { article: NormalizedArticle }) {
  return (
    <section className="panel-section preview-section" aria-labelledby="preview-heading">
      <h2 id="preview-heading">Preview</h2>
      <article className="article-preview" dangerouslySetInnerHTML={{ __html: article.contentHtml }} />
    </section>
  );
}

