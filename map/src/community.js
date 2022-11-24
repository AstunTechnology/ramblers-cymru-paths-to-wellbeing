import {
  createEmpty as createEmptyExtent,
  extend as extendExtent
} from 'ol/extent';
import { fromExtent as polygonfromExtent } from 'ol/geom/Polygon';
import Feature from 'ol/Feature';
import VectorSource from 'ol/source/Vector';

function makeCommunitySource(routeSource) {
  // Create a lookup of {[communityName: string]: Array<Extent>}
  const extentByCommunity = {};
  routeSource.forEachFeature((feature) => {
    const communityName = feature.get('community');
    let communityExtents = extentByCommunity[communityName];
    if (!communityExtents) {
      communityExtents = extentByCommunity[communityName] = [];
    }
    communityExtents.push(feature.getGeometry().getExtent());
  });
  // Combine multiple extents into a single extent and convert to a polygon
  // per community {[communityName: string]: Polygon}
  Object.keys(extentByCommunity).forEach((name) => {
    extentByCommunity[name] = polygonfromExtent(
      // Combine individual extents into a single extent for the community
      extentByCommunity[name].reduce(extendExtent, createEmptyExtent())
    );
  });
  // Create an array of feature, one per community with a name property
  // and a polygon geometry
  const features = Object.keys(extentByCommunity).map((name) => {
    return new Feature({ name, geometry: extentByCommunity[name] });
  });
  return new VectorSource({ features });
}

export { makeCommunitySource };
