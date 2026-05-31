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
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
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
			// ── Resource ──────────────────────────────
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
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
						description: 'Update the current user\'s info',
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
					},
					{
						name: 'Get User Info',
						value: 'getUserInfo',
						action: 'Get info about a specific user',
						description: 'Get info about a specific user',
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
				],
				default: 'getWorldInfo',
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
						resource: ['user'],
						operation: ['getUserInfo', 'getMutualFriends'],
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
						placeholder: '12345~hidden(usr_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx)~region(eu)~nonce(xxxxxxxx)',
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
						resource: ['user', 'notification'],
						operation: ['searchUsers', 'getNotifications', 'getMutualFriends'],
					},
				},
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
