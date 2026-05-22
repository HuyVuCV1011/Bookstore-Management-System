// Cleanup synthetic Neo4j GraphDB NFR seed.

MATCH ()-[r]->()
WHERE r.nfr_seed = true
DELETE r;

MATCH (n)
WHERE n.nfr_seed = true
DETACH DELETE n;
