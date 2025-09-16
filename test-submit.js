const FormData = require('form-data');
const fetch = require('node-fetch');

async function testSubmission() {
    console.log('Testing form submission...');

    const form = new FormData();

    // Add partner info
    form.append('partnerName', 'Test Business');
    form.append('cardKey', 'TEST-001');
    form.append('tagline', 'Test tagline');
    form.append('website', 'https://test.com');

    // Add branding
    form.append('primaryColor', '#2c3e50');
    form.append('secondaryColor', '#34495e');
    form.append('accentColor', '#3498db');
    form.append('primaryFont', 'system');
    form.append('headerFont', 'inherit');

    // Add tier data
    form.append('tierName[]', 'Bronze');
    form.append('tierName[]', 'Silver');
    form.append('tierBasePoints[]', '0');
    form.append('tierBasePoints[]', '1000');
    form.append('tierRoomNights[]', '0');
    form.append('tierRoomNights[]', '10');
    form.append('tierDiscount[]', '5');
    form.append('tierDiscount[]', '10');
    form.append('tierColorOne[]', '#CD7F32');
    form.append('tierColorOne[]', '#C0C0C0');
    form.append('tierColorTwo[]', '#A0522D');
    form.append('tierColorTwo[]', '#808080');
    form.append('tierImage[]', '');
    form.append('tierImage[]', '');
    form.append('tierDescription[]', 'Entry level tier');
    form.append('tierDescription[]', 'Premium tier');

    // Add spending types
    form.append('spendingTypeName[]', 'Dining');
    form.append('spendingTypeName[]', 'Shopping');
    form.append('spendingTypeCurrency[]', 'THB');
    form.append('spendingTypeCurrency[]', 'THB');
    form.append('spendingTypeMultiplier[]', '1.0');
    form.append('spendingTypeMultiplier[]', '1.5');

    // Add reward categories
    form.append('rewardCategoryName[]', 'Discounts');
    form.append('rewardCategoryName[]', 'Free Items');
    form.append('rewardCategoryDescription[]', 'Percentage discounts');
    form.append('rewardCategoryDescription[]', 'Complimentary items');

    // Add rewards
    form.append('rewardName[]', '10% Off');
    form.append('rewardName[]', 'Free Coffee');
    form.append('rewardPoints[]', '100');
    form.append('rewardPoints[]', '50');
    form.append('rewardCategory[]', 'Discounts');
    form.append('rewardCategory[]', 'Free Items');

    try {
        const response = await fetch('http://localhost:3000/submit-loyalty-program', {
            method: 'POST',
            body: form
        });

        console.log('Response status:', response.status);

        const result = await response.json();
        console.log('Result:', JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testSubmission();