import { INodeType, INodeTypeDescription } from 'n8n-workflow';
import { updateinfo } from './updateinfo';

export class VRChat implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'VRChat',
		name: 'VRChat',
		icon: 'file:vrchat-app.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["function"]}}',//'={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: '456',
		defaults: {
			name: 'VRChat',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'VRChatAPI',
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
		// Basic node details will go here
		properties: [
			{
				displayName: '方法',
				name: 'function',
				type: 'options',
				options: [
					{
						name: '获取本人信息',
						value: '获取本人信息',
                        routing: {
							request: {
								method: 'GET',
								url: '/auth/user',
							},
						},
					},
					{
						name: '搜索玩家',
						value: '搜索玩家',
                        routing: {
							request: {
								method: 'GET',
								url: '/users',
							},
						},
					},
                    {
						name: '获取玩家信息',
						value: '获取玩家信息',
					},
					{
						name: '获取通知',
						value: '获取通知',
                        routing: {
							request: {
								method: 'GET',
								url: '/auth/user/notifications',
							},
						},
					},
					{
						name: '修改本人信息',
						value: '修改本人信息',
						// routing: {
						// 	request: {
						// 		method: 'PUT',
						// 		url: '/users',
						// 	},
						// },
					},
					{
						name: '接受申请',
						value: '接受申请',
					},
					// {
					// 	name: '群组管理',
					// 	value: '群组管理',
					// },
				],
				default: '获取本人信息',
			},
			// 搜索玩家
			{
				displayName: '玩家名字',
				name: 'UserName',
				type: 'string',
				placeholder: '名字',
				required: true,
				displayOptions: {
					show: {
						function: ['搜索玩家'],
					},
				},
				routing: {
					request: {
						qs: {
							search: '={{$value}}',
						}
					},
				},
				default: '',
			},
			// 通用参数
			{
				displayName: '结果数量',
				name: 'n',
				type: 'string',
				placeholder: '60',
				default: '60',
				displayOptions: {
					show: {
						function: ['搜索玩家','获取通知'],
					},
				},
				routing: {
					request: {
						qs: {
							n: '={{$value}}',
						}
					},
				},
			},
			{
				displayName: '偏移量',
				name: 'offset',
				type: 'string',
				placeholder: '0',
				default: '0',
				displayOptions: {
					show: {
						function: ['搜索玩家','获取通知'],
					},
				},
				routing: {
					request: {
						qs: {
							offset: '={{$value}}',
						}
					},
				},
			},
			// 获取玩家信息
            {
				displayName: '玩家UserID',
				name: 'UserID',
				type: 'string',
				required: true,
				placeholder: 'usr_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx',
				displayOptions: {
					show: {
						function: ['获取玩家信息'],
					},
				},
				routing: {
					request: {
						method: 'GET',
						url: '=/users/{{$value}}',
					},
				},
				default: '',
			},
			// 修改本人信息
			...updateinfo,
			// 接受申请
			{
				displayName: '申请ID',
				name: 'frqId',
				type: 'string',
				required: true,
				placeholder: 'frq_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx',
				displayOptions: {
					show: {
						function: ['接受申请'],
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
		],
	};
}
