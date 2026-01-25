import {
	INodeType,
	INodeTypeDescription,
	//IExecuteFunctions,
	//INodeExecutionData,
} from 'n8n-workflow';
import { updateinfo } from './updateinfo';

export class VRChat implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'VRChat',
		name: 'VRChat',
		icon: 'file:vrchat-app.svg',
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
						routing: {
							request: {
								method: 'GET',
								url: '=/users/{{$parameter["UserID"]}}',
							},
						},
					},
					{
						name: '获取共同好友',
						value: '获取共同好友',
						routing: {
							request: {
								method: 'GET',
								url: '=/users/{{$parameter["UserID"]}}/mutuals/friends',
							},
						},
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
						name: '接受申请',
						value: '接受申请',
					},
					{
						name: '查看房间',
						value: '查看房间',
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
						},
					},
				},
				default: '',
			},
			// 获取玩家信息(爆改成通用参数了)
			{
				displayName: '玩家UserID',
				name: 'UserID',
				type: 'string',
				required: true,
				placeholder: 'usr_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx',
				displayOptions: {
					show: {
						function: ['获取玩家信息','获取共同好友'],
					},
				},
				default: '',
			},
			// 修改本人信息
			...updateinfo,
			// 获取共同好友
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
			// 查看房间
			{
				displayName: '世界ID',
				name: 'worldId',
				type: 'string',
				required: true,
				placeholder: 'wrld__xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
				displayOptions: {
					show: {
						function: ['查看房间'],
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
				displayName: '附加信息',
				name: 'additionalinfo',
				type: 'collection',
				default: {},
				placeholder: '添加附加信息字段',
				displayOptions: { show: {function: ['查看房间'],} },
				options: [
					{
						displayName: '房间ID',
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
			// 通用参数
			{
				displayName: '结果参数',
				name: '结果参数字段',
				type: 'collection',
				default: {},
				placeholder: '添加结果参数字段',
				displayOptions: { show: {function: ['搜索玩家', '获取通知', '获取共同好友']} },
				options: [
					{
						displayName: '结果数量',
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
						displayName: '偏移量',
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
		// async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		// }
	};
}
