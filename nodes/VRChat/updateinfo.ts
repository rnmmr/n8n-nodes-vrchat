import type { INodeProperties } from 'n8n-workflow';

const showeditinfo = { resource: ['user'], operation: ['changeUserInfo'] };
const showprofile = { resource: ['user'], operation: ['updateProfile'] };

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
		displayName: 'User ID',
		name: 'ProfileUserid',
		type: 'string',
		placeholder: 'usr_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx',
		default: '',
		displayOptions: { show: showprofile },
		required: true,
		routing: {
			request: {
				method: 'PUT',
				url: '=/profile/{{$value}}',
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
				displayName: 'Allow Worlds To Count Friends In Instance',
				name: 'allowWorldsToCountFriendsInInstance',
				type: 'boolean',
				default: false,
				description:
					'Whether to allow worlds to see how many friends are in an instance (Udon Friend Info, September 2026)',
				routing: {
					request: {
						body: {
							allowWorldsToCountFriendsInInstance: '={{$value}}',
						},
					},
				},
			},
			{
				displayName: 'Booping Enabled',
				name: 'isBoopingEnabled',
				type: 'boolean',
				default: false,
				description: 'Whether other users are able to boop you',
				routing: {
					request: {
						body: {
							isBoopingEnabled: '={{$value}}',
						},
					},
				},
			},
			{
				displayName: 'Opt Out Of Discord Friend Connections',
				name: 'hasDiscordFriendsOptOut',
				type: 'boolean',
				default: false,
				routing: {
					request: {
						body: {
							hasDiscordFriendsOptOut: '={{$value}}',
						},
					},
				},
			},
			{
				displayName: 'Opt Out Of Mutuals',
				name: 'hasSharedConnectionsOptOut',
				type: 'boolean',
				default: false,
				routing: {
					request: {
						body: {
							hasSharedConnectionsOptOut: '={{$value}}',
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
		],
	},
	{
		displayName: 'Profile Fields',
		name: 'profileFields',
		type: 'collection',
		default: {},
		placeholder: 'Add profile fields',
		displayOptions: { show: showprofile },
		options: [
			{
				displayName: 'Background Texture (File ID)',
				name: 'backgroundTextureId',
				type: 'string',
				placeholder: 'file_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
				default: '',
				routing: {
					request: {
						body: {
							backgroundTextureId: '={{$value}}',
						},
					},
				},
			},
			{
				displayName: 'Background Type',
				name: 'backgroundType',
				type: 'options',
				default: 'default',
				options: [
					{
						name: 'Default',
						value: 'default',
					},
					{
						name: 'Gradient',
						value: 'gradient',
					},
					{
						name: 'Inventory',
						value: 'inventory',
					},
					{
						name: 'Texture',
						value: 'texture',
					},
				],
				routing: {
					request: {
						body: {
							backgroundType: '={{$value}}',
						},
					},
				},
			},
			{
				displayName: 'Banner Color',
				name: 'bannerColor',
				type: 'color',
				default: '3cc92c',
				routing: {
					request: {
						body: {
							bannerColor: '={{$value}}',
						},
					},
				},
			},
			{
				displayName: 'Banner Type',
				name: 'bannerType',
				type: 'options',
				default: 'color',
				options: [
					{
						name: 'Avatar Banner',
						value: 'avatarBanner',
					},
					{
						name: 'Color',
						value: 'color',
					},
					{
						name: 'Custom Image',
						value: 'customImage',
					},
				],
				routing: {
					request: {
						body: {
							bannerType: '={{$value}}',
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
				displayName: 'Bio Links',
				name: 'bioLinks',
				type: 'string',
				typeOptions: {
					multipleValues: true,
				},
				placeholder: 'https://example.com',
				default: '',
				routing: {
					request: {
						body: {
							bioLinks: '={{$value}}',
						},
					},
				},
			},
			{
				displayName: 'Languages',
				name: 'languages',
				type: 'string',
				typeOptions: {
					multipleValues: true,
				},
				placeholder: 'English',
				default: '',
				routing: {
					request: {
						body: {
							languages: '={{$value}}',
						},
					},
				},
			},
			{
				displayName: 'Theme ID',
				name: 'themeId',
				type: 'string',
				placeholder: 'thm_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
				default: '',
				routing: {
					request: {
						body: {
							themeId: '={{$value}}',
						},
					},
				},
			},
			{
				displayName: 'User Icon (Image File ID)',
				name: 'userIcon',
				type: 'string',
				placeholder: 'file_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
				default: '',
				routing: {
					request: {
						body: {
							userIcon: '={{$value}}',
						},
					},
				},
			},
		],
	},
];
