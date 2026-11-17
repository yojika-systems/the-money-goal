export function onRequestGet({env}) {
 return Response.json({status:'ok',aggregateMeasurement:Boolean(env.TMG_METRICS)},{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
