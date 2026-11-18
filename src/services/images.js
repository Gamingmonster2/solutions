/**
 * Optional image enrichment. The keys are kept in the browser and the
 * provider is called directly — nothing is proxied through our Worker.
 */

const STOPWORDS = new Set([
  'about', 'above', 'after', 'again', 'against', 'all', 'and', 'any', 'are',
  'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but',
  'could', 'did', 'does', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'her', 'here', 'hers', 'herself',
  'him', 'himself', 'his', 'how', 'into', 'its', 'itself', 'just', 'more',
  'most', 'now', 'off', 'once', 'only', 'other', 'our', 'ours', 'ourselves',
  'out', 'over', 'own', 'same', 'she', 'should', 'some', 'such', 'than', 'that',
  'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these',
  'they', 'this', 'those', 'through', 'too', 'under', 'until', 'very', 'was',
  'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why',
  'will', 'with', 'you', 'your', 'yours', 'yourself', 'yourselves',
  'في', 'من', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'التي', 'الذي',
  'كان', 'كانت', 'يكون', 'أن', 'إن', 'لا', 'ما', 'هو', 'هي', 'نحن', 'أنت',
  'أنا', 'كل', 'بعض', 'غير', 'بين', 'قبل', 'بعد', 'حتى', 'إذا', 'كما', 'لكن',
  'أو', 'ثم', 'قد', 'لقد', 'هنا', 'هناك',
])

/** Pull the two most meaningful words out of a prompt (ported from chat.txt). */
export function extractKeywords(text) {
  const withoutCode = String(text ?? '').replace(/```[\s\S]*?```/g, '')
  const words = withoutCode.replace(/[^\w\s\u0600-\u06FF]/g, '').split(/\s+/)
  const counts = {}

  for (const word of words) {
    const lower = word.toLowerCase()
    if (lower.length > 2 && !STOPWORDS.has(lower)) {
      counts[lower] = (counts[lower] ?? 0) + 1
      if (word[0] === word[0].toUpperCase()) counts[lower] += 2
    }
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([word]) => word)
    .join(' ')
}

export async function searchPexels(query, key) {
  if (!query || !key) return []
  const url = new URL('https://api.pexels.com/v1/search')
  url.searchParams.set('query', query)
  url.searchParams.set('per_page', '4')
  url.searchParams.set('orientation', 'landscape')

  const response = await fetch(url, { headers: { Authorization: key } })
  if (!response.ok) throw new Error(`Pexels HTTP ${response.status}`)

  const data = await response.json()
  return (data.photos ?? []).map((photo) => ({
    id: `pexels-${photo.id}`,
    url: photo.src?.large2x ?? photo.src?.large ?? photo.src?.medium,
    thumb: photo.src?.medium ?? photo.src?.small,
    alt: photo.alt ?? query,
    tags: query,
    width: photo.width,
    height: photo.height,
  }))
}

export async function searchPixabay(query, key) {
  if (!query || !key) return []
  const url = new URL('https://pixabay.com/api/')
  url.searchParams.set('key', key)
  url.searchParams.set('q', query)
  url.searchParams.set('image_type', 'photo')
  url.searchParams.set('orientation', 'all')
  url.searchParams.set('per_page', '18')

  const response = await fetch(url)
  if (!response.ok) throw new Error(`Pixabay HTTP ${response.status}`)

  const data = await response.json()
  return (data.hits ?? []).map((hit) => ({
    id: `pixabay-${hit.id}`,
    url: hit.largeImageURL ?? hit.webformatURL,
    thumb: hit.webformatURL,
    alt: hit.tags ?? query,
    tags: hit.tags ?? query,
    width: hit.imageWidth,
    height: hit.imageHeight,
    aspectRatio: Number((hit.imageWidth / hit.imageHeight).toFixed(2)),
  }))
}

/** Build the visual-injection instruction block used by the website builder. */
export function visualInstructions(selectedImages, hasKey, visualMode) {
  if (!visualMode) {
    return '[MODE: TEXT-ONLY MODE] Rely strictly on typography, CSS gradients, shapes, colors and layouts. Do not use any image tags or placeholders.'
  }
  if (!hasKey) {
    return '[MODE: TEXT-ONLY] Visual mode requested but no image key is configured. Rely strictly on typography, CSS shapes, gradients and layout.'
  }
  if (!selectedImages.length) {
    return '[MODE: TEXT-ONLY] Visual mode enabled but no images were selected. Rely strictly on typography, CSS shapes, gradients and layout.'
  }

  const assets = selectedImages
    .map((image) => `- URL: ${image.url} | Tags: ${image.tags} | Aspect Ratio: ${image.aspectRatio ?? 1}`)
    .join('\n')

  return `[MODE: VISUAL INJECTION]
You MUST use these specific image URLs in the generated HTML. Map them logically by tags and aspect ratio.
${assets}
1. Place wide images (aspect_ratio > 1.2) in hero sections or full-width backgrounds.
2. Place portrait/square images in cards, grids, team sections or sidebars.
3. Use high-quality classes: object-cover, rounded-xl, shadow-lg, hover:scale-105, transition-transform duration-500.
4. If the user asks to refine or change images, swap old URLs for new ones while keeping the structure intact.`
}
