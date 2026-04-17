import type { INodeProperties } from 'n8n-workflow';

const showeditinfo = { function: ['Update Current User'] };

export const updateinfo: INodeProperties[] = [
	{
		displayName: 'Current User ID',
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
		displayName: 'User Info',
		name: 'additionalFields',
		type: 'collection',
		default: {},
		placeholder: 'Add user info fields',
		displayOptions: { show: showeditinfo },
		options: [
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'active',
				options: [
					{
						name: 'Active',
						value: 'active',
					},
					{
						name: 'Ask Me',
						value: 'ask me',
					},
					{
						name: 'Busy',
						value: 'busy',
					},
					{
						name: 'Join Me',
						value: 'join me',
					},
					{
						name: 'Offline',
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
				displayName: 'Status Description',
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
				displayName: 'Bio',
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
				displayName: 'Pronouns',
				name: 'pronouns',
				type: 'string',
				placeholder: 'they/them',
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
