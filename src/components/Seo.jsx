/**
 * Metadatos por ruta. React 19 eleva `<title>`, `<meta>` y `<link>` al `<head>`
 * automáticamente, así que no hace falta ninguna librería externa.
 *
 * @param {{
 *  title: string,
 *  description?: string,
 *  path?: string,
 *  noindex?: boolean,
 *  image?: string,
 * }} props
 * @returns {import('react').JSX.Element}
 */
export const SITE_URL = 'https://kore-manager.vercel.app';

export default function Seo({ title, description, path, noindex = false, image = '/images/og-image.jpg' }) {
  const url = path != null ? `${SITE_URL}${path}` : undefined;
  const absImage = image.startsWith('http') ? image : `${SITE_URL}${image}`;
  return (
    <>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {url && <link rel="canonical" href={url} />}
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      {url && <meta property="og:url" content={url} />}
      <meta property="og:image" content={absImage} />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={absImage} />
    </>
  );
}
