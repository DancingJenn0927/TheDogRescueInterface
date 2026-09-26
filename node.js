require('dotenv').config();
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;
const rescueGroupsKey = process.env.RESCUEGROUPS_API_KEY;

const animalsEndpoint = 'https://api.rescuegroups.org/v5/public/animals/search/available/dogs/';
const organizationsEndpoint = 'https://api.rescuegroups.org/v5/public/orgs/search';
const stateCodes = {
	'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
	'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
	'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
	'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
	'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
	'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
	'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
	'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
	'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
	'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
	'district of columbia': 'DC'
};

async function searchRescueGroups(url, filters = [], queryString = '') {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 15000);
	try {
		const apiResponse = await fetch(`${url}${queryString}`, {
			method: 'POST',
			signal: controller.signal,
			headers: {
				'Content-Type': 'application/vnd.api+json',
				Authorization: rescueGroupsKey
			},
			body: JSON.stringify({ data: filters.length ? { filters } : {} })
		});
		const payload = await apiResponse.json();
		if (!apiResponse.ok) {
			throw new Error(payload.errors?.[0]?.detail || payload.message || 'RescueGroups rejected the search request.');
		}
		return payload;
	} finally {
		clearTimeout(timeout);
	}
}

app.use(express.static('.'));

app.get('/api/search', async (request, response) => {
	const { search = '' } = request.query;
	const searchValue = search.trim();
	const stateCode = /^[A-Za-z]{2}$/.test(searchValue)
		? searchValue.toUpperCase()
		: stateCodes[searchValue.toLowerCase()];

	if (!rescueGroupsKey) {
		return response.status(500).json({ error: 'RESCUEGROUPS_API_KEY is not configured.' });
	}

	try {
		if (stateCode) {
			const organizationStateFilter = [{ fieldName: 'orgs.state', operation: 'equal', criteria: stateCode }];
			const animalStateFilter = [{ fieldName: 'orgs.state', operation: 'equal', criteria: stateCode }];
			const [animals, rescues, shelters] = await Promise.all([
				searchRescueGroups(animalsEndpoint, animalStateFilter, '?include=orgs'),
				searchRescueGroups(`${organizationsEndpoint}/rescue/`, organizationStateFilter),
				searchRescueGroups(`${organizationsEndpoint}/shelter/`, organizationStateFilter)
			]);
			const results = [
				...(Array.isArray(animals.data) ? animals.data.map(item => ({ ...item, searchKind: 'animal' })) : []),
				...(Array.isArray(rescues.data) ? rescues.data.map(item => ({ ...item, searchKind: 'organization' })) : []),
				...(Array.isArray(shelters.data) ? shelters.data.map(item => ({ ...item, searchKind: 'organization' })) : [])
			];
			return response.json({ data: results });
		}

		const filters = searchValue
			? [{ fieldName: 'animals.searchString', operation: 'contains', criteria: searchValue }]
			: [];
		const payload = await searchRescueGroups(animalsEndpoint, filters);
		response.json(payload);
	} catch (error) {
		const message = error.name === 'AbortError'
			? 'RescueGroups request timed out.'
			: error.message || 'RescueGroups could not be reached.';
		response.status(502).json({ error: message });
	}
});

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});
