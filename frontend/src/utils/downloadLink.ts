export function getBackendBase(): string {
    const apiBase = (import.meta.env.VITE_API_URL || '/api');
    return apiBase.replace(/\/api\/?$/, '');
}

export function getDownloadLink(url: string | undefined | null): string | undefined {
    if (!url) return undefined;

    if (/^https?:\/\//i.test(url)) return url;

    const normalized = url.replace(/^\/+/, '');

    if (normalized.startsWith('media/')) {
        const savedPath = normalized.replace(/^media\//, '');
        return `${getBackendBase()}/media-download/${savedPath}/`;
    }

    if (normalized.startsWith('media')) {
        const savedPath = normalized.replace(/^media\//, '');
        return `${getBackendBase()}/media-download/${savedPath}/`;
    }

    return `${getBackendBase()}/media-download/${normalized}/`;
}

export function openDownload(url: string | undefined | null) {
    const link = getDownloadLink(url);
    if (!link) return;
    window.open(link, '_blank');
}
