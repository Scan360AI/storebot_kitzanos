// Google Maps API Type Declarations
declare global {
  interface Window {
    google: typeof google;
  }
}

declare namespace google {
  namespace maps {
    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }

    class Geocoder {
      geocode(
        request: { address: string },
        callback: (
          results: Array<{
            geometry: {
              location: {
                lat(): number;
                lng(): number;
              };
            };
          }> | null,
          status: string
        ) => void
      ): void;
    }

    namespace places {
      class PlacesService {
        constructor(element: HTMLElement);
        nearbySearch(
          request: {
            location: LatLng;
            radius: number;
            type?: string;
          },
          callback: (
            results: Array<{
              name?: string;
              types?: string[];
              geometry?: {
                location?: {
                  lat(): number;
                  lng(): number;
                };
              };
              vicinity?: string;
              rating?: number;
              user_ratings_total?: number;
            }> | null,
            status: PlacesServiceStatus
          ) => void
        ): void;
      }

      enum PlacesServiceStatus {
        OK = 'OK',
        ZERO_RESULTS = 'ZERO_RESULTS',
        ERROR = 'ERROR'
      }
    }
  }
}

export {};
