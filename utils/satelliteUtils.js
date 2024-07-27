const mbxStatic = require("@mapbox/mapbox-sdk/services/static");
const fetch = require("node-fetch");
const fs = require("fs-extra");
const path = require("path");

const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

const generateMapImage = async (polygonCoordinates, projectName) => {
  const center = calculateCenter(polygonCoordinates);
  const zoom = 17;
  const width = 800;
  const height = 600;

  const geojson = encodeURIComponent(
    JSON.stringify({
      type: "Feature",
      properties: {
        stroke: "#FF0000",
        "stroke-width": 2,
        "stroke-opacity": 1,
        fill: "#FF0000",
        "fill-opacity": 0.3,
      },
      geometry: {
        type: "Polygon",
        coordinates: [polygonCoordinates],
      },
    })
  );

  const url = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/geojson(${geojson})/${center[0]},${center[1]},${zoom}/${width}x${height}?access_token=${MAPBOX_ACCESS_TOKEN}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`
      );
    }
    const buffer = await response.buffer();

    const assetsDir = path.join(__dirname, "assets");
    await fs.ensureDir(assetsDir);

    const filePath = path.join(assetsDir, `${projectName}_map_image.png`);

    await fs.writeFile(filePath, buffer);

    console.log(`Map image saved to: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error("Error generating map image:", error);
    throw error;
  }
};

const CLIENT_ID = process.env.SENTINEL_CLIENT_ID;
const CLIENT_SECRET = process.env.SENTINEL_CLIENT_SECRET;

const getAccessToken = async () => {
  const response = await fetch(
    "https://services.sentinel-hub.com/oauth/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`,
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
};

const generateSatelliteImage = async (polygonCoordinates) => {
  const accessToken = await getAccessToken();

  const bbox = calculateBoundingBox(polygonCoordinates);
  const [minLon, minLat, maxLon, maxLat] = bbox;

  // Calculate dates for the last 6 months
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setMonth(endDate.getMonth() - 6);

  // Format dates as ISO-8601 strings with time and timezone
  const formatDate = (date) => date.toISOString().split(".")[0] + "Z";

  const evalscript = `
      //VERSION=3
      function setup() {
        return {
          input: ["B04", "B03", "B02"],
          output: { bands: 3 }
        };
      }
  
      function evaluatePixel(sample) {
        return [sample.B04 * 2.5, sample.B03 * 2.5, sample.B02 * 2.5];
      }
    `;

  const body = {
    input: {
      bounds: {
        bbox: [minLon, minLat, maxLon, maxLat],
        properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" },
      },
      data: [
        {
          type: "sentinel-2-l2a",
          dataFilter: {
            timeRange: {
              from: formatDate(startDate),
              to: formatDate(endDate),
            },
            maxCloudCoverage: 20,
          },
        },
      ],
    },
    output: {
      width: 512,
      height: 512,
      responses: [{ identifier: "default", format: { type: "image/png" } }],
    },
    evalscript: evalscript,
  };

  try {
    const response = await fetch(
      "https://services.sentinel-hub.com/api/v1/process",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers.raw());

    const buffer = await response.buffer();

    if (!response.ok) {
      // If the response is not OK, convert the buffer to text for error logging
      const errorText = buffer.toString("utf8");
      console.error("Error response body:", errorText);
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`
      );
    }

    // Check if the buffer is empty or very small (which might indicate no image data)
    if (buffer.length < 100) {
      console.warn("Warning: Received very small or empty image data");
      return null;
    }

    const assetsDir = path.join(__dirname, "assets");
    await fs.ensureDir(assetsDir);

    const filePath = path.join(assetsDir, "satellite_image.png");
    await fs.writeFile(filePath, buffer);

    console.log(`Satellite image saved to: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error("Error generating satellite image:", error);
    throw error;
  }
};

const calculateBoundingBox = (coordinates) => {
  const lons = coordinates.map((coord) => coord[0]);
  const lats = coordinates.map((coord) => coord[1]);
  const minLon = Math.min(...lons);
  const minLat = Math.min(...lats);
  const maxLon = Math.max(...lons);
  const maxLat = Math.max(...lats);

  // Increase the buffer to include more surrounding area
  const buffer = 0.005; // Approximately 500 meters
  return [minLon - buffer, minLat - buffer, maxLon + buffer, maxLat + buffer];
};

const calculateCenter = (coordinates) => {
  const lats = coordinates.map((coord) => coord[1]);
  const lons = coordinates.map((coord) => coord[0]);
  const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const centerLon = (Math.min(...lons) + Math.max(...lons)) / 2;
  return [centerLon, centerLat];
};

module.exports = generateSatelliteImage;
