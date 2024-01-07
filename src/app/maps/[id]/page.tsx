'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { Map, GeolocateControl, NavigationControl, LngLatBounds } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

import { getOverpassResponseJsonWithCache } from '@/utils/getOverpassResponse';
import { useEffect, useState } from 'react';
import osmtogeojson from 'osmtogeojson';
import { Md5 } from 'ts-md5';
import { FeatureCollection } from 'geojson';
import { GeoJsonToSomethings } from '@/components/GeoJsonToSomethings';
import { FaHospital, FaSchool } from 'react-icons/fa';

// @ts-ignore
import * as turf from '@turf/turf';

const hospitalsQuery = `
[out:json][timeout:30000];
rel(4800240);
map_to_area->.a;
(
  nwr["amenity"="hospital"](area.a);
);
out geom;
`;

// Style for hospitals

const hospitalsStyle = {
  color: 'rgb(0, 0, 0)',
  fillColor: 'rgb(255, 0, 0)',
  emoji: '🏥',
};

// Style for schools

const schoolsStyle = {
  color: 'rgb(0, 0, 0)',
  fillColor: 'rgb(0, 255, 0)',
  emoji: '🏫',
};

const schoolsQuery = `
[out:json][timeout:30000];
rel(4800240);
map_to_area->.a;
(
  nwr["amenity"="school"](area.a);
);
out geom;
`;

const overpassQueryWithStyleList = [
  {
    query: hospitalsQuery,
    style: hospitalsStyle,
  },
  {
    query: schoolsQuery,
    style: schoolsStyle,
  },
];

type GeoJsonWithStyle = {
  id: string;
  style: {
    color?: string;
    fillColor?: string;
    emoji?: string;
  };
  geojson: FeatureCollection;
};

