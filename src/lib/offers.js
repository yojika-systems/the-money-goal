import registry from '../data/offers.json' with { type: 'json' };
export const offers = registry;
export function offerAvailable(offer, market, now = new Date()) {
  return Boolean(offer && offer.status === 'active' && ['approved', 'existing-owner-confirmed'].includes(offer.approval)
    && offer.markets?.includes(market) && offer.channels?.includes('website') && offer.url?.startsWith('https://')
    && offer.lastVerified && new Date(offer.lastVerified) <= now && offer.expiresAt && new Date(offer.expiresAt) > now
    && (!offer.requiresCreativeApproval || offer.creativeApproval === 'approved'));
}
export function getOffer(id, market, now = new Date()) {
  const offer = offers.find(o => o.id === id);
  return offerAvailable(offer, market, now) ? offer : null;
}
export function trackedOfferUrl(offer, page, placement) {
  const url = new URL(offer.url);
  if (offer.placementTracking) url.searchParams.set(offer.placementTracking, `${page}:${placement}`.replace(/[^a-z0-9:_-]/gi, '').slice(0, 100));
  return url.href;
}

export function offerExitUrl(offer, market, page, placement) {
  const q = new URLSearchParams({ id: offer.id, market, page: page.replace(/[^a-z0-9-]/gi, '-').slice(0,60), placement });
  return `/api/offer?${q}`;
}
