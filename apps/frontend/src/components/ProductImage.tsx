'use client';

import Image from 'next/image';
import { Package } from 'lucide-react';
import { useState } from 'react';

interface ProductImageProps {
    src: string | null | undefined;
    alt: string;
    className?: string;
    fallbackClassName?: string;
}

/**
 * Renders a product image via next/image (avif/webp, lazy-loaded, CDN-cached).
 * Falls back to a placeholder icon if the URL is missing or the image fails to load.
 */
export default function ProductImage({ src, alt, className, fallbackClassName }: ProductImageProps) {
    const [errored, setErrored] = useState(false);

    if (!src || errored) {
        return (
            <div className={`flex items-center justify-center ${fallbackClassName ?? 'w-full h-full'}`}>
                <Package className="w-8 h-8 text-gray-200" />
            </div>
        );
    }

    return (
        <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
            className={`object-cover ${className ?? ''}`}
            onError={() => setErrored(true)}
        />
    );
}
