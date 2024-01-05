// @ts-ignore
import * as turf from '@turf/turf';
import { Feature, FeatureCollection, GeoJsonProperties, Point } from 'geojson';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { Layer, Marker, Source, useMap } from 'react-map-gl/maplibre';

export const GeoJsonToSomethings: React.FC<{
  geojson?: FeatureCollection;
  emoji?: string;
  style?: {
    color?: string;
    fillColor?: string;
    emoji?: string;
  };
}> = ({ geojson, emoji, style }) => {
  const { current: map } = useMap();

  const [currentZoom, setCurrentZoom] = useState<number | undefined>(8);
  const [opacity, setOpacity] = useState(0.8);
  const [fontSize, setFontSize] = useState('1em');

  useEffect(() => {
    if (!map) return;
    map.on('load', () => {
      setCurrentZoom(map.getZoom());
    });
    map.on('move', () => {
      setCurrentZoom(map.getZoom());
    });
    setCurrentZoom(map.getZoom());
  }, [map]);

  // determine style of markers
  useEffect(() => {
    let newOpacity = 0.8;
    let newFontSize = '1em';
    if (currentZoom) {
      if (14 <= currentZoom) {
        newOpacity = 1;
        newFontSize = '1.4em';
      }
      if (currentZoom < 14) {
        newOpacity = 0.8;
        newFontSize = '1.4em';
      }
      if (currentZoom < 13) {
        newOpacity = 0.75;
        newFontSize = '1.3em';
      }
      if (currentZoom < 12) {
        newOpacity = 0.7;
        newFontSize = '1.1em';
      }
      if (currentZoom < 11) {
        newOpacity = 0.6;
        newFontSize = '1em';
      }
      if (currentZoom < 10) {
        newOpacity = 0.65;
        newFontSize = '1em';
      }
    }
    //console.info("zoom, size, opacity:", currentZoom, newFontSize, newOpacity);
    setOpacity(newOpacity);
    setFontSize(newFontSize);
  }, [currentZoom]);

  const onClickMarker = useCallback(
    (center: Feature<Point, GeoJsonProperties> | undefined) => {
      if (map === undefined || center === undefined) {
        return;
      }
      const zoomTo = map.getZoom() < 10 ? 10 : 14;
      map.flyTo({
        center: [center.geometry.coordinates[0], center.geometry.coordinates[1]],
        zoom: zoomTo,
      });
    },
    [map]
  );

  if (geojson === undefined || geojson.features === undefined) {
    return null;
  }

  return (
    <>
      {geojson.features.map((feature, index) => {
        if (feature.geometry === undefined) {
          return null;
        }
        if (
          feature.geometry.type !== 'Polygon' &&
          feature.geometry.type !== 'MultiPolygon' &&
          feature.geometry.type !== 'LineString' &&
          feature.geometry.type !== 'Point'
        ) {
          return null;
        }

        let zIndex = 100;
        let title = 'No name';

        if (feature.properties && feature.properties.name && feature.properties.name.length > 0) {
          title = feature.properties.name;
        }

        // United Nations
        if (
          (feature.properties &&
            feature.properties.operator &&
            (feature.properties.operator.includes('UN') ||
              feature.properties.operator.includes('United Nations'))) ||
          (feature.properties &&
            feature.properties.name &&
            (feature.properties.name.includes('UN') || feature.properties.name.includes('United Nations')))
        ) {
          zIndex = 110;
        }

        let center: Feature<Point, GeoJsonProperties> | undefined = undefined;
        switch (feature.geometry.type) {
          case 'Polygon':
            const polygonFeatures = turf.polygon(feature.geometry.coordinates);
            center = turf.centroid(polygonFeatures);
            break;
          case 'MultiPolygon':
            const multiPolygonFeatures = turf.multiPolygon(feature.geometry.coordinates);
            center = turf.centroid(multiPolygonFeatures);
            break;
          case 'LineString':
            const bbox = turf.bbox(feature);
            const polygon = turf.bboxPolygon(bbox);
            center = turf.centroid(polygon);
            break;
          case 'Point':
            center = turf.point(feature.geometry.coordinates);
          default:
            break;
        }
        if (center === undefined) {
          return null;
        }

        return (
          <Fragment key={`${feature.id}-${index}`}>
            {feature.geometry.type === 'LineString' && (
              <Source type="geojson" data={feature}>
                {
                  <Layer
                    {...{
                      id: `${feature.id}-line`,
                      type: 'line',
                      paint: {
                        'line-width': 4,
                        'line-color': style?.color ? style.color : '#f2f8fc',
                        'line-opacity': 0.8,
                      },
                    }}
                  />
                }
              </Source>
            )}
            {(feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') && (
              <Source type="geojson" data={feature}>
                {
                  <Layer
                    {...{
                      id: `${feature.id}-line`,
                      type: 'line',
                      paint: {
                        'line-width': 4,
                        'line-color': style?.color ? style.color : '#f2f8fc',
                        'line-opacity': 0.8,
                      },
                    }}
                  />
                }
                {
                  <Layer
                    {...{
                      id: `${feature.id}-fill`,
                      type: 'fill',
                      paint: {
                        'fill-color': style?.fillColor
                          ? style.fillColor
                          : style?.color
                            ? style.color
                            : '#00b8ff',
                        'fill-opacity': 0.2,
                      },
                    }}
                  />
                }
              </Source>
            )}
            <Marker
              key={feature.id}
              longitude={center.geometry.coordinates[0]}
              latitude={center.geometry.coordinates[1]}
              onClick={() => onClickMarker(center)}
              style={{ zIndex: zIndex }}
            >
              <div
                title={title}
                className="relative z-50 flex h-7 w-7 -rotate-[135deg] cursor-pointer items-center justify-center overflow-hidden rounded-bl-3xl rounded-br-3xl rounded-tr-3xl border-2 border-zinc-900 text-center text-base"
                style={{
                  backgroundColor: style?.fillColor ? style.fillColor : 'rgba(255, 255, 255, 0.7)',
                }}
              >
                <div className="relative z-50 rotate-[135deg] text-center text-base">
                  <span
                    className="z-50 text-center text-base"
                    style={{
                      color: style?.color ? style.color : 'rgba(0, 0, 0, 0.8)',
                    }}
                  >
                    {index + 1}
                  </span>
                </div>
              </div>
              {}
            </Marker>
          </Fragment>
        );
      })}
    </>
  );
};
