/* eslint-disable n8n-nodes-base/node-filename-against-convention */

import {
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { updateinfo } from './updateinfo';

export class VRChat implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'VRChat',
		name: 'vrChat',
		icon: 'file:../../icons/vrchat.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["function"]}}', //'={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'VRChat API',
		defaults: {
			name: 'VRChat',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				   name: 'VRChatApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: 'https://api.vrchat.cloud/api/1',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Function',
				name: 'function',
				type: 'options',
				options: [
					{
						name: 'Accept Friend Request',
						value: 'Accept Friend Request',
					},
					{
						name: 'Change User Info',
						value: 'changeUserInfo',
						// routing: {
						// 	request: {
						// 		method: 'PUT',
						// 		url: '/users',
						// 	},
						// },
					},
					{
						name: 'Get Current User',
						value: 'Get Current User',
						routing: {
							request: {
								method: 'GET',
								url: '/auth/user',
							},
						},
					},
					{
						name: 'Get Mutual Friends',
						value: 'Get Mutual Friends',
						routing: {
							request: {
								method: 'GET',
								url: '=/users/{{$parameter["UserID"]}}/mutuals/friends',
							},
						},
					},
					{
						name: 'Get Notifications',
						value: 'Get Notifications',
						routing: {
							request: {
								method: 'GET',
								url: '/auth/user/notifications',
							},
						},
					},
					{
						name: 'Get User Info',
						value: 'Get User Info',
						routing: {
							request: {
								method: 'GET',
								url: '=/users/{{$parameter["UserID"]}}',
							},
						},
					},
					{
						name: 'Get World Info',
						value: 'Get World Info',
					},
					{
						name: 'Search Users',
						value: 'Search Users',
						routing: {
							request: {
								method: 'GET',
								url: '/users',
							},
						},
					},
					// {
					// 	name: '群组管理',
					// 	value: '群组管理',
					// },
				],
				default: 'Get Current User',
			},
			{
				displayName: 'Username',
				name: 'UserName',
				type: 'string',
				placeholder: 'Username',
				required: true,
				displayOptions: {
					show: {
						function: ['Search Users'],
					},
				},
				routing: {
					request: {
						qs: {
							search: '={{$value}}',
						},
					},
				},
				default: '',
			},
			// 获取玩家信息(爆改成通用参数了)
			{
				displayName: 'User ID',
				name: 'UserID',
				type: 'string',
				required: true,
				placeholder: 'usr_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx',
				displayOptions: {
					show: {
						function: ['Get User Info', 'Get Mutual Friends'],
					},
				},
				default: '',
			},
			...updateinfo,
			{
				displayName: 'Friend Request ID',
				name: 'frqId',
				type: 'string',
				required: true,
				placeholder: 'frq_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx',
				displayOptions: {
					show: {
						function: ['Accept Friend Request'],
					},
				},
				routing: {
					request: {
						method: 'PUT',
						url: '=/auth/user/notifications/{{$value}}/accept',
					},
				},
				default: '',
			},
			{
				displayName: 'World ID',
				name: 'worldId',
				type: 'string',
				required: true,
				placeholder: 'wrld__xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
				displayOptions: {
					show: {
						function: ['Get World Info'],
					},
				},
				routing: {
					request: {
						method: 'GET',
						url: '=/worlds/{{$value}}',
					},
				},
				default: '',
			},
			{
				displayName: 'Additional Info',
				name: 'additionalinfo',
				type: 'collection',
				default: {},
				placeholder: 'Add additional info fields',
				displayOptions: { show: { function: ['Get World Info'] } },
				options: [
					{
						displayName: 'Instance ID',
						name: 'instanceId',
						type: 'string',
						placeholder: '12345~hidden(usr_c1644b5b-3ca4-45b4-97c6-a2a0de70d469)~region(eu)~nonce(27e8414a-59a0-4f3d-af1f-f27557eb49a2)',
						routing: {
							request: {
								method: 'GET',
								url: '=/worlds/{{$parameter["worldId"]}}/{{$value}}',
							},
						},
						default: '',
					},
				],
			},
			{
				displayName: 'Result Parameters',
				name: 'resultParams',
				type: 'collection',
				default: {},
				placeholder: 'Add result parameters',
				displayOptions: { show: { function: ['Search Users', 'Get Notifications', 'Get Mutual Friends'] } },
				options: [
					{
						displayName: 'Result Count',
						name: 'n',
						type: 'string',
						placeholder: '60',
						default: '60',
						routing: {
							request: {
								qs: {
									n: '={{$value}}',
								},
							},
						},
					},
					{
						displayName: 'Offset',
						name: 'offset',
						type: 'string',
						placeholder: '0',
						default: '0',
						routing: {
							request: {
								qs: {
									offset: '={{$value}}',
								},
							},
						},
					},
				],
			},
		],
		usableAsTool: true,
	};
}
