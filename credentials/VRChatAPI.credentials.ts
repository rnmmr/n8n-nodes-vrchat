/* eslint-disable @n8n/community-nodes/icon-validation */
 
import {
	ICredentialType,
	INodeProperties,
	ICredentialTestRequest,
	IAuthenticateGeneric,
} from 'n8n-workflow';

export class VRChatApi implements ICredentialType {
	name = 'vRChatApi';
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
			placeholder: 'authcookie_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
		},
		{
			displayName: 'VRChat Log Directory',
			name: 'logDirectory',
			type: 'string',
			default: '',
			placeholder: '留空自动检测 (%USERPROFILE%\\AppData\\LocalLow\\VRChat\\VRChat)',
			description: 'VRChat 日志文件夹路径，供日志 Trigger 和 Analyzer 使用。留空则自动检测。',
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
				Cookie: '={{"auth="+$credentials.authcookie}}',
				"User-Agent":"n8n-nodes-vrchat/1.0.1",
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
				Cookie: '={{"auth="+$credentials.authcookie}}',
				"User-Agent":"n8n-nodes-vrchat/1.0.1",
			},
		},
		rules: [
			{
				type: 'responseCode',
				properties: {
					value: 401,
					message: 'Auth cookie 无效或已过期，请重新从浏览器 DevTools 获取 authcookie',
				},
			},
			{
				type: 'responseCode',
				properties: {
					value: 403,
					message: '访问被拒绝，可能需要重新登录 VRChat 或 cookie 格式不正确',
				},
			},
		],
	};
}