import type { INodeProperties } from 'n8n-workflow';

const showeditinfo = { function: ['修改本人信息'] }

export const updateinfo: INodeProperties[] = [
	{
		displayName: '本人UserID',
		name: 'OwnUserid',
		type: 'string',
		placeholder: 'usr_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx',
		default: '',
		displayOptions: { show: showeditinfo },
		required: true,
		routing: {
			request: {
				method: 'PUT',
				url: '=/users/{{$value}}',
			},
		},
	},
	{
		displayName: '修改信息',
		name: 'additionalFields',
		type: 'collection',
		default: {},
		placeholder: '添加修改信息字段',
		displayOptions: { show: showeditinfo },
		options: [
			{
				displayName: '状态',
				name: 'status',
				type: 'options',
				default: 'active',
				options: [
					{
						name: 'active',
						value: 'active',
					},
					{
						name: 'join me',
						value: 'join me',
					},
					{
						name: 'ask me',
						value: 'ask me',
					},
					{
						name: 'busy',
						value: 'busy',
					},
					{
						name: 'offline(?)',
						value: 'offline',
					},
				],
				routing: {
					request: {
						body: {
							status: '={{$value}}',
						},
					},
				},
			},
			{
				displayName: '状态文本',
				name: 'statusDescription',
				type: 'string',
				placeholder: 'ZzZzZz...',
				default: '',
				routing: {
					request: {
						body: {
							statusDescription: '={{$value}}',
						},	
					},
				},
			},
            {
				displayName: '简介',
				name: 'bio',
				type: 'string',
				placeholder: 'Hello VRChat!',
				default: '',
				routing: {
					request: {
						body: {
							bio: '={{$value}}',
						},	
					},
				},
			},
			{
				displayName: '代称',
				name: 'pronouns',
				type: 'string',
				placeholder: '沃尔玛塑料袋/武装直升机',
				default: '',
				routing: {
					request: {
						body: {
							pronouns: '={{$value}}',
						},	
					},
				},
			},
		],
	},
];
