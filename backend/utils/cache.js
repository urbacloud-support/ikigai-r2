import NodeCache from 'node-cache';

// Initialize cache with standard TTL of 1 hour (3600 seconds)
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

export default cache;
