// Momo review pool for focus completion card
import { t } from '../js/i18n/terms.js';

const MOMO_REVIEWS = {
  _generic: [
    'momoReviewGeneric0',
    'momoReviewGeneric1',
    'momoReviewGeneric2',
    'momoReviewGeneric3',
    'momoReviewGeneric4',
    'momoReviewGeneric5',
    'momoReviewGeneric6',
    'momoReviewGeneric7'
  ],
  book_001: [
    'momoReviewBook001_0',
    'momoReviewBook001_1'
  ],
  book_016: [
    'momoReviewBook016_0',
    'momoReviewBook016_1'
  ],
  book_017: [
    'momoReviewBook017_0',
    'momoReviewBook017_1'
  ],
  book_023: [
    'momoReviewBook023_0',
    'momoReviewBook023_1'
  ],
  book_024: [
    'momoReviewBook024_0',
    'momoReviewBook024_1'
  ],
  book_027: [
    'momoReviewBook027_0',
    'momoReviewBook027_1'
  ],
  book_028: [
    'momoReviewBook028_0',
    'momoReviewBook028_1'
  ],
  book_029: [
    'momoReviewBook029_0',
    'momoReviewBook029_1'
  ]
};

export function getMomoReview(book) {
  if (Math.random() > 0.3) return null;
  const pool = (book && MOMO_REVIEWS[book.id]) ? MOMO_REVIEWS[book.id] : [];
  const fullPool = pool.length > 0 ? [...pool, ...MOMO_REVIEWS._generic] : MOMO_REVIEWS._generic;
  const key = fullPool[Math.floor(Math.random() * fullPool.length)];
  return t(key);
}
