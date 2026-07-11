/* eslint-disable @n8n/community-nodes/require-continue-on-fail */
import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';
import * as dgram from 'dgram';
import { encodeOscMessage, OscValue } from './OscParser';

// VRChat preset addresses
// Input: https://github.com/vrchat-community/osc/blob/main/docs/Input.md
// Chatbox: https://github.com/vrchat-community/osc/blob/main/docs/Chatbox.md
// Avatar: https://github.com/vrchat-community/osc/blob/main/docs/Avatar-Parameters.md
const VRC_PRESETS: Record<string, { address: string; description: string }> = {
	'chatbox-input':        { address: '/chatbox/input',           description: 'Send chatbox message. Value: [string, true]=send, [string, false]=show input UI' },
	'chatbox-typing':       { address: '/chatbox/typing',          description: 'Toggle typing indicator' },
	'input-vertical':       { address: '/input/Vertical',          description: 'Move forward(1)/backward(-1)' },
	'input-horizontal':     { address: '/input/Horizontal',        description: 'Move right(1)/left(-1)' },
	'input-lookhorizontal': { address: '/input/LookHorizontal',    description: 'Look left/right' },
	'input-moveholdfb':     { address: '/input/MoveHoldFB',        description: 'Move held object forward(1)/backward(-1)' },
	'input-spinholdcwcw':   { address: '/input/SpinHoldCwCcw',     description: 'Spin held object CW(1)/CCW(-1)' },
	'input-spinholdud':     { address: '/input/SpinHoldUD',         description: 'Spin held object up(1)/down(-1)' },
	'input-spinholdlr':     { address: '/input/SpinHoldLR',         description: 'Spin held object left(1)/right(-1)' },
	'input-moveforward':    { address: '/input/MoveForward',        description: 'Move forward (press/release)' },
	'input-movebackward':   { address: '/input/MoveBackward',       description: 'Move backward (press/release)' },
	'input-moveleft':       { address: '/input/MoveLeft',           description: 'Strafe left (press/release)' },
	'input-moveright':      { address: '/input/MoveRight',          description: 'Strafe right (press/release)' },
	'input-lookleft':       { address: '/input/LookLeft',           description: 'Turn left (press/release)' },
	'input-lookright':      { address: '/input/LookRight',          description: 'Turn right (press/release)' },
	'input-jump':           { address: '/input/Jump',               description: 'Jump (press/release)' },
	'input-run':            { address: '/input/Run',                description: 'Sprint (press/release)' },
	'input-comfortleft':    { address: '/input/ComfortLeft',        description: 'Snap-turn left, VR only (press/release)' },
	'input-comfortright':   { address: '/input/ComfortRight',       description: 'Snap-turn right, VR only (press/release)' },
	'input-dropright':      { address: '/input/DropRight',          description: 'Drop right hand item, VR only (press/release)' },
	'input-useright':       { address: '/input/UseRight',           description: 'Use right hand highlight (press/release)' },
	'input-grabright':      { address: '/input/GrabRight',          description: 'Grab right hand highlight (press/release)' },
	'input-dropleft':       { address: '/input/DropLeft',           description: 'Drop left hand item, VR only (press/release)' },
	'input-useleft':        { address: '/input/UseLeft',            description: 'Use left hand highlight (press/release)' },
	'input-grableft':       { address: '/input/GrabLeft',           description: 'Grab left hand highlight (press/release)' },
	'input-panicbutton':    { address: '/input/PanicButton',        description: 'Toggle Safe Mode (press/release)' },
	'input-quickmenuleft':  { address: '/input/QuickMenuToggleLeft', description: 'Toggle QuickMenu left (press/release)' },
	'input-quickmenuright': { address: '/input/QuickMenuToggleRight',description: 'Toggle QuickMenu right (press/release)' },
	'input-voice':          { address: '/input/Voice',              description: 'Toggle/Push-to-mute voice (press/release)' },
	'avatar-parameter':     { address: '/avatar/parameters/{name}', description: 'Set an avatar parameter value' },
};

const AXIS_PRESETS = [
	'input-vertical', 'input-horizontal', 'input-lookhorizontal',
	'input-moveholdfb', 'input-spinholdcwcw', 'input-spinholdud', 'input-spinholdlr',
];

const BUTTON_PRESETS = [
	'input-moveforward', 'input-movebackward', 'input-moveleft', 'input-moveright',
	'input-lookleft', 'input-lookright', 'input-jump', 'input-run',
	'input-comfortleft', 'input-comfortright',
	'input-dropright', 'input-useright', 'input-grabright',
	'input-dropleft', 'input-useleft', 'input-grableft',
	'input-panicbutton', 'input-quickmenuleft', 'input-quickmenuright', 'input-voice',
];

