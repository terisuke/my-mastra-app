export const SUPPORTED_PLATFORMS = ['qiita', 'zenn', 'note'] as const;
export type SupportedPlatform = (typeof SUPPORTED_PLATFORMS)[number];
