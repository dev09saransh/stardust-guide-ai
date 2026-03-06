const axios = require('axios');

/**
 * Investment Data Service (via Setu AA)
 */
class FinancialDataService {
    constructor() {
        this.baseUrl = process.env.SETU_AA_BASE_URL || 'https://fiu-uat.setu.co';
        this.clientId = process.env.SETU_CLIENT_ID;
        this.clientSecret = process.env.SETU_CLIENT_SECRET;
        this.appId = process.env.SETU_APP_ID;
        this.demoMode = true;
    }

    getAuthHeaders() {
        return {
            'x-client-id': this.clientId,
            'x-client-secret': this.clientSecret,
            'x-product-instance-id': this.appId,
            'Content-Type': 'application/json'
        };
    }

    async createConsentRequest(mobileOrPan, requestedTypes = null) {
        try {
            const headers = this.getAuthHeaders();
            const mobile = mobileOrPan.replace(/\D/g, '').slice(-10);
            const vua = `${mobile || '9999999999'}@onemoney`;

            // Restricted to only Investment types as requested
            const fiTypes = requestedTypes || [
                "MUTUAL_FUNDS", "EQUITIES", "SIP", "ETF", "BONDS", "NPS"
            ];

            const payload = {
                vua,
                purpose: {
                    code: "101",
                    refUri: "https://api.rebit.org.in/aa/purpose/101.xml",
                    text: "Wealth and Asset Management Service",
                    category: { type: "string" }
                },
                dataRange: {
                    from: "2020-01-01T00:00:00.000Z",
                    to: new Date().toISOString()
                },
                consentMode: "STORE",
                fetchType: "ONETIME",
                consentTypes: ["PROFILE", "SUMMARY", "TRANSACTIONS"],
                fiTypes: ["MUTUAL_FUNDS"], // Sandbox only supports this
                frequency: { unit: "MONTH", value: 1 },
                dataLife: { unit: "MONTH", value: 1 },
                consentDuration: { unit: "MONTH", value: 1 },
                redirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?tab=assets&sync=complete`,
                context: []
            };

            const response = await axios.post(`${this.baseUrl}/v2/consents`, payload, { headers });
            return response.data;
        } catch (error) {
            const detail = error.response?.data?.errorMsg || error.message;
            throw new Error(`Consent Initiation Failed: ${detail}`);
        }
    }

    async getConsentStatus(consentId) {
        const headers = this.getAuthHeaders();
        const response = await axios.get(`${this.baseUrl}/v2/consents/${consentId}`, { headers });
        return response.data;
    }

    async fetchHoldings(consentId) {
        try {
            const headers = this.getAuthHeaders();
            const sessionRes = await axios.post(`${this.baseUrl}/v2/sessions`, {
                consentId,
                dataRange: { from: "2020-01-01T00:00:00.000Z", to: new Date().toISOString() },
                format: "json"
            }, { headers });

            const sessionId = sessionRes.data.id;
            for (let i = 0; i < 5; i++) {
                await new Promise(r => setTimeout(r, 3000));
                const statusRes = await axios.get(`${this.baseUrl}/v2/sessions/${sessionId}`, { headers });
                if (statusRes.data.status === 'COMPLETED' || statusRes.data.status === 'READY') break;
            }

            const dataRes = await axios.get(`${this.baseUrl}/v2/sessions/${sessionId}/data`, { headers });
            let holdings = this.transformSetuData(dataRes.data);

            if (holdings.length === 0 && this.demoMode) {
                holdings = this.getDemoData();
            }

            return holdings;
        } catch (error) {
            if (this.demoMode) return this.getDemoData();
            throw new Error('Data retrieval failed');
        }
    }

    transformSetuData(setuData) {
        const assets = [];
        if (!setuData?.FIObjects) return assets;

        setuData.FIObjects.forEach(obj => {
            const type = obj.fiType;
            const data = obj.data;
            if (!data) return;

            // Only map to Investment category now
            const summary = data.Investment?.Account?.Summary || data.Account?.Summary || {};
            const profile = data.Investment?.Account?.Profile || data.Account?.Profile || {};

            assets.push({
                title: summary.SchemeName || summary.AccountType || summary.InvestmentValue || 'Financial Asset',
                category: 'Investment',
                metadata: {
                    type: type,
                    source: 'Setu AA',
                    ...summary,
                    ...profile,
                    asOf: new Date().toISOString()
                }
            });
        });
        return assets;
    }

    getDemoData() {
        return [
            {
                title: 'Axis Bluechip Fund',
                category: 'Investment',
                metadata: { type: 'Mutual Fund', amc: 'Axis Mutual Fund', schemeName: 'Axis Bluechip Fund - Direct Growth', units: '145.2', nav: '52.4', currentValue: '7,609', asOf: new Date().toISOString() }
            },
            {
                title: 'Nippon India Small Cap',
                category: 'Investment',
                metadata: { type: 'Mutual Fund', amc: 'Nippon India', schemeName: 'Nippon India Small Cap Fund', units: '560.1', nav: '124.5', currentValue: '69,732', asOf: new Date().toISOString() }
            }
        ];
    }
}

module.exports = new FinancialDataService();
