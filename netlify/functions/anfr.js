const https = require('https');

exports.handler = async function(event, context) {
    const params = event.queryStringParameters || {};
    const lat = params.lat || '46.4704';
    const lng = params.lng || '2.4357';
    const rayon = 10000; // 10 km
    
    // Le "coordonnees," est obligatoire ici pour que l'API de l'État filtre autour du point GPS
    const urlANFR = `https://data.anfr.fr/d4c/api/records/1.0/search/?dataset=observatoire_2g_3g_4g&resource_id=88ef0887-6b0f-4d3f-8545-6d64c8f597da&geofilter.distance=coordonnees,${lat},${lng},${rayon}&rows=30`;

    return new Promise((resolve) => {
        https.get(urlANFR, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: 200,
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "application/json"
                    },
                    body: data
                });
            });
        }).on('error', (e) => {
            resolve({
                statusCode: 500,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ error: e.message })
            });
        });
    });
};
