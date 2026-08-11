const sources = {
    arcgisExplorerRetirement: {
        label: 'Esri: ArcGIS Explorer retirement',
        href: 'https://www.esri.com/arcgis-blog/products/explorer/field-mobility/arcgis-explorer-on-windows-platform-is-retired'
    },
    arcgisFieldMaps: {
        label: 'Esri: ArcGIS Field Maps',
        href: 'https://www.esri.com/en-us/arcgis/products/arcgis-field-maps/overview'
    },
    cesium: {
        label: 'Cesium: 3D geospatial platform',
        href: 'https://cesium.com/platform/'
    },
    cesium3dTiles: {
        label: 'Cesium: 3D Tiles standard',
        href: 'https://cesium.com/why-cesium/3d-tiles'
    },
    creativeCommonsData: {
        label: 'Creative Commons: open data licensing',
        href: 'https://creativecommons.org/?p=choose'
    },
    dataEuropa: {
        label: 'European Data Portal',
        href: 'https://data.europa.eu/'
    },
    dataEuropaGeo: {
        label: 'European Data Portal: geospatial datasets',
        href: 'https://data.europa.eu/en/publications/datastories/opportunities-sharing-cross-border-geospatial-datasets'
    },
    esriGIScience: {
        label: 'Esri: Geographic information science',
        href: 'https://www.esri.com/en-us/about/science/initiatives/geographic-information-science'
    },
    esriSpatialAnalysis: {
        label: 'Esri: spatial analysis and data science',
        href: 'https://www.esri.com/en-us/industries/official-statistics/phases/data-science'
    },
    faoGeospatial: {
        label: 'FAO: geospatial information for sustainable food systems',
        href: 'https://www.fao.org/geospatial/en/'
    },
    femaGIS: {
        label: 'FEMA Geospatial Resource Center',
        href: 'https://gis-fema.hub.arcgis.com/'
    },
    foss4g: {
        label: 'OSGeo: FOSS4G',
        href: 'https://wiki.osgeo.org/wiki/FOSS4G'
    },
    gdal: {
        label: 'GDAL: raster and vector data toolkit',
        href: 'https://gdal.org/en/stable/about.html'
    },
    gisci: {
        label: 'GIS Certification Institute',
        href: 'https://www.gisci.org/'
    },
    googleEarth: {
        label: 'Google Earth',
        href: 'https://earth.google.com/web/'
    },
    googleMaps: {
        label: 'Google Maps Platform documentation',
        href: 'https://developers.google.com/maps/documentation'
    },
    isoQuality: {
        label: 'ISO 19157-1:2023 geographic data quality',
        href: 'https://www.iso.org/standard/78900.html'
    },
    mapillary: {
        label: 'Mapillary web app',
        href: 'https://www.mapillary.com/app/'
    },
    mapillaryData: {
        label: 'Mapillary: download detected map data',
        href: 'https://help.mapillary.com/hc/en-us/articles/4407521157138-Downloading-map-data-via-the-Mapillary-web-app'
    },
    nga: {
        label: 'National Geospatial-Intelligence Agency',
        href: 'https://www.nga.mil/'
    },
    noaaGIS: {
        label: 'NOAA: maps and geospatial products',
        href: 'https://www.ncei.noaa.gov/maps-and-geospatial-products'
    },
    nrelGIS: {
        label: 'NREL: geospatial data and tools',
        href: 'https://www.nrel.gov/gis/'
    },
    ogcStandards: {
        label: 'OGC geospatial standards',
        href: 'https://www.ogc.org/standards/'
    },
    ogcSensorThings: {
        label: 'OGC SensorThings API',
        href: 'https://www.ogc.org/standards/sensorthings/'
    },
    openStreetMap: {
        label: 'OpenStreetMap: about the project',
        href: 'https://www.openstreetmap.org/about'
    },
    postgis: {
        label: 'PostGIS spatial database',
        href: 'https://postgis.net/'
    },
    proj: {
        label: 'PROJ coordinate transformation toolkit',
        href: 'https://proj.org/en/stable/'
    },
    qfield: {
        label: 'QField: mobile field GIS for QGIS',
        href: 'https://qfield.org/'
    },
    qgis: {
        label: 'QGIS',
        href: 'https://qgis.org/'
    },
    qgisDocs: {
        label: 'QGIS documentation',
        href: 'https://docs.qgis.org/latest/en/docs/'
    },
    usCensusMaps: {
        label: 'U.S. Census Bureau mapping files',
        href: 'https://www.census.gov/geographies/mapping-files.html'
    },
    ucgis: {
        label: 'UCGIS GIS&T Body of Knowledge',
        href: 'https://gistbok-ltb.ucgis.org/'
    },
    usgsGeology: {
        label: 'USGS: geologic mapping',
        href: 'https://www.usgs.gov/mission-areas/geology-energy-minerals/science/geologic-mapping-and-foundational-science'
    },
    usgsGeospatial: {
        label: 'USGS: geospatial data and tools',
        href: 'https://www.usgs.gov/geospatial-data'
    },
    usgsLidar: {
        label: 'USGS: 3D Elevation Program and lidar',
        href: 'https://www.usgs.gov/3d-elevation-program'
    }
};