const Page = () => {
  const searchParams = useSearchParams();
  const { id } = useParams();
  const searchParamsString = searchParams.toString();
  const printMode = searchParamsString === 'print=true';

  const [loaded, setLoaded] = useState(false);
  const [currentBounds, setCurrentBounds] = useState<LngLatBounds>();

  const [geoJsonWithStyleList, setGeoJsonWithStyleList] = useState<Array<GeoJsonWithStyle>>([]);

  const [geoJsonWithStyleListInMapBounds, setGeoJsonWithStyleListInMapBounds] = useState<
    Array<GeoJsonWithStyle>
  >([]);

  useEffect(() => {
    const thisEffect = async () => {
      setLoaded(true);
      for (const overpassQueryWithStyle of overpassQueryWithStyleList) {
        const overpassResJson = await getOverpassResponseJsonWithCache(overpassQueryWithStyle.query);
        const newGeojson = osmtogeojson(overpassResJson);
        const md5 = new Md5();
        md5.appendStr(overpassQueryWithStyle.query);
        const hash = md5.end();
        setGeoJsonWithStyleList((prev) => {
          if (prev.find((item) => item.id === hash)) return prev;
          return [
            ...prev,
            {
              id: hash as string,
              style: overpassQueryWithStyle.style || {},
              geojson: newGeojson,
            },
          ];
        });
      }
    };
    if (!loaded) {
      setLoaded(true);
      thisEffect();
    }
  }, [loaded]);

  useEffect(() => {
    if (!geoJsonWithStyleList) return;
    if (!currentBounds) return;
    setGeoJsonWithStyleListInMapBounds(
      geoJsonWithStyleList.map((geoJsonWithStyle) => {
        // currentBounds is a LngLatBounds object
        // bbox extent in minX, minY, maxX, maxY order
        // convert currentBounds to bbox array
        const currentMapBbox = [
          currentBounds.getWest(),
          currentBounds.getSouth(),
          currentBounds.getEast(),
          currentBounds.getNorth(),
        ];
        const geojsonInMapBounds = geoJsonWithStyle.geojson.features.filter((feature) => {
          // use turf.js to check if feature is in map bounds
          const poly = turf.bboxPolygon(currentMapBbox);
          const isInside = turf.booleanContains(poly, feature);
          return isInside;
        });
        return {
          ...geoJsonWithStyle,
          geojson: {
            type: 'FeatureCollection',
            features: geojsonInMapBounds,
          },
        };
      })
    );
  }, [geoJsonWithStyleList, currentBounds]);

  return (
    <div className="flex h-screen w-screen flex-col sm:flex-row-reverse">
      {process.env.NODE_ENV === 'development' && (
        <h1 className="absolute left-2.5 top-2.5 z-50 rounded-md bg-black bg-opacity-75 p-1.5 text-xs text-white">
          Maps Number: {id}
        </h1>
      )}
      <div className="relative h-3/5 flex-1 overflow-hidden sm:h-screen print:h-full">
        <Map
          initialViewState={{
            longitude: 137.1083671,
            latitude: 37.3294213,
            zoom: 9,
          }}
          hash={true}
          style={{ width: '100%', height: '100%' }}
          mapStyle="https://tile.openstreetmap.jp/styles/maptiler-basic-ja/style.json"
          attributionControl={false}
          onLoad={(e) => {
            setCurrentBounds(e.target.getBounds());
          }}
          onMove={(e) => {
            setCurrentBounds(e.target.getBounds());
          }}
        >
          {printMode !== true && (
            <>
              <GeolocateControl position="top-right" />
              <NavigationControl
                position="top-right"
                visualizePitch={true}
                showZoom={true}
                showCompass={true}
              />
            </>
          )}
          {geoJsonWithStyleListInMapBounds &&
            geoJsonWithStyleListInMapBounds.map((geoJsonWithStyle) => {
              return (
                <GeoJsonToSomethings
                  key={geoJsonWithStyle.id}
                  geojson={geoJsonWithStyle.geojson}
                  style={geoJsonWithStyle.style}
                />
              );
            })}
        </Map>
        <div className="absolute bottom-1 right-1 z-20 text-sm font-normal">
          <p>© OpenMapTiles © OpenStreetMap contributors</p>
        </div>
      </div>
      <div className="relative flex h-2/5 max-w-full flex-col overflow-hidden sm:h-full sm:w-4/12 sm:max-w-sm">
        {/* <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-zinc-100"></div> 
        あとで実装できたら実装 - メニューバーを画面上部まで引き伸ばす　*/}
        <div className="mt-4 sm:mt-8"></div>
        <ul className="mx-auto block w-[90%] list-none space-y-4 overflow-scroll py-4">
          {geoJsonWithStyleListInMapBounds &&
            geoJsonWithStyleListInMapBounds.map((geoJsonWithStyle, geoIndex) => {
              const emoji = geoJsonWithStyle.style?.emoji;
              return geoJsonWithStyle.geojson.features.map((feature, index) => {
                const name = feature.properties?.name;
                const address: string =
                  feature.properties?.['KSJ2:AdminArea'] + ' ' + feature.properties?.['KSJ2:ADS'];
                if (!name) return null;

                return (
                  <div key={name} className="flex w-full flex-col truncate">
                    {/* 都度追加してください */}
                    {emoji === '🏥' && index === 0 && geoIndex === 0 && (
                      <span className="mb-2 truncate pl-0.5">病院</span>
                    )}

                    {emoji === '🏫' && index === 0 && geoIndex === 1 && (
                      <span className="mb-2 truncate pl-0.5">学校</span>
                    )}
                    <li
                      className={
                        index !== geoJsonWithStyle.geojson.features.length - 1
                          ? 'w-full border-b border-gray-200 pb-4'
                          : emoji === '🏥'
                            ? 'pb-8'
                            : 'pb-4'
                      }
                    >
                      <div className="flex w-full flex-row items-center">
                        <span className="flex h-10 max-h-10 min-h-10 w-10 min-w-10 max-w-10 items-center justify-center rounded-full bg-zinc-500">
                          {emoji === '🏥' && <FaHospital className="h-5 w-5 fill-zinc-50 pb-0.5" />}
                          {emoji === '🏫' && <FaSchool className="h-5 w-5 fill-zinc-50 pb-1" />}
                        </span>
                        <div className="flex flex-col truncate pl-4">
                          <span className="font-medium text-zinc-900">{`${index + 1}. ${name}`}</span>
                          <div className="truncate">
                            {typeof address !== 'undefined' && address !== 'undefined undefined' && (
                              <span className="truncate pt-0.5 text-sm font-normal text-zinc-400">
                                {address ? address : '表示できません'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  </div>
                );
              });
            })}
        </ul>
      </div>
    </div>
  );
};

export default Page;
