interface Item {
  id: string;
  url: string;
  mimeType: string;
}

interface Props {
  items: Item[];
}

/**
 * Server-rendered list of attachments on a reminder. Image MIME types
 * become <img> thumbnails; audio MIME types become <audio controls>.
 * Anything else falls back to a plain link.
 */
export function AttachmentList({ items }: Props) {
  if (items.length === 0) return null;
  return (
    <div data-testid="attachment-list" style={{ marginTop: 8 }}>
      <div className="h-meta" style={{ marginBottom: 4 }}>
        附件（{items.length}）
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {items.map((it) => {
          if (it.mimeType.startsWith("image/")) {
            return (
              <a
                key={it.id}
                href={it.url}
                target="_blank"
                rel="noopener"
                data-testid={`attachment-${it.id}`}
                className="hf-box tight"
                style={{
                  display: "block",
                  padding: 4,
                  background: "var(--paper)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={it.url}
                  alt="附件预览"
                  style={{
                    width: 88,
                    height: 88,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </a>
            );
          }
          if (it.mimeType.startsWith("audio/")) {
            return (
              <audio
                key={it.id}
                controls
                src={it.url}
                data-testid={`attachment-${it.id}`}
                style={{ height: 32 }}
              />
            );
          }
          return (
            <a
              key={it.id}
              href={it.url}
              target="_blank"
              rel="noopener"
              data-testid={`attachment-${it.id}`}
              className="hf-chip"
            >
              附件
            </a>
          );
        })}
      </div>
    </div>
  );
}
