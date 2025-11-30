import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import MapView from './MapView'; // Import the existing full-featured map
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

const MapWrapper: React.FC<MapWrapperProps> = (props) => {
    if (Platform.OS === 'web') {
        return (
            <View style={{ flex: 1, width: '100%', height: '100%' }}>
                <MapView {...props} />
            </View>
        );
    }

    // Native Placeholder
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Native Map Not Implemented Yet</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1e293b',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: 'white',
        fontSize: 18,
    }
});

export default MapWrapper;