export class VrchatOscSend implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'VRChat OSC Send',
		name: 'vrchatOscSend',
		icon: 'file:../../icons/vrchat.svg',
		group: ['transform'],
		version: 1,
		description: 'Sends an OSC (Open Sound Control) message via UDP',
		defaults: {
			name: 'OSC Send',
		},
		subtitle: '={{ $parameter["mode"] === "custom" ? $parameter["address"] : $parameter["preset"] }}',
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		properties: [
			{
				displayName: 'Target Host',
				name: 'host',
				type: 'string',
				default: '127.0.0.1',
				description: 'Target host to send the OSC message to',
			},
			{
				displayName: 'Target Port',
				name: 'port',
				type: 'number',
				default: 9000,
				description: 'Target UDP port. VRChat listens on port 9000 by default.',
				typeOptions: { minValue: 1, maxValue: 65535 },
			},
			{
				displayName: 'Mode',
				name: 'mode',
				type: 'options',
				options: [
					{ name: 'VRChat Preset', value: 'preset', description: 'Use a built-in VRChat OSC address' },
					{ name: 'Custom', value: 'custom', description: 'Specify a custom OSC address and values' },
				],
				default: 'preset',
			},
			// ── Preset Mode ──────────────────────────────
			{
				displayName: 'Action',
				name: 'preset',
				type: 'options',
				displayOptions: { show: { mode: ['preset'] } },
				options: [
					{ name: 'Avatar: Set Parameter', value: 'avatar-parameter', description: 'Send a value to an avatar parameter (/avatar/parameters/{name})' },
					{ name: 'Chatbox: Send Message', value: 'chatbox-input', description: 'Send text to the VRChat chatbox (/chatbox/input)' },
					{ name: 'Chatbox: Typing Indicator', value: 'chatbox-typing', description: 'Toggle the typing indicator (/chatbox/typing)' },
					{ name: 'Input: Comfort Left (VR)', value: 'input-comfortleft' },
					{ name: 'Input: Comfort Right (VR)', value: 'input-comfortright' },
					{ name: 'Input: Drop Left Hand (VR)', value: 'input-dropleft' },
					{ name: 'Input: Drop Right Hand (VR)', value: 'input-dropright' },
					{ name: 'Input: Grab Left Hand', value: 'input-grableft' },
					{ name: 'Input: Grab Right Hand', value: 'input-grabright' },
					{ name: 'Input: Horizontal Movement', value: 'input-horizontal', description: 'Move left/right (/input/Horizontal)' },
					{ name: 'Input: Jump', value: 'input-jump' },
					{ name: 'Input: Look Horizontal', value: 'input-lookhorizontal', description: 'Look left/right (/input/LookHorizontal)' },
					{ name: 'Input: Look Left', value: 'input-lookleft' },
					{ name: 'Input: Look Right', value: 'input-lookright' },
					{ name: 'Input: Move Backward', value: 'input-movebackward' },
					{ name: 'Input: Move Forward', value: 'input-moveforward' },
					{ name: 'Input: Move Held Object FB', value: 'input-moveholdfb', description: 'Move held object forward/back (/input/MoveHoldFB)' },
					{ name: 'Input: Move Left', value: 'input-moveleft' },
					{ name: 'Input: Move Right', value: 'input-moveright' },
					{ name: 'Input: Panic Button', value: 'input-panicbutton' },
					{ name: 'Input: Quick Menu Toggle (Left)', value: 'input-quickmenuleft' },
					{ name: 'Input: Quick Menu Toggle (Right)', value: 'input-quickmenuright' },
					{ name: 'Input: Run', value: 'input-run' },
					{ name: 'Input: Spin Held Object CW/CCW', value: 'input-spinholdcwcw' },
					{ name: 'Input: Spin Held Object Left/Right', value: 'input-spinholdlr' },
					{ name: 'Input: Spin Held Object Up/Down', value: 'input-spinholdud' },
					{ name: 'Input: Use Left Hand', value: 'input-useleft' },
					{ name: 'Input: Use Right Hand', value: 'input-useright' },
					{ name: 'Input: Vertical Movement', value: 'input-vertical', description: 'Move forward/backward (/input/Vertical)' },
					{ name: 'Input: Voice', value: 'input-voice' },
				],
				default: 'chatbox-input',
			},
			// Chatbox input value
			{
				displayName: 'Value',
				name: 'presetValue',
				type: 'string',
				displayOptions: { show: { mode: ['preset'], preset: ['chatbox-input'] } },
				default: '',
				placeholder: 'Hello World!',
				description: 'Text to send to the chatbox',
			},
			{
				displayName: 'Send Directly',
				name: 'chatboxDirect',
				type: 'boolean',
				displayOptions: { show: { mode: ['preset'], preset: ['chatbox-input'] } },
				default: true,
				description: 'Whether to send directly (true) or show the chatbox input UI with text pre-filled (false)',
			},
			// Chatbox typing value
			{
				displayName: 'Value',
				name: 'presetBoolValue',
				type: 'boolean',
				displayOptions: { show: { mode: ['preset'], preset: ['chatbox-typing'] } },
				default: true,
				description: 'Whether to show (true) or hide (false) the typing indicator',
			},
			// Axis float value
			{
				displayName: 'Value',
				name: 'presetFloatValue',
				type: 'number',
				typeOptions: { minValue: -1, maxValue: 1, numberPrecision: 2 },
				displayOptions: { show: { mode: ['preset'], preset: AXIS_PRESETS } },
				default: 0,
				description: 'Float value from -1 to 1. Reset to 0 when not in use.',
			},
			// Button press/release value
			{
				displayName: 'Value',
				name: 'presetButtonValue',
				type: 'options',
				displayOptions: { show: { mode: ['preset'], preset: BUTTON_PRESETS } },
				options: [
					{ name: 'Press (1)', value: 1 },
					{ name: 'Release (0)', value: 0 },
				],
				default: 1,
				description: 'Button state: 1 = press, 0 = release. Must release before pressing again.',
			},
			// Avatar parameter name + value
			{
				displayName: 'Parameter Name',
				name: 'paramName',
				type: 'string',
				displayOptions: { show: { mode: ['preset'], preset: ['avatar-parameter'] } },
				default: '',
				placeholder: 'VRCEmote',
				description: 'Name of the avatar parameter to set',
			},
			{
				displayName: 'Value',
				name: 'presetParamValue',
				type: 'string',
				displayOptions: { show: { mode: ['preset'], preset: ['avatar-parameter'] } },
				default: '',
				placeholder: '1',
				description: 'Value to set. Numbers → int/float, true/false → boolean, text → string.',
			},
			// ── Custom Mode ──────────────────────────────
			{
				displayName: 'Address',
				name: 'address',
				type: 'string',
				displayOptions: { show: { mode: ['custom'] } },
				default: '/avatar/parameters/',
				placeholder: '/avatar/parameters/MyParameter',
				description: 'OSC address pattern',
			},
			{
				displayName: 'Values',
				name: 'values',
				type: 'json',
				displayOptions: { show: { mode: ['custom'] } },
				default: '[]',
				description:
					'JSON array of values to send. Numbers → int32/float32, booleans → T/F, null → N, strings → string. Example: [1, 2.5, "hello", true]',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const results: INodeExecutionData[] = [];

		const socket = dgram.createSocket('udp4');

		try {
			for (let i = 0; i < items.length; i++) {
				const host = this.getNodeParameter('host', i) as string;
				const port = this.getNodeParameter('port', i) as number;
				const mode = this.getNodeParameter('mode', i) as string;

				let address: string;
				let values: OscValue[];

				if (mode === 'preset') {
					const presetKey = this.getNodeParameter('preset', i) as string;
					const preset = VRC_PRESETS[presetKey];
					if (!preset) {
						throw new NodeOperationError(this.getNode(), `Unknown preset: ${presetKey}`, { itemIndex: i });
					}

					if (presetKey === 'chatbox-input') {
						const text = this.getNodeParameter('presetValue', i) as string;
						const direct = this.getNodeParameter('chatboxDirect', i) as boolean;
						address = preset.address;
						values = [text, direct];
					} else if (presetKey === 'chatbox-typing') {
						address = preset.address;
						values = [this.getNodeParameter('presetBoolValue', i) as boolean];
					} else if (presetKey === 'avatar-parameter') {
						const paramName = this.getNodeParameter('paramName', i) as string;
						if (!paramName) {
							throw new NodeOperationError(this.getNode(), 'Parameter name is required', { itemIndex: i });
						}
						address = `/avatar/parameters/${paramName}`;
						const raw = this.getNodeParameter('presetParamValue', i) as string;
						values = [parseValue(raw)];
					} else if (AXIS_PRESETS.includes(presetKey)) {
						address = preset.address;
						values = [this.getNodeParameter('presetFloatValue', i) as number];
					} else if (BUTTON_PRESETS.includes(presetKey)) {
						address = preset.address;
						values = [this.getNodeParameter('presetButtonValue', i) as number];
					} else {
						address = preset.address;
						values = [];
					}
				} else {
					// custom mode
					address = this.getNodeParameter('address', i) as string;
					const rawValues = this.getNodeParameter('values', i) as string;
					try {
						const parsed = JSON.parse(rawValues);
						values = Array.isArray(parsed) ? parsed : [parsed];
					} catch {
						throw new NodeOperationError(
							this.getNode(),
							`Invalid JSON for values: ${rawValues}`,
							{ itemIndex: i },
						);
					}
				}

				const msg = encodeOscMessage(address, values);

				await new Promise<void>((resolve, reject) => {
					socket.send(msg, 0, msg.length, port, host, (err) => {
						if (err) reject(err);
						else resolve();
					});
				});

				results.push({
					json: {
						sent: true,
						address,
						args: values,
						target: { host, port },
						timestamp: Date.now(),
					},
					pairedItem: { item: i },
				});
			}
		} finally {
			socket.close();
		}

		return [results];
	}
}

/** Parse a user-entered value string into an appropriate OSC type */
function parseValue(raw: string): OscValue {
	if (raw === 'true') return true;
	if (raw === 'false') return false;
	if (raw === 'null') return null;
	const num = Number(raw);
	if (!isNaN(num) && raw.trim() !== '') return num;
	return raw;
}
