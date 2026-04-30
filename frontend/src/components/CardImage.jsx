import { useEffect, useState } from "react";
import {
    buildRemoteFallbackCardImageUrl,
    getCardImageBlobUrlWithCache,
} from "../services/browserImageCacheService.js";

function getFallbackSrc(card, size) {
    const remote = buildRemoteFallbackCardImageUrl(card, size);

    if (remote) {
        return remote;
    }

    return "/card_placeholder.png";
}

export default function CardImage({
                                      card,
                                      size = "small",
                                      alt = "card",
                                      className = "",
                                      draggable = false,
                                      ...props
                                  }) {
    const [src, setSrc] = useState(() => getFallbackSrc(card, size));
    const [objectUrl, setObjectUrl] = useState(null);

    useEffect(() => {
        let cancelled = false;
        let createdObjectUrl = null;

        setSrc(getFallbackSrc(card, size));

        async function loadImage() {
            if (!card?.id && !card?.cardId) {
                return;
            }

            try {
                const blobUrl = await getCardImageBlobUrlWithCache(card, size);

                if (cancelled) {
                    if (blobUrl) URL.revokeObjectURL(blobUrl);
                    return;
                }

                if (blobUrl) {
                    createdObjectUrl = blobUrl;
                    setObjectUrl(blobUrl);
                    setSrc(blobUrl);
                }
            } catch {
                if (cancelled) return;

                setSrc(getFallbackSrc(card, size));
            }
        }

        loadImage();

        return () => {
            cancelled = true;

            if (createdObjectUrl) {
                URL.revokeObjectURL(createdObjectUrl);
            }
        };
    }, [card?.id, card?.cardId, card?.imageUrlSmall, card?.imageUrlLarge, size]);

    useEffect(() => {
        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [objectUrl]);

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            draggable={draggable}
            onError={() => {
                setSrc("/card_placeholder.png");
            }}
            {...props}
        />
    );
}