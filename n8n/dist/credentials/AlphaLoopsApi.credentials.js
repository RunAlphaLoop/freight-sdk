"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlphaLoopsApi = void 0;
class AlphaLoopsApi {
    name = 'alphaLoopsApi';
    displayName = 'AlphaLoops API';
    documentationUrl = 'https://runalphaloops.com/fmcsa-api/docs';
    properties = [
        {
            displayName: 'API Key',
            name: 'apiKey',
            type: 'string',
            typeOptions: { password: true },
            default: '',
            required: true,
            placeholder: 'ak_...',
            description: 'Your AlphaLoops API key from runalphaloops.com',
        },
    ];
}
exports.AlphaLoopsApi = AlphaLoopsApi;
