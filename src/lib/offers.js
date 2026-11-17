import registry from '../data/offers.json' with { type: 'json' };
import { offerAvailable } from './offer-policy.js';
export { offerAvailable, trackedOfferUrl, offerExitUrl } from './offer-policy.js';
export const offers = registry;
export function getOffer(id, market, now = new Date()) {
 const offer = offers.find(o => o.id === id);
 return offerAvailable(offer, market, now) ? offer : null;
}
