// Cloudflare's Pages bundler supports JSON imports without Node import attributes.
import offers from '../../src/data/offers.json';
import { createOfferHandler } from '../../src/lib/offer-endpoint.js';
export const onRequestGet = createOfferHandler(offers);
