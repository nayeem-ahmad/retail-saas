import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

function stripHtml(value: unknown): unknown {
    if (typeof value === 'string') {
        return value.replace(/<[^>]*>/g, '').trim();
    }
    if (Array.isArray(value)) {
        return value.map(stripHtml);
    }
    if (value !== null && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, stripHtml(v)]),
        );
    }
    return value;
}

@Injectable()
export class SanitizePipe implements PipeTransform {
    transform(value: unknown, _metadata: ArgumentMetadata) {
        return stripHtml(value);
    }
}
