export function getBackendBase(): string {
    const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api');
    return apiBase.replace(/\/api\/?$/, '');
}

export function getDownloadLink(url: string | undefined | null): string | undefined {
    if (!url) return undefined;

    // Absolute URL -> return as-is
    if (/^https?:\/\//i.test(url)) return url;

    const normalized = url.replace(/^\/+/, '');

    // media/ prefix -> use media-download endpoint
    if (normalized.startsWith('media/')) {
        const savedPath = normalized.replace(/^media\//, '');
        return `${getBackendBase()}/media-download/${savedPath}/`;
    }

    if (normalized.startsWith('media')) {
        const savedPath = normalized.replace(/^media\//, '');
        return `${getBackendBase()}/media-download/${savedPath}/`;
    }

    // Fallback: treat as storage path
    return `${getBackendBase()}/media-download/${normalized}/`;
}

export function openDownload(url: string | undefined | null) {
    const link = getDownloadLink(url);
    if (!link) return;
    window.open(link, '_blank');
}
