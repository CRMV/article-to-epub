import type { NormalizedArticle } from "../../types";

export interface ArticlePreviewProps {
  article: NormalizedArticle;
  density?: "comfortable" | "compact";
  showImages?: boolean;
}

export function ArticlePreview({ article, density = "comfortable", showImages = true }: ArticlePreviewProps) {
  return (
    <section className="panel-section preview-section" aria-labelledby="preview-heading">
      <h2 id="preview-heading">Preview</h2>
      <article
        className="article-preview"
        data-density={density}
        data-show-images={showImages ? "true" : "false"}
        dangerouslySetInnerHTML={{ __html: article.contentHtml }}
      />
    </section>
  );
}
