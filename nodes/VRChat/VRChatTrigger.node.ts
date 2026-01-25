import { ITriggerFunctions, INodeType, INodeTypeDescription, ITriggerResponse } from 'n8n-workflow';

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
		subtitle: '={{$parameter["wsevent"].toString()}}',
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
				type: 'multiOptions',
				description: '不知道为什么换模也是 friend-location 事件，而且发来的数据里面也没有模型信息',
				options: [
					{ name: '好友上线', value: 'friend-online' },
					{ name: '好友下线', value: 'friend-offline' },
					{ name: '好友换房/换模', value: 'friend-location' },
					{ name: '好友信息变化', value: 'friend-update' },
					{ name: '自己信息变化', value: 'user-update' },
					{ name: '自己换房', value: 'user-location' },
					{ name: '收到通知', value: 'notification' },
					{ name: '其他', value: 'other' },
				],
				default: [],
			},
			{
				displayName: '自动重连',
				name: 'autoReconnect',
				type: 'boolean',
				default: true,
				description: '当 WebSocket 异常关闭时是否自动尝试重连',
			},
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const credentials = await this.getCredentials('VRChatAPI');
		const cookieValue = credentials.authcookie ? String((credentials as any).authcookie) : '';
		const autoReconnect = this.getNodeParameter('autoReconnect') as boolean;
		const rawWsevent = this.getNodeParameter('wsevent') as unknown;
		const wsevent = Array.isArray(rawWsevent)
			? (rawWsevent as string[])
			: rawWsevent
				? [String(rawWsevent)]
				: [];
		this.logger.debug(wsevent.length ? wsevent.toString() : 'No event filter set');

		let ws: WebSocket | undefined;
		let reconnectDelay = 2000; // 初始 2s
		let reconnectTimer: NodeJS.Timeout | undefined;
		let isStopping = false;

		const connect = () => {
			if (isStopping) return;

			this.logger.debug('Connecting VRChat WebSocket...');
			ws = new WebSocket('wss://pipeline.vrchat.cloud/?' + cookieValue, {
				headers: {
					Cookie: cookieValue,
					'User-Agent': 'n8n-nodes-vrchat',
				},
			});

			ws.on('open', () => {
				this.logger.debug('VRChat WebSocket connected');
				reconnectDelay = 2000; // reset backoff
			});

			ws.on('message', (data) => {
				try {
					const message = JSON.parse(data.toString());
					this.logger.debug('Received VRChat WS message', { message });
					if (wsevent.length === 0 || wsevent.includes('all') || wsevent.includes(message.type)) {
						this.emit([
							this.helpers.returnJsonArray({
								event: message.type ?? 'unknown',
								content: JSON.parse(message.content ?? '{}'),
								timestamp: Date.now(),
							}),
						]);
					}
				} catch (error) {
					this.logger.warn('Failed to parse VRChat WS message');
					this.emit([
						this.helpers.returnJsonArray({
							event: 'error',
							content: { error: (error as Error).message },
							timestamp: Date.now(),
						}),
					]);
				}
			});

			ws.on('error', (error) => {
				this.logger.error('VRChat WebSocket error', { message: (error as Error).message });

				if (!isStopping) {
					this.emitError(error as Error); // 爆掉 workflow
				}
			});

			ws.on('close', (code, reason) => {
				this.logger.warn(`VRChat WebSocket closed (${code}) ${reason?.toString()}`);

				if (!isStopping) {
					// 爆掉 workflow
					this.emitError(new Error(`WebSocket closed unexpectedly (${code})`));

					// 如果允许自动重连
					if (autoReconnect) scheduleReconnect();
				}
			});
		};

		const scheduleReconnect = () => {
			if (isStopping || reconnectTimer) return;

			const delay = Math.min(reconnectDelay, 30_000);
			this.logger.debug(`Reconnecting in ${delay / 1000}s...`);
			reconnectTimer = setTimeout(() => {
				reconnectTimer = undefined;
				reconnectDelay *= 2;
				connect();
			}, delay);
		};

		// 初次连接
		connect();

		return {
			closeFunction: async () => {
				isStopping = true;
				if (reconnectTimer) clearTimeout(reconnectTimer);
				if (ws) {
					ws.removeAllListeners();
					ws.close();
				}
			},
		};
	}
}