function leaf(label, summary, sourceKeys, status = '') {
    return {
        label,
        summary,
        status,
        sources: sourceKeys.map((key) => sources[key])
    };
}

function branch(label, children) {
    return { label, children };
}

const rawBranches = [
    {
        label: 'Definition',
        side: 'left',
        color: '#6f95e8',
        children: [
            branch('A Science', [
                leaf('Spatial Theories', 'The concepts used to explain location, distance, direction, scale, regions, spatial interaction, and how phenomena vary across space.', ['ucgis', 'esriGIScience']),
                leaf('Patterns & Relationships', 'Spatial pattern analysis asks where features cluster, disperse, overlap, or influence one another—and whether those arrangements are meaningful.', ['esriSpatialAnalysis']),
                branch('Allied Fields', [
                    leaf('Statistics', 'Spatial statistics adapts statistical reasoning to observations whose location and neighborhood relationships affect the result.', ['esriSpatialAnalysis']),
                    leaf('Surveying', 'Surveying establishes measured positions, boundaries, and control points that anchor GIS data to the real world.', ['usgsGeospatial', 'proj']),
                    leaf('Geography', 'Geography studies places, environments, and human–environment relationships; GIS provides a digital framework for examining them.', ['ucgis']),
                    leaf('Geodesy', 'Geodesy measures Earth’s shape, orientation, gravity field, and reference systems so coordinates remain precise and comparable.', ['proj']),
                    leaf('Remote Sensing', 'Remote sensing derives information about Earth from satellite, aircraft, or other sensors without direct contact with the target.', ['usgsGeospatial']),
                    leaf('Computer Science', 'Computer science supplies the algorithms, databases, interfaces, distributed systems, and automation that make modern GIS possible.', ['ucgis', 'postgis'])
                ])
            ]),
            branch('A Technological Tool', [
                branch('Data Capture', [
                    leaf('Sensors', 'Sensors measure environmental or positional observations that become georeferenced features, rasters, point clouds, or time series.', ['ogcSensorThings']),
                    leaf('Geocoding', 'Geocoding converts place descriptions such as street addresses into coordinates; reverse geocoding performs the opposite conversion.', ['googleMaps']),
                    leaf('Digitizing', 'Digitizing creates vector features by tracing, constructing, or editing points, lines, and polygons from imagery, maps, or field observations.', ['qgisDocs', 'qfield'])
                ]),
                leaf('Algorithms', 'GIS algorithms implement operations such as overlay, buffering, routing, interpolation, classification, and terrain analysis.', ['qgisDocs', 'esriSpatialAnalysis']),
                branch('Data Visualization', [
                    leaf('2D', 'Two-dimensional GIS maps encode geographic features on a flat display using position, color, symbol, size, and labels.', ['qgis']),
                    leaf('3D', 'Three-dimensional GIS adds elevation, buildings, terrain, point clouds, and camera perspective to spatial exploration.', ['cesium']),
                    leaf('3D + Time', 'Spatiotemporal 3D visualization shows how places and objects change or move through time, supporting simulation and historical analysis.', ['cesium3dTiles'])
                ]),
                leaf('Data Storage', 'GIS storage preserves geometries, rasters, attributes, indexes, coordinate reference systems, and metadata in files or databases.', ['postgis', 'gdal']),
                leaf('Data Management', 'Data management covers importing, editing, validating, versioning, cataloging, securing, and maintaining spatial datasets throughout their lifecycle.', ['postgis', 'qgisDocs']),
                leaf('Spatial Analysis', 'Spatial analysis transforms location-aware data into evidence about proximity, connectivity, distribution, suitability, and change.', ['esriSpatialAnalysis', 'qgisDocs']),
                leaf('Decision Support System', 'A GIS decision-support system combines data, models, maps, and scenarios so people can compare options with explicit geographic context.', ['qgis', 'esriSpatialAnalysis'])
            ])
        ]
    },
    {
        label: 'Components',
        side: 'left',
        color: '#ee8c62',
        children: [
            leaf('Data', 'Spatial geometries, imagery, elevation, observations, and their descriptive attributes form the evidence base of a GIS.', ['usgsGeospatial', 'gdal']),
            leaf('Hardware', 'Workstations, servers, storage, GNSS receivers, scanners, sensors, mobile devices, and networks provide GIS compute and capture capacity.', ['qfield', 'ogcSensorThings']),
            leaf('Software', 'Desktop, server, database, mobile, and web software provides the tools to capture, manage, analyze, and publish geographic information.', ['qgis', 'postgis']),
            leaf('People', 'Analysts, data stewards, developers, field staff, subject-matter experts, decision-makers, and community contributors turn technology into useful outcomes.', ['gisci', 'ucgis']),
            leaf('Procedures', 'Documented workflows, quality controls, governance, metadata, backup, and review practices make GIS work repeatable and trustworthy.', ['isoQuality', 'ogcStandards']),
            leaf('Network', 'Networks connect field devices, services, databases, cloud infrastructure, and clients so spatial data can be shared and updated.', ['ogcStandards', 'ogcSensorThings'])
        ]
    },
    {
        label: 'Issues',
        side: 'left',
        color: '#e7cc43',
        children: [
            branch('Data Handling', [
                leaf('Efficiency', 'Efficient GIS minimizes unnecessary data movement and computation through spatial indexes, tiling, caching, generalization, and fit-for-purpose processing.', ['postgis', 'gdal']),
                leaf('Spatial and Non-Spatial', 'A GIS must preserve the relationship between geometry and descriptive attributes while supporting joins to ordinary tabular data.', ['postgis']),
                leaf('Security', 'Geospatial systems need access control, secure services, protected credentials, auditability, and careful treatment of sensitive locations.', ['postgis', 'ogcStandards'])
            ]),
            branch('Data Volume', [
                leaf('Compression', 'Compression reduces storage and transfer costs for imagery, point clouds, tiles, and vectors, with lossless or lossy methods chosen by use case.', ['gdal', 'cesium3dTiles']),
                leaf('Storage', 'Large spatial archives require scalable object storage, databases, indexing, metadata, retention, and backup strategies.', ['postgis', 'cesium']),
                leaf('Processing', 'High-volume GIS processing uses parallelism, chunking, cloud resources, and level-of-detail techniques to keep analysis responsive.', ['gdal', 'cesium'])
            ]),
            branch('Data Sharing Policies', [
                leaf('Confidentiality', 'Location can reveal sensitive facilities, habitats, assets, or people, so sharing rules may require aggregation, masking, or restricted access.', ['ogcStandards']),
                leaf('Privacy', 'Precise location traces can identify routines and individuals; collect only what is needed and define consent, retention, and access clearly.', ['googleMaps']),
                leaf('Open Data', 'Open geospatial data can improve transparency and reuse when it is discoverable, documented, interoperable, and openly licensed.', ['dataEuropaGeo', 'creativeCommonsData']),
                leaf('Intellectual Property', 'Maps and datasets may carry copyright, database rights, contractual terms, attribution duties, or share-alike requirements.', ['creativeCommonsData', 'openStreetMap'])
            ]),
            branch('Data Quality', [
                leaf('Accuracy', 'Accuracy describes how closely positions, attributes, and classifications represent their accepted real-world values.', ['isoQuality']),
                leaf('Completeness', 'Completeness identifies missing or excess features, attributes, coverage, or time periods relative to a dataset specification.', ['isoQuality']),
                leaf('Timeliness', 'Timeliness measures whether data is current enough for its intended decision, especially where conditions change quickly.', ['isoQuality'])
            ]),
            branch('Standards', [
                leaf('Data Formats', 'Interoperable formats and encodings—such as GeoPackage, GeoJSON, GeoTIFF, and 3D Tiles—allow data to move between tools.', ['ogcStandards', 'gdal']),
                leaf('Terminologies', 'Shared vocabularies and identifiers reduce ambiguity when different organizations publish, discover, and combine geospatial resources.', ['ogcStandards']),
                leaf('Professional Certifications', 'Professional certification can validate applied GIS knowledge, experience, ethics, and ongoing development.', ['gisci']),
                leaf('GIS Education', 'GIS education combines conceptual foundations, data models, analytical methods, cartography, computation, ethics, and practical workflows.', ['ucgis'])
            ])
        ]
    },
    {
        label: 'Trends',
        side: 'right',
        color: '#88c94f',
        children: [
            branch('Real-time Applications', [
                leaf('Cloud Computing', 'Cloud GIS scales storage, processing, hosting, and streaming so large or frequently updated geospatial content can serve many clients.', ['cesium', 'postgis']),
                leaf('Ubiquitous Computing', 'Ubiquitous GIS embeds location-aware services into everyday devices and workflows, making spatial context available wherever decisions happen.', ['googleMaps', 'qfield']),
                leaf('Sensor Network', 'Connected sensors publish observations about places and phenomena continuously, often through interoperable APIs and event streams.', ['ogcSensorThings'])
            ]),
            leaf('FOSS4G', 'Free and Open Source Software for Geospatial is both an ecosystem of tools and the global OSGeo community event that brings those projects together.', ['foss4g', 'qgis']),
            branch('Data Capture', [
                leaf('LiDAR', 'LiDAR measures the return time of laser pulses to build dense 3D point clouds used for elevation, vegetation, buildings, and infrastructure.', ['usgsLidar']),
                leaf('UAVs', 'Uncrewed aerial vehicles capture high-resolution imagery and sensor data that can be processed into orthomosaics, elevation models, and 3D reconstructions.', ['usgsGeospatial', 'qgisDocs']),
                leaf('Real-time GPS', 'Real-time positioning streams GNSS locations into navigation, tracking, surveying, field collection, and operational dashboards.', ['qfield', 'googleMaps']),
                leaf('Mobile Devices', 'Phones and tablets combine GNSS, cameras, connectivity, and offline storage for field mapping and data collection.', ['qfield'])
            ]),
            branch('Crowd-sourced Data', [
                leaf('OpenStreetMap', 'OpenStreetMap is a community-built, editable world map whose data can be reused under its open-data licence with attribution.', ['openStreetMap']),
                leaf('Google Maps', 'Google Maps Platform provides maps, routes, places, geocoding, geolocation, environmental data, and SDKs for web and mobile apps.', ['googleMaps']),
                leaf('Mapillary', 'Mapillary collects street-level imagery and uses computer vision to detect map features that can support mapping and local change detection.', ['mapillary', 'mapillaryData'])
            ]),
            branch('Mobile and Web GIS', [
                leaf('Geoportals', 'Geoportals provide a searchable entry point to datasets, services, metadata, previews, and downloads across organizations.', ['dataEuropa'], 'The former INSPIRE Geoportal was retired on 1 July 2026; INSPIRE datasets now surface through the European Data Portal.'),
                branch('Geospatial Clients', [
                    leaf('Google Earth', 'Google Earth is an interactive 3D globe for exploring imagery, terrain, places, and user-created geospatial content.', ['googleEarth']),
                    leaf('ArcGIS Explorer', 'ArcGIS Explorer was a lightweight Esri map-viewing client. It is now retired, and Esri directs mobile users to ArcGIS Field Maps.', ['arcgisExplorerRetirement', 'arcgisFieldMaps'], 'Retired product — use ArcGIS Field Maps for supported mobile map viewing and field workflows.')
                ]),
                leaf('Location-based Services', 'Location-based services adapt content or actions to a user, asset, or event location—for example nearby search, geofencing, routing, and tracking.', ['googleMaps', 'qfield'])
            ])
        ]
    },
    {
        label: 'Applications',
        side: 'right',
        color: '#54c7bd',
        children: [
            branch('Disaster', [
                leaf('Hazard Mapping & Modelling', 'GIS combines hazard probability, exposure, vulnerability, terrain, infrastructure, and scenarios to map where impacts may occur.', ['femaGIS', 'usgsGeospatial']),
                leaf('Warning Systems', 'Warning systems link sensors, forecasts, thresholds, affected areas, and communication channels so alerts reach the right places quickly.', ['femaGIS', 'ogcSensorThings']),
                leaf('Emergency Response', 'Responders use GIS for situational awareness, damaged-area assessment, routing, resource staging, public information, and recovery coordination.', ['femaGIS'])
            ]),
            leaf('Logistics/Transport', 'Transport GIS supports route planning, fleet tracking, network analysis, travel-time estimation, asset management, and service-area design.', ['googleMaps', 'postgis']),
            leaf('Geology', 'Geologic GIS integrates field observations, maps, geophysics, chemistry, imagery, and 3D subsurface models for research and resource decisions.', ['usgsGeology']),
            branch('Government', [
                leaf('Defense', 'Defense geospatial intelligence combines imagery, mapping, terrain, infrastructure, and time-sensitive observations to support planning and operations.', ['nga']),
                leaf('Weather Bureau', 'Meteorological agencies use GIS to publish forecasts, radar, hazards, climate records, observations, and location-based decision tools.', ['noaaGIS']),
                leaf('Social Services', 'Social-service mapping helps compare population needs, accessibility, service coverage, demographics, and program outcomes across neighborhoods.', ['usCensusMaps']),
                leaf('Planning', 'Public agencies use GIS to evaluate scenarios, investments, zoning, mobility, environmental effects, and community needs.', ['dataEuropaGeo', 'usCensusMaps']),
                leaf('Land Use', 'Land-use GIS records current use and regulation, detects change, models suitability, and supports zoning and development review.', ['faoGeospatial', 'usgsGeospatial'])
            ]),
            leaf('Urban Planning', 'Urban planners use GIS to connect land use, housing, transport, infrastructure, environment, demographics, and development scenarios.', ['usCensusMaps', 'dataEuropaGeo']),
            leaf('Agriculture', 'Agricultural GIS supports crop monitoring, soil and water assessment, agro-ecological zoning, precision inputs, yield analysis, and resilience planning.', ['faoGeospatial']),
            branch('Resource Management', [
                leaf('Water', 'Water-resource GIS maps watersheds, supply, demand, quality, flood risk, infrastructure, and ecological conditions.', ['usgsGeospatial', 'faoGeospatial']),
                leaf('Land', 'Land management uses GIS for ownership, cover, capability, degradation, conservation, allocation, and change monitoring.', ['faoGeospatial']),
                leaf('Oil & Gas', 'Energy GIS supports basin assessment, leases, wells, pipelines, facilities, environmental review, logistics, and operational monitoring.', ['usgsGeology', 'usgsGeospatial']),
                leaf('Renewable Resources', 'Renewable-resource GIS evaluates solar, wind, hydro, biomass, environmental constraints, grid access, and development suitability.', ['nrelGIS']),
                leaf('Mining', 'Mining GIS brings together geology, deposits, claims, exploration, terrain, infrastructure, environmental controls, and closure planning.', ['usgsGeology']),
                leaf('Forestry', 'Forestry GIS supports inventories, harvest planning, habitat analysis, fire risk, carbon accounting, restoration, and change detection.', ['faoGeospatial'])
            ]),
            leaf('Design & Engineering', 'Engineering GIS connects surveys, site context, utilities, terrain, constraints, assets, and design information across project lifecycles.', ['ogcStandards', 'cesium']),
            leaf('Facilities Management', 'Facilities GIS links indoor and outdoor locations to assets, inspections, maintenance, space, safety, and service workflows.', ['ogcStandards', 'qfield'])
        ]
    }
];

function slugify(value) {
    return value
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

function decorateNode(node, branchMeta, path = []) {
    const nodePath = [...path, node.label];
    const decorated = {
        ...node,
        id: nodePath.map(slugify).join('--'),
        path: nodePath,
        side: branchMeta.side,
        color: branchMeta.color
    };

    if (node.children) {
        decorated.children = node.children.map((child) => decorateNode(child, branchMeta, nodePath));
    }

    return decorated;
}

export const GIS_BRANCHES = rawBranches.map((item) => decorateNode(item, item));

export function findGisNodeById(id) {
    const stack = [...GIS_BRANCHES];
    while (stack.length) {
        const node = stack.pop();
        if (node.id === id) {
            return node;
        }
        if (node.children) {
            stack.push(...node.children);
        }
    }
    return null;
}

export function getGisLeafNodes() {
    const leaves = [];
    const stack = [...GIS_BRANCHES];
    while (stack.length) {
        const node = stack.pop();
        if (node.children?.length) {
            stack.push(...node.children);
        } else {
            leaves.push(node);
        }
    }
    return leaves;
}
