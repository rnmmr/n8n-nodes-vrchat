/* eslint-disable @n8n/community-nodes/icon-validation */
/* eslint-disable n8n-nodes-base/cred-class-field-name-uppercase-first-char */
import {
	ICredentialType,
	INodeProperties,
	ICredentialTestRequest,
	IAuthenticateGeneric,
} from 'n8n-workflow';

export class VRChatApi implements ICredentialType {
	name = 'VRChatApi';
	displayName = 'VRChat API';
	icon: ICredentialType['icon'] = 'file:../../icons/vrchat.svg';
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
//		{
//			displayName: 'Cookie Expires At',
//			name: 'cookieExpiresAt',
//			type: 'hidden',
//			default: 0,
//		},
//		{
//			displayName: 'Cookie Checked At',
//			name: 'cookieCheckedAt',
//			type: 'hidden',
//			default: 0,
//		},
//		{
//			displayName: 'Add Custom Headers',
//			name: 'showheaders',
//			type: 'boolean',
//			default: 0,
//		},
//		{
//			displayName: 'Custom Headers',
//			name: 'headers',
//			type: 'json',
//			default: '',
//			displayOptions: {
//				show: {
//					showheaders: [
//						true,
//					],
//				},
//			},
//			placeholder: '{ "X-Custom-Header": "value" }',
//		},
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

	// authenticate = async (
		// credentials: {
			// authcookie?: string;
			// cachedAuthCookie?: string;
			// cookieExpiresAt?: number;
			// cookieCheckedAt?: number;
			// showheaders?: boolean;
			// headers?: JsonObject;
		// },
		// requestOptions: any
	// ) => {
		// let cookie = credentials.cachedAuthCookie || credentials.authcookie;
		// requestOptions.headers = requestOptions.headers || {};
		// requestOptions.headers['Cookie'] = cookie;
		// requestOptions.headers['User-Agent'] = 'n8n-nodes-vrchat';
		// return requestOptions;
	// };

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