const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

const scrape130Point = require('../scraper/scrape130point.js');
const processListingsCron = require('./processListingsCron.js');

async function updatePrices() {
    console.log('Starting price update!');

    const cardsToTrack = await prisma.card.findMany({
        where: {trackPrices: true}
    });

    for (const card of cardsToTrack) {
        const query = `${card.year} ${card.playerName} ${card.cardBrand} ${card.variant ?? ''} ${card.isGraded ? `${card.grader} ${card.grade}` : ''} ${card.cardNum}`.trim();

        console.log(`[🔍 Fetching for]: ${query}`);

        // STEP 1: Scrape listings
        const listings = await scrape130Point(query);

        // STEP 2: Process listings
        const { averagePrice, sampleCount, usedListings } = processListingsCron(listings, query, card.cardNum);

        // Debug: print each used listing
        fs.writeFileSync(path.join('test_files', 'finalUsedListings.json'), JSON.stringify(usedListings, null, 2));
        console.log('[✅ Used listings written to finalUsedListings.json]');

        if (averagePrice !== null) {
            // STEP 3: Insert new price history
            await prisma.priceHistory.create({
                data: {
                    cardId: card.id,
                    averagePrice: averagePrice,
                    sampleCount: sampleCount
                }
            });

            // STEP 4: Update estimated value in card table
            await prisma.card.update({
                where: { id: card.id },
                data: {
                    estimatedValue: averagePrice,
                    lastUpdated: new Date()
                }
            });

            console.log(`[✅ Updated]: ${query} → $${averagePrice.toFixed(2)} (${sampleCount} samples)`);
        } else {
            console.log(`[⚠️ No valid data for]: ${query}`);
        }
    }

    console.log('[🏁 Price Update Complete]');
}

module.exports = updatePrices;

// ✅ Call it immediately if this file is run directly
if (require.main === module) {
    updatePrices()
        .then(() => console.log('✅ updatePrices completed successfully.'))
        .catch(err => console.error('❌ updatePrices failed:', err));
}