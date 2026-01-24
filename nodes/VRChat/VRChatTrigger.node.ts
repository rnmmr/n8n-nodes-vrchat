import {
	ITriggerFunctions,
	INodeType,
	INodeTypeDescription,
	ITriggerResponse,
} from 'n8n-workflow';

import WebSocket from 'ws';

export class VRChatTrigger implements INodeType {

	description: INodeTypeDescription = {
		displayName: 'VRChat Trigger',
		name: 'VrchatTrigger',
		icon: 'file:vrchat-app.svg',
		group: ['trigger'],
		version: 1,
		description: 'Triggers on VRChat events via WebSocket',
		defaults: {
			name: 'VRChat Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'VRChatAPI',
				required: true,
			},
		],
		properties: [
            {
				displayName: '触发事件',
				name: 'wsevent',
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
					// {
					// 	name: '群组管理',
					// 	value: '群组管理',
					// },
				],
				default: '获取本人信息',
			},
        ],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {

		const credentials = await this.getCredentials('VRChatAPI');

		const cookieValue = credentials.authcookie ? String((credentials as any).authcookie) : '';

        this.logger.debug('wss://pipeline.vrchat.cloud/?'+cookieValue);
		const ws = new WebSocket('wss://pipeline.vrchat.cloud/?'+cookieValue, {
			headers: {
				Cookie: cookieValue,
				'User-Agent': 'n8n-nodes-vrchat',
			},
		});

		ws.on('open', () => {
			this.logger.info('VRChat WebSocket connected');
		});

		ws.on('message', (data) => {
			try {
				const message = JSON.parse(data.toString());
                this.logger.debug('Received VRChat WS message', { message });
				// 这里就是 Trigger 触发点
				this.emit([
					this.helpers.returnJsonArray(
                        {
						    event: message.type ?? 'unknown',
						    content: JSON.parse(message.content) ?? message.content,
						    timestamp: Date.now(),
					    }
                    ),
				]);
			} catch (error) {
				this.logger.warn('Failed to parse VRChat WS message');
                this.emit([
					this.helpers.returnJsonArray(
                        {
						    event: 'error',
                            content: { error: (error as Error).message },
                            timestamp: Date.now(),
					    }
                    ),
				]);
			}
		});

		ws.on('error', (error) => {
			this.logger.error('VRChat WebSocket error', {
				message: (error as Error).message,
			});
            this.emit([
				this.helpers.returnJsonArray(
                    {
					    event: 'error',
                        content: { error: (error as Error).message },
                        timestamp: Date.now(),
				    }
                ),
			]);
		});

		ws.on('close', () => {
			this.logger.info('VRChat WebSocket closed');
            this.emit([
					this.helpers.returnJsonArray(
                        {
						    event: 'wsclosw',
                            content: {message: 'WebSocket connection closed'},
                            timestamp: Date.now(),
					    }
                    ),
				]);
		});

		return {
			closeFunction: async () => {
				ws.removeAllListeners();
				ws.close();
			},
		};
	}
}
