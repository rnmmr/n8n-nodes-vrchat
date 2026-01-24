import { INodeType, INodeTypeDescription } from 'n8n-workflow';

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
								url: '=/users',
							},
						},
					},
                    {
						name: '获取玩家信息',
						value: '获取玩家信息',
					},
				],
				default: '获取本人信息',
			},
			// 搜索玩家
			{
				displayName: '玩家名字',
				name: 'UserName',
				type: 'string',
				placeholder: '名字',
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
			// 获取玩家信息
            {
				displayName: '玩家UserID',
				name: 'UserID',
				type: 'string',
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
			// 通用参数
			{
				displayName: '结果数量',
				name: 'n',
				type: 'string',
				placeholder: '60',
				default: '60',
				displayOptions: {
					show: {
						function: ['搜索玩家'],
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
						function: ['搜索玩家'],
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
		],
	};
}
