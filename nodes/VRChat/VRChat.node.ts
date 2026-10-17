/* eslint-disable n8n-nodes-base/node-filename-against-convention */
/* eslint-disable @n8n/community-nodes/node-filename-against-convention */

import { INodeType, INodeTypeDescription, NodeConnectionTypes } from 'n8n-workflow';
import { updateinfo } from './updateinfo';

export class VRChat implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'VRChat',
		name: 'vrChat',
		icon: 'file:../../icons/vrchat.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'VRChat API',
		defaults: {
			name: 'VRChat',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'vRChatApi',
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
			// ── Resource ──────────────────────────────
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Friend',
						value: 'friend',
						action: 'Friend management',
						description: 'Friend requests, friends list, friend status',
					},
					{
						name: 'Notification',
						value: 'notification',
						action: 'Friend requests and notifications',
						description: 'Friend requests and notifications',
					},
					{
						name: 'User',
						value: 'user',
						action: 'User information and friends',
						description: 'User information and friends',
					},
					{
						name: 'World',
						value: 'world',
						action: 'World information',
						description: 'World information',
					},
				],
				default: 'user',
			},
			// ── User Operations ────────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['user'] } },
				options: [
					{
						name: 'Change User Info',
						value: 'changeUserInfo',
						action: 'Update the current user s info',
						description: "Update the current user's info",
					},
					{
						name: 'Get Current User',
						value: 'getCurrentUser',
						action: 'Get the currently authenticated user',
						description: 'Get the currently authenticated user',
						routing: {
							request: {
								method: 'GET',
								url: '/auth/user',
							},
						},
					},
					{
						name: 'Get Mutual Friends',
						value: 'getMutualFriends',
						action: 'Get mutual friends with another user',
						description: 'Get mutual friends with another user',
						routing: {
							request: {
								method: 'GET',
								url: '=/users/{{$parameter.UserID}}/mutuals/friends',
							},
						},
					},
					{
						name: 'Get Public Profile',
						value: 'getPublicProfile',
						action: 'Get a user public profile',
						description: "Get a user's public profile information",
						routing: {
							request: {
								method: 'GET',
								url: '=/profile/{{$parameter.UserID}}',
							},
						},
					},
					{
						name: 'Get User Info',
						value: 'getUserInfo',
						action: 'Get info about a specific user',
						description: 'Get info about a specific user',
						routing: {
							request: {
								method: 'GET',
								url: '=/users/{{$parameter.UserID}}',
							},
						},
					},
					{
						name: 'Search Users',
						value: 'searchUsers',
						action: 'Search for users by name',
						description: 'Search for users by name',
						routing: {
							request: {
								method: 'GET',
								url: '/users',
							},
						},
					},
					{
						name: 'Update Profile',
						value: 'updateProfile',
						action: 'Update a user profile',
						description: "Update a user's profile (bio, bioLinks, theme, banner, etc.)",
					},
				],
				default: 'getCurrentUser',
			},
			// ── World Operations ───────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['world'] } },
				options: [
					{
						name: 'Get World Info',
						value: 'getWorldInfo',
						action: 'Get info about a specific world',
						description: 'Get info about a specific world',
					},
					{
						name: 'List Active Worlds',
						value: 'getActiveWorlds',
						action: 'List currently active worlds',
						description: 'Search and list currently active worlds',
						routing: {
							request: {
								method: 'GET',
								url: '/worlds/active',
							},
						},
					},
					{
						name: 'List Favorited Worlds',
						value: 'getFavoritedWorlds',
						action: 'List favorited worlds',
						description: 'Search and list favorited worlds',
						routing: {
							request: {
								method: 'GET',
								url: '/worlds/favorites',
							},
						},
					},
					{
						name: 'Search Worlds',
						value: 'searchWorlds',
						action: 'Search for worlds',
						description: 'Search and list any worlds by query filters',
						routing: {
							request: {
								method: 'GET',
								url: '/worlds',
							},
						},
					},
				],
				default: 'getWorldInfo',
			},
			// ── Friend Operations ──────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['friend'] } },
				options: [
					{
						name: 'Delete Friend Request',
						value: 'deleteFriendRequest',
						action: 'Delete an outgoing friend request',
						description: 'Delete an outgoing pending friend request to another user',
						routing: {
							request: {
								method: 'DELETE',
								url: '=/user/{{$parameter.UserID}}/friendRequest',
							},
						},
					},
					{
						name: 'Get Friend Status',
						value: 'getFriendStatus',
						action: 'Check friend status with a user',
						description: 'Check whether a user is a friend, and friend request states',
						routing: {
							request: {
								method: 'GET',
								url: '=/user/{{$parameter.UserID}}/friendStatus',
							},
						},
					},
					{
						name: 'List Friends',
						value: 'getFriends',
						action: 'List your friends',
						description: 'List information about your friends',
						routing: {
							request: {
								method: 'GET',
								url: '/auth/user/friends',
							},
						},
					},
					{
						name: 'Send Boop',
						value: 'boop',
						action: 'Send a boop to a user',
						description: 'Send a boop to another user',
						routing: {
							request: {
								method: 'POST',
								url: '=/users/{{$parameter.UserID}}/boop',
							},
						},
					},
					{
						name: 'Send Friend Request',
						value: 'sendFriendRequest',
						action: 'Send a friend request to a user',
						description: 'Send a friend request to another user',
						routing: {
							request: {
								method: 'POST',
								url: '=/user/{{$parameter.UserID}}/friendRequest',
							},
						},
					},
					{
						name: 'Unfriend',
						value: 'unfriend',
						action: 'Unfriend a user',
						description: 'Unfriend a user by ID',
						routing: {
							request: {
								method: 'DELETE',
								url: '=/auth/user/friends/{{$parameter.UserID}}',
							},
						},
					},
				],
				default: 'getFriends',
			},
			// ── Notification Operations ─────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['notification'] } },
				options: [
					{
						name: 'Accept Friend Request',
						value: 'acceptFriendRequest',
						action: 'Accept a friend request',
						description: 'Accept a friend request',
					},
					{
						name: 'Clear All Notifications',
						value: 'clearNotifications',
						action: 'Clear all notifications',

						routing: {
							request: {
								method: 'PUT',
								url: '/auth/user/notifications/clear',
							},
						},
					},
					{
						name: 'Delete All NotificationV2s',
						value: 'deleteAllNotificationV2s',
						action: 'Delete all notification v2s',
						description: 'Delete all NotificationV2 notifications',
						routing: {
							request: {
								method: 'DELETE',
								url: '/notifications',
							},
						},
					},
					{
						name: 'Delete Notification',
						value: 'deleteNotification',
						action: 'Delete a notification',
						description: 'Delete (hide) a notification',
						routing: {
							request: {
								method: 'PUT',
								url: '=/auth/user/notifications/{{$parameter.notificationId}}/hide',
							},
						},
					},
					{
						name: 'Delete NotificationV2',
						value: 'deleteNotificationV2',
						action: 'Delete a notification v2',
						description: 'Delete a specific NotificationV2',
						routing: {
							request: {
								method: 'DELETE',
								url: '=/notifications/{{$parameter.notificationId}}',
							},
						},
					},
					{
						name: 'Get Notifications',
						value: 'getNotifications',
						action: 'Get all notifications',
						description: 'Get all notifications',
						routing: {
							request: {
								method: 'GET',
								url: '/auth/user/notifications',
							},
						},
					},
					{
						name: 'Get NotificationV2s',
						value: 'getNotificationV2s',
						action: 'Get notification v2 list',
						description: 'List NotificationV2 notifications (group announcements, etc.)',
						routing: {
							request: {
								method: 'GET',
								url: '/notifications',
							},
						},
					},
					{
						name: 'Mark Notification As Read',
						value: 'markNotificationAsRead',
						action: 'Mark a notification as read',
						description: 'Mark a notification as seen',
						routing: {
							request: {
								method: 'PUT',
								url: '=/auth/user/notifications/{{$parameter.notificationId}}/see',
							},
						},
					},
				],
				default: 'getNotifications',
			},
			// ── Shared Fields: User ─────────────────────
			{
				displayName: 'User ID',
				name: 'UserID',
				type: 'string',
				required: true,
				placeholder: 'usr_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx',
				displayOptions: {
					show: {
						resource: ['user', 'friend'],
						operation: [
							'getUserInfo',
							'getMutualFriends',
							'getPublicProfile',
							'sendFriendRequest',
							'deleteFriendRequest',
							'getFriendStatus',
							'unfriend',
							'boop',
						],
					},
				},
				default: '',
			},
			{
				displayName: 'Username',
				name: 'UserName',
				type: 'string',
				placeholder: 'Username',
				required: true,
				displayOptions: {
					show: {
						resource: ['user'],
						operation: ['searchUsers'],
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
			...updateinfo,
			// ── Shared Fields: Profile Options ──────────
			{
				displayName: 'Profile Options',
				name: 'profileOptions',
				type: 'collection',
				default: {},
				placeholder: 'Add profile options',
				displayOptions: {
					show: {
						resource: ['user'],
						operation: ['getPublicProfile'],
					},
				},
				options: [
					{
						displayName: 'As Self',
						name: 'asSelf',
						type: 'boolean',
						default: false,
						description:
							'Whether to include the properties VRChat shows a user on their own profile',
						routing: {
							request: {
								qs: {
									asSelf: '={{$value}}',
								},
							},
						},
					},
					{
						displayName: 'With Groups And Worlds',
						name: 'withGroupsAndWorlds',
						type: 'boolean',
						default: false,
						description:
							'Whether to include groups, publicWorlds, totalPublicWorldsCount and worldFavoriteLists',
						routing: {
							request: {
								qs: {
									withGroupsAndWorlds: '={{$value}}',
								},
							},
						},
					},
				],
			},
			// ── Shared Fields: Notification ─────────────
			{
				displayName: 'Friend Request ID',
				name: 'frqId',
				type: 'string',
				required: true,
				placeholder: 'frq_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx',
				description: 'Friend request ID obtained from notifications',
				displayOptions: {
					show: {
						resource: ['notification'],
						operation: ['acceptFriendRequest'],
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
				displayName: 'Notification ID',
				name: 'notificationId',
				type: 'string',
				required: true,
				placeholder: 'not_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',

				displayOptions: {
					show: {
						resource: ['notification'],
						operation: ['markNotificationAsRead', 'deleteNotification', 'deleteNotificationV2'],
					},
				},
				default: '',
			},
			// ── Shared Fields: World ────────────────────
			{
				displayName: 'World ID',
				name: 'worldId',
				type: 'string',
				required: true,
				placeholder: 'wrld_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
				displayOptions: {
					show: {
						resource: ['world'],
						operation: ['getWorldInfo'],
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
				displayName: 'World Search Parameters',
				name: 'worldSearchParams',
				type: 'collection',
				default: {},
				placeholder: 'Add world search parameters',
				displayOptions: {
					show: {
						resource: ['world'],
						operation: ['searchWorlds', 'getActiveWorlds', 'getFavoritedWorlds'],
					},
				},
				options: [
					{
						displayName: 'Featured Worlds Only',
						name: 'featured',
						type: 'boolean',
						default: false,
						routing: {
							request: {
								qs: {
									featured: '={{$value}}',
								},
							},
						},
					},
					{
						displayName: 'Fuzzy Search',
						name: 'fuzzy',
						type: 'boolean',
						default: false,
						description: 'Whether to use fuzzy search',
						routing: {
							request: {
								qs: {
									fuzzy: '={{$value}}',
								},
							},
						},
					},
					{
						displayName: 'Maximum Unity Version',
						name: 'maxUnityVersion',
						type: 'string',
						default: '',
						placeholder: '2022.3.22f1',
						routing: {
							request: {
								qs: {
									maxUnityVersion: '={{$value}}',
								},
							},
						},
					},
					{
						displayName: 'Minimum Unity Version',
						name: 'minUnityVersion',
						type: 'string',
						default: '',
						placeholder: '2019.4.29f1',
						routing: {
							request: {
								qs: {
									minUnityVersion: '={{$value}}',
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
					{
						displayName: 'Order',
						name: 'order',
						type: 'options',
						default: '',
						options: [
							{
								name: 'Ascending',
								value: 'ascending',
							},
							{
								name: 'Default',
								value: '',
							},
							{
								name: 'Descending',
								value: 'descending',
							},
						],
						routing: {
							request: {
								qs: {
									order: '={{$value}}',
								},
							},
						},
					},
					{
						displayName: 'Platform',
						name: 'platform',
						type: 'options',
						default: '',
						options: [
							{
								name: 'Android',
								value: 'android',
							},
							{
								name: 'Default',
								value: '',
							},
							{
								name: 'Standalone',
								value: 'standalone',
							},
						],
						routing: {
							request: {
								qs: {
									platform: '={{$value}}',
								},
							},
						},
					},
					{
						displayName: 'Release Status',
						name: 'releaseStatus',
						type: 'options',
						default: '',
						options: [
							{
								name: 'All',
								value: 'all',
							},
							{
								name: 'Default',
								value: '',
							},
							{
								name: 'Hidden',
								value: 'hidden',
							},
							{
								name: 'Private',
								value: 'private',
							},
							{
								name: 'Public',
								value: 'public',
							},
						],
						routing: {
							request: {
								qs: {
									releaseStatus: '={{$value}}',
								},
							},
						},
					},
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
						displayName: 'Search Query',
						name: 'search',
						type: 'string',
						default: '',
						description: 'Searches by world name',
						routing: {
							request: {
								qs: {
									search: '={{$value}}',
								},
							},
						},
					},
					{
						displayName: 'Sort',
						name: 'sort',
						type: 'options',
						default: '',
						options: [
							{
								name: 'Created',
								value: 'created',
							},
							{
								name: 'Default',
								value: '',
							},
							{
								name: 'Popularity',
								value: 'popularity',
							},
							{
								name: 'Shuffle',
								value: 'shuffle',
							},
							{
								name: 'Updated',
								value: 'updated',
							},
						],
						routing: {
							request: {
								qs: {
									sort: '={{$value}}',
								},
							},
						},
					},
					{
						displayName: 'Tag',
						name: 'tag',
						type: 'string',
						default: '',
						placeholder: 'author_tag_xxx',
						description: 'Tags to include (comma-separated). Prefix with - to exclude.',
						routing: {
							request: {
								qs: {
									tag: '={{$value}}',
								},
							},
						},
					},
					{
						displayName: 'User (Worlds By User)',
						name: 'user',
						type: 'options',
						default: '',
						description: 'Set to me or friends to filter worlds by the currently logged in user',
						options: [
							{
								name: 'Default',
								value: '',
							},
							{
								name: 'Friends',
								value: 'friends',
							},
							{
								name: 'Me',
								value: 'me',
							},
						],
						routing: {
							request: {
								qs: {
									user: '={{$value}}',
								},
							},
						},
					},
				],
			},
			{
				displayName: 'Additional Info',
				name: 'additionalinfo',
				type: 'collection',
				default: {},
				placeholder: 'Add additional info fields',
				displayOptions: {
					show: {
						resource: ['world'],
						operation: ['getWorldInfo'],
					},
				},
				options: [
					{
						displayName: 'Instance ID',
						name: 'instanceId',
						type: 'string',
						placeholder:
							'12345~hidden(usr_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx)~region(eu)~nonce(xxxxxxxx)',
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
			// ── Shared Fields: List Operations ──────────
			{
				displayName: 'Result Parameters',
				name: 'resultParams',
				type: 'collection',
				default: {},
				placeholder: 'Add result parameters',
				displayOptions: {
					show: {
						resource: ['user', 'notification', 'friend'],
						operation: [
							'searchUsers',
							'getNotifications',
							'getMutualFriends',
							'getFriends',
							'getNotificationV2s',
						],
					},
				},
				options: [
					{
						displayName: 'Include Hidden Notifications',
						name: 'hidden',
						type: 'boolean',
						default: false,
						description:
							'Whether to return hidden notifications. Only allowed with friendRequest type.',
						displayOptions: {
							show: {
								'/resource': ['notification'],
								'/operation': ['getNotifications'],
							},
						},
						routing: {
							request: {
								qs: {
									hidden: '={{$value}}',
								},
							},
						},
					},
					{
						displayName: 'NotificationV2 Limit',
						name: 'limit',
						type: 'string',
						placeholder: '60',
						default: '60',
						displayOptions: {
							show: {
								'/resource': ['notification'],
								'/operation': ['getNotificationV2s'],
							},
						},
						routing: {
							request: {
								qs: {
									limit: '={{$value}}',
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
					{
						displayName: 'Only After Time',
						name: 'after',
						type: 'string',
						placeholder: 'five_minutes_ago',
						description:
							'Only return notifications sent after this date/time. Examples: five_minutes_ago, one_hour_ago.',
						default: '',
						displayOptions: {
							show: {
								'/resource': ['notification'],
								'/operation': ['getNotifications'],
							},
						},
						routing: {
							request: {
								qs: {
									after: '={{$value}}',
								},
							},
						},
					},
					{
						displayName: 'Only Show Offline Friends',
						name: 'offline',
						type: 'boolean',
						default: false,
						displayOptions: {
							show: {
								'/resource': ['friend'],
								'/operation': ['getFriends'],
							},
						},
						routing: {
							request: {
								qs: {
									offline: '={{$value}}',
								},
							},
						},
					},
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
				],
			},
		],
		usableAsTool: true,
	};
}
