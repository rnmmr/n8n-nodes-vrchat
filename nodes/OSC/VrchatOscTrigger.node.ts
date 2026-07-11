/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import {
	ITriggerFunctions,
	INodeType,
	INodeTypeDescription,
	ITriggerResponse,
	INodeExecutionData,
} from 'n8n-workflow';
import * as dgram from 'dgram';
import { decodeOscPacket, OscBundle, OscMessage } from './OscParser';

export class VrchatOscTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'VRChat OSC Trigger',
		name: 'vrchatOscTrigger',
		icon: 'file:../../icons/vrchat.svg',
		group: ['trigger'],
		version: 1,
		description: 'Listens for incoming OSC (Open Sound Control) messages via UDP',
		defaults: {
			name: 'OSC Trigger',
		},
		subtitle: '=Port {{$parameter["port"]}}',
		inputs: [],
		outputs: ['main'],
		usableAsTool: true,
		properties: [
			{
				displayName: 'Listen Port',
				name: 'port',
				type: 'number',
				default: 9001,
				description: 'UDP port to listen on. VRChat sends OSC output on port 9001 by default.',
				typeOptions: {
					minValue: 1,
					maxValue: 65535,
				},
			},
			{
				displayName: 'Filter Mode',
				name: 'filterMode',
				type: 'options',
				options: [
					{
						name: 'All Messages',
						value: 'all',
						description: 'Emit all incoming OSC messages regardless of address',
					},
					{
						name: 'Avatar Change',
						value: 'avatar-change',
						description: 'Only emit when the local player changes avatar (/avatar/change)',
					},
					{
						name: 'Avatar Parameters',
						value: 'avatar-parameters',
						description: 'Only emit avatar parameter updates (/avatar/parameters/*)',
					},
					{
						name: 'Custom Address',
						value: 'custom',
						description: 'Match a custom address pattern with wildcard support',
					},
				],
				default: 'all',
			},
			{
				displayName: 'Parameter Filter',
				name: 'paramFilter',
				type: 'string',
				displayOptions: { show: { filterMode: ['avatar-parameters'] } },
				default: '*',
				placeholder: '*',
				description: 'Filter avatar parameters by name. Supports * wildcard: * = all, VRCEmote = exact match, Fiona* = starts with, *Emote = ends with, *Face* = contains.',
			},
			{
				displayName: 'Address Pattern',
				name: 'addressFilter',
				type: 'string',
				displayOptions: { show: { filterMode: ['custom'] } },
				default: '/avatar/parameters/*',
				placeholder: '/avatar/parameters/*',
				description: 'OSC address pattern to match. Supports * wildcard anywhere. Examples: /avatar/parameters/Fiona*, /chatbox/input, /avatar/parameters/*Face*',
			},
			// ── Forwarding Options ──────────────────────
			{
				displayName: 'Enable Forwarding',
				name: 'enableForward',
				type: 'boolean',
				default: false,
				// eslint-disable-next-line n8n-nodes-base/node-param-description-boolean-without-whether
				description: 'Forward incoming OSC messages to another host/port, allowing multiple consumers to share the same VRChat OSC data',
			},
			{
				displayName: 'Forward Target Host',
				name: 'forwardHost',
				type: 'string',
				default: '127.0.0.1',
				displayOptions: { show: { enableForward: [true] } },
				description: 'Target host to forward OSC messages to',
			},
			{
				displayName: 'Forward Target Port',
				name: 'forwardPort',
				type: 'number',
				default: 9002,
				displayOptions: { show: { enableForward: [true] } },
				description: 'Target UDP port to forward OSC messages to',
				typeOptions: {
					minValue: 1,
					maxValue: 65535,
				},
			},
			{
				displayName: 'Forward Mode',
				name: 'forwardMode',
				type: 'options',
				displayOptions: { show: { enableForward: [true] } },
				options: [
					{
						name: 'Forward All',
						value: 'all',
						description: 'Forward all raw incoming messages regardless of filter',
					},
					{
						name: 'Forward Filtered',
						value: 'filtered',
						description: 'Only forward messages that pass the filter above',
					},
				],
				default: 'all',
			},
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const port = this.getNodeParameter('port') as number;
		const filterMode = this.getNodeParameter('filterMode') as string;
		const enableForward = this.getNodeParameter('enableForward') as boolean;
		const forwardHost = this.getNodeParameter('forwardHost', '127.0.0.1') as string;
		const forwardPort = this.getNodeParameter('forwardPort', 9002) as number;
		const forwardMode = this.getNodeParameter('forwardMode', 'all') as string;

		// Build address filter based on mode
		let addressFilter = '';
		let matchExact = '';


		
		if (filterMode === 'avatar-change') {
			matchExact = '/avatar/change';
		} else if (filterMode === 'avatar-parameters') {
			const paramFilter = (this.getNodeParameter('paramFilter') as string) || '*';
			addressFilter = `/avatar/parameters/${paramFilter}`;
		} else if (filterMode === 'custom') {
			addressFilter = (this.getNodeParameter('addressFilter') as string) || '';
		}

		const matchesFilter = (addr: string): boolean => {
			if (filterMode === 'all') return true;
			if (matchExact) return addr === matchExact;
			if (addressFilter) {
				const pattern = addressFilter.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
				return new RegExp(`^${pattern}$`).test(addr);
			}
			return true;
		};

		// Forwarding socket (only created if forwarding is enabled)
		const forwardSocket = enableForward ? dgram.createSocket('udp4') : null;

		const server = dgram.createSocket('udp4');

		server.on('message', (msg: Buffer, rinfo: dgram.RemoteInfo) => {
			try {
				const packet = decodeOscPacket(msg);

				const emitMessage = (oscMsg: OscMessage) => {
					const passesFilter = matchesFilter(oscMsg.address);

					// Emit to n8n workflow
					if (passesFilter) {
						const item: INodeExecutionData = {
							json: {
								address: oscMsg.address,
								args: oscMsg.args.map((a) =>
									Buffer.isBuffer(a) ? a.toString('base64') : a,
								),
								timestamp: Date.now(),
								source: {
									address: rinfo.address,
									port: rinfo.port,
								},
							},
						};
						this.emit([[item]]);
					}

					// Forward raw packet to target
					if (forwardSocket && enableForward) {
						if (forwardMode === 'all' || passesFilter) {
							forwardSocket.send(msg, 0, msg.length, forwardPort, forwardHost, (err) => {
								if (err) {
									this.logger.warn(`Forward failed: ${(err as Error).message}`);
								}
							});
						}
					}
				};

				if (packet.type === 'bundle') {
					const bundle = packet.data as OscBundle;
					for (const m of bundle.messages) emitMessage(m);
				} else {
					emitMessage(packet.data as OscMessage);
				}
			} catch (error) {
				this.logger.warn(`Failed to parse OSC packet: ${(error as Error).message}`);
			}
		});

		server.on('error', (error: Error) => {
			this.logger.error(`OSC UDP error: ${error.message}`);
			this.emitError(error);
		});

		server.on('listening', () => {
			const addr = server.address();
			this.logger.debug(`OSC Trigger listening on UDP ${addr.address}:${addr.port}`);
			if (enableForward) {
				this.logger.debug(`Forwarding OSC messages to ${forwardHost}:${forwardPort}`);
			}
		});

		server.bind(port);

		return {
			closeFunction: async () => {
				server.close();
				if (forwardSocket) {
					forwardSocket.close();
				}
			},
		};
	}
}
