/**
 * Skip to Content Link
 * Allows keyboard users to skip navigation and go directly to main content
 * WCAG 2.1 AA Requirement: 2.4.1 Bypass Blocks
 */

export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      tabIndex={0}
    >
      Pular para o conteúdo principal
    </a>
  );
}
