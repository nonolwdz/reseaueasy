exports.handler = async function(event, context) {
    const { lat, lng } = event.queryStringParameters;
    const rayon = 10000; // 10 km
    
    const urlANFR = `https://data.anfr.fr/d4c/api/records/1.0/search/?dataset=observatoire_2g_3g_4g&resource_id=88ef0887-6b0f-4d3f-8545-6d64c8f597da&geofilter.distance=${lat},${lng},${rayon}&rows=30`;

    try {
        const response = await fetch(urlANFR);
        const data = await response.json();

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
