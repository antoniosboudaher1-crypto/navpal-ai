import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Coordinates, Place, MapReport, NavigationRoute, MapMode, MapStyle } from '../../types';

interface MapWrapperProps {
    center: Coordinates;
    places: Place[];
    reports: MapReport[];
    selectedPlace: Place | null;
    route: NavigationRoute | null;
    previewRoute: NavigationRoute | null;
    mapMode: MapMode;
    mapStyle: MapStyle;
    showTraffic: boolean;
    onSelectPlace: (place: Place) => void;
    recenterTrigger: number;
}

const MapWrapper: React.FC<MapWrapperProps> = ({
    center,
    places,
    reports,
    selectedPlace,
    route,
    previewRoute,
    mapMode,
    mapStyle,
    showTraffic,
    onSelectPlace,
    recenterTrigger
}) => {
    const mapRef = useRef<MapView>(null);

    // Recenter map when trigger changes
    useEffect(() => {
        if (mapRef.current && recenterTrigger > 0) {
            mapRef.current.animateToRegion({
                latitude: center.lat,
                longitude: center.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 500);
        }
    }, [recenterTrigger, center]);

    // Auto-center on location changes
    useEffect(() => {
        if (mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: center.lat,
                longitude: center.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 500);
        }
    }, [center.lat, center.lng]);

    // Convert route geometry to coordinates for Polyline
    const getRouteCoordinates = (routeGeometry: any) => {
        if (!routeGeometry || !routeGeometry.coordinates) return [];
        return routeGeometry.coordinates.map((coord: [number, number]) => ({
            latitude: coord[1],
            longitude: coord[0],
        }));
    };

    const routeCoordinates = route ? getRouteCoordinates(route.geometry) : [];
    const previewRouteCoordinates = previewRoute ? getRouteCoordinates(previewRoute.geometry) : [];

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                    latitude: center.lat,
                    longitude: center.lng,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
                showsUserLocation={true}
                showsMyLocationButton={false}
                showsTraffic={showTraffic}
                mapType={mapStyle === MapStyle.SATELLITE ? 'satellite' : 'standard'}
            >
                {/* User Location Marker */}
                <Marker
                    coordinate={{ latitude: center.lat, longitude: center.lng }}
                    title="You are here"
                    pinColor="blue"
                />

                {/* Place Markers */}
                {places.map((place) => (
                    <Marker
                        key={place.id}
                        coordinate={{ latitude: place.coordinates.lat, longitude: place.coordinates.lng }}
                        title={place.name}
                        description={place.address}
                        pinColor={selectedPlace?.id === place.id ? 'red' : 'orange'}
                        onPress={() => onSelectPlace(place)}
                    />
                ))}

                {/* Report Markers */}
                {reports.map((report) => (
                    <Marker
                        key={report.id}
                        coordinate={{ latitude: report.coordinates.lat, longitude: report.coordinates.lng }}
                        title={report.type}
                        pinColor={
                            report.type === 'ACCIDENT' ? 'red' :
                                report.type === 'HAZARD' ? 'orange' :
                                    report.type === 'POLICE' ? 'blue' :
                                        report.type === 'TRAFFIC' ? 'yellow' :
                                            'purple'
                        }
                    />
                ))}

                {/* Active Navigation Route */}
                {route && routeCoordinates.length > 0 && (
                    <Polyline
                        coordinates={routeCoordinates}
                        strokeColor="#a855f7"
                        strokeWidth={5}
                    />
                )}

                {/* Preview Route */}
                {previewRoute && previewRouteCoordinates.length > 0 && (
                    <Polyline
                        coordinates={previewRouteCoordinates}
                        strokeColor="#60a5fa"
                        strokeWidth={4}
                        lineDashPattern={[10, 5]}
                    />
                )}
            </MapView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    map: {
        flex: 1,
    },
});

export default MapWrapper;

