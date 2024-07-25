const fs = require('fs');
const path = require('path');
const axios = require('axios');
const turf = require('@turf/turf');

// Function to fetch and save satellite image based on polygon coordinates
const fetchAndSaveSatelliteImage = async (polygonCoordinates, projectName) => {
    try {
        // Convert polygon coordinates to a bounding box
        const polygon = turf.polygon([polygonCoordinates]);
        const bbox = turf.bbox(polygon);

        const [minLng, minLat, maxLng, maxLat] = bbox;
        const zoom = 15; // Adjust zoom level as needed

        const imageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${(minLat+maxLat)/2},${(minLng+maxLng)/2}&zoom=${zoom}&size=640x640&maptype=satellite&key=YOUR_GOOGLE_MAPS_API_KEY&path=fillcolor:0xAA000033|weight:2|${polygonCoordinates.map(coord => coord.reverse().join(',')).join('|')}`;

        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imagePath = path.join(__dirname, '..', 'assets', `${projectName}.png`);
        
        fs.writeFileSync(imagePath, response.data);
        return imagePath;
    } catch (error) {
        console.error('Error fetching satellite image:', error);
        throw new Error('Failed to fetch satellite image');
    }
};

module.exports = fetchAndSaveSatelliteImage;
