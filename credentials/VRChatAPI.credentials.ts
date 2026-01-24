import {
	ICredentialType,
	INodeProperties,
	ICredentialTestRequest,
	IAuthenticateGeneric
} from 'n8n-workflow';

export class VRChatAPI implements ICredentialType {
	name = 'VRChatAPI';
	displayName = 'VRChat API';
	// Uses the link to this tutorial as an example
	// Replace with your own docs links when building your own nodes
	documentationUrl = 'https://docs.n8n.io/integrations/creating-nodes/build/declarative-style-node/';
	properties: INodeProperties[] = [
		{
			displayName: 'Auth Cookie',
			name: 'authcookie',
			type: 'string',
			default: '',
			placeholder: 'auth=xxxxxxxxxxxxxxxx',
		},
	];
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Cookie: '={{$credentials.authcookie}}',
				"User-Agent":"n8n-nodes-vrchat",
			},
		},
	};
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.vrchat.cloud/api/1',
			url: '/auth/user',
			method: "GET",
			headers: {
				Cookie: '={{$credentials.authcookie}}',
				"User-Agent":"n8n-nodes-vrchat",
			},
		},
	};
}