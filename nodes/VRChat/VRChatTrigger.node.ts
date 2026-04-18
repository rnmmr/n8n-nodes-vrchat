/* eslint-disable n8n-nodes-base/node-filename-against-convention */
/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { ITriggerFunctions, INodeType, INodeTypeDescription, ITriggerResponse, NodeOperationError } from 'n8n-workflow';

import WebSocket from 'ws';
import { setTimeout as nodeSetTimeout, clearTimeout as nodeClearTimeout } from 'timers';

export class VRChatTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'VRChat Trigger',
		name: 'vrchatTrigger',
		icon: 'file:../../icons/vrchat.svg',
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
				name: 'VRChatApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Trigger Events',
				name: 'wsevent',
				type: 'multiOptions',
				description: 'Note: Avatar changes also trigger friend-location events, and model information is not included in the data',
				options: [
					{ name: 'Friend Location/Avatar Change', value: 'friend-location' },
					{ name: 'Friend Offline', value: 'friend-offline' },
					{ name: 'Friend Online', value: 'friend-online' },
					{ name: 'Friend Update', value: 'friend-update' },
					{ name: 'Notification Received', value: 'notification' },
					{ name: 'Other', value: 'other' },
					{ name: 'User Location Change', value: 'user-location' },
					{ name: 'User Update', value: 'user-update' },
				],
				default: [],
			},
			{
				displayName: 'Auto Reconnect',
				name: 'autoReconnect',
				type: 'boolean',
				default: true,
				description: 'Whether to automatically attempt to reconnect when the WebSocket closes unexpectedly',
			},
		],
		usableAsTool: true,
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const credentials = await this.getCredentials('VRChatApi') as { authcookie?: string };
		const cookieValue = credentials.authcookie ? String(credentials.authcookie) : '';
		
		// 检测 cookie 格式
		const cookieRegex = /^authcookie_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		if (!cookieValue) {
			throw new NodeOperationError(this.getNode(), 'Missing authentication cookie');
		}
		if (!cookieRegex.test(cookieValue)) {
			throw new NodeOperationError(this.getNode(), 'Invalid cookie format. Expected: authcookie_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
		}
		
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
			ws = new WebSocket('wss://pipeline.vrchat.cloud/?authToken=' + cookieValue, {
				headers: {
					'User-Agent': 'n8n-nodes-vrchat/1.0.1',
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

				if (!isStopping && !autoReconnect) {
					this.emitError(error as Error); // 只有在不自动重连时才爆掉 workflow
				}
			});

			ws.on('close', (code, reason) => {
				this.logger.debug(`VRChat WebSocket closed (${code}) ${reason?.toString()}`);

				if (!isStopping) {
					// 只有在不自动重连时才爆掉 workflow
					if (!autoReconnect) {
						this.emitError(new Error(`WebSocket closed unexpectedly (${code})`));
					}

					// 如果允许自动重连
					if (autoReconnect) scheduleReconnect();
				}
			});
		};

		const scheduleReconnect = () => {
			if (isStopping || reconnectTimer) return;

			const delay = Math.min(reconnectDelay, 30_000);
			this.logger.debug(`Reconnecting in ${delay / 1000}s...`);
			reconnectTimer = nodeSetTimeout(() => {
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
				if (reconnectTimer) nodeClearTimeout(reconnectTimer);
				if (ws) {
					ws.removeAllListeners();
					ws.close();
				}
			},
		};
	}
}
