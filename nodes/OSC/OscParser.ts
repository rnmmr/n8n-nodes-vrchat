/**
 * Minimal OSC 1.0 protocol encoder/decoder.
 * Only depends on Node.js built-in Buffer.
 *
 * Supported types:
 *   i = int32, f = float32, s = string, b = blob,
 *   T = true, F = false, N = nil, I = infinitum
 */

export interface OscMessage {
	address: string;
	args: OscValue[];
}

export interface OscBundle {
	timetag: number;
	messages: OscMessage[];
}

export type OscValue = number | string | boolean | null | Buffer;

// ── Decoding ──────────────────────────────────────────────

function readString(buf: Buffer, offset: number): [string, number] {
	const end = buf.indexOf(0, offset);
	let str = buf.toString('utf8', offset, end);
	// Decode literal \uXXXX escape sequences (VRChat may send Chinese
	// characters as \uXXXX instead of raw UTF-8 bytes in OSC strings)
	if (str.includes('\\u')) {
		str = str.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
			String.fromCodePoint(parseInt(hex, 16)),
		);
	}
	const next = (end + 4) & ~3; // pad to 4-byte boundary
	return [str, next];
}

function readBlob(buf: Buffer, offset: number): [Buffer, number] {
	const size = buf.readInt32BE(offset);
	const data = buf.slice(offset + 4, offset + 4 + size);
	const next = (offset + 4 + size + 3) & ~3;
	return [data, next];
}

function decodeArgs(buf: Buffer, offset: number, typeTags: string): [OscValue[], number] {
	const args: OscValue[] = [];
	let pos = offset;

	for (const tag of typeTags) {
		switch (tag) {
			case 'i':
				args.push(buf.readInt32BE(pos));
				pos += 4;
				break;
			case 'f':
				args.push(buf.readFloatBE(pos));
				pos += 4;
				break;
			case 's': {
				const [s, next] = readString(buf, pos);
				args.push(s);
				pos = next;
				break;
			}
			case 'b': {
				const [b, next] = readBlob(buf, pos);
				args.push(b);
				pos = next;
				break;
			}
			case 'T':
				args.push(true);
				break;
			case 'F':
				args.push(false);
				break;
			case 'N':
				args.push(null);
				break;
			case 'I':
				args.push(Infinity);
				break;
			default:
				break;
		}
	}
	return [args, pos];
}

export function decodeOscMessage(buf: Buffer, offset = 0): [OscMessage, number] {
	const [address, addrEnd] = readString(buf, offset);
	const [typeTagStr, tagsEnd] = readString(buf, addrEnd);
	const typeTags = typeTagStr.startsWith(',') ? typeTagStr.slice(1) : typeTagStr;
	const [args, end] = decodeArgs(buf, tagsEnd, typeTags);
	return [{ address, args }, end];
}

export function decodeOscBundle(buf: Buffer, offset = 0): OscBundle {
	// skip "#bundle\0"
	let pos = offset + 8;
	const timetag = Number(buf.readBigUInt64BE(pos));
	pos += 8;

	const messages: OscMessage[] = [];
	while (pos < buf.length) {
		const size = buf.readInt32BE(pos);
		pos += 4;
		const element = buf.slice(pos, pos + size);
		if (element[0] === 0x23) {
			// '#' → nested bundle (skip)
		} else {
			const [msg] = decodeOscMessage(element, 0);
			messages.push(msg);
		}
		pos += size;
	}
	return { timetag, messages };
}

export function decodeOscPacket(buf: Buffer): { type: 'message' | 'bundle'; data: OscMessage | OscBundle } {
	if (buf[0] === 0x23) {
		return { type: 'bundle', data: decodeOscBundle(buf) };
	}
	const [msg] = decodeOscMessage(buf);
	return { type: 'message', data: msg };
}

// ── Encoding ──────────────────────────────────────────────

function appendString(list: Buffer[], str: string): void {
	const buf = Buffer.from(str + '\0', 'utf8');
	const padded = Buffer.alloc((buf.length + 3) & ~3);
	buf.copy(padded);
	list.push(padded);
}

export function encodeOscMessage(address: string, args: OscValue[] = []): Buffer {
	const parts: Buffer[] = [];
	appendString(parts, address);

	const typeTagChars: string[] = [','];
	const argBuffers: Buffer[] = [];

	for (const arg of args) {
		if (arg === null) {
			typeTagChars.push('N');
		} else if (typeof arg === 'boolean') {
			typeTagChars.push(arg ? 'T' : 'F');
		} else if (typeof arg === 'number') {
			if (Number.isInteger(arg)) {
				typeTagChars.push('i');
				const buf = Buffer.alloc(4);
				buf.writeInt32BE(arg);
				argBuffers.push(buf);
			} else {
				typeTagChars.push('f');
				const buf = Buffer.alloc(4);
				buf.writeFloatBE(arg);
				argBuffers.push(buf);
			}
		} else if (typeof arg === 'string') {
			typeTagChars.push('s');
			const strBuf: Buffer[] = [];
			appendString(strBuf, arg);
			argBuffers.push(...strBuf);
		} else if (Buffer.isBuffer(arg)) {
			typeTagChars.push('b');
			const buf = Buffer.alloc(4 + ((arg.length + 3) & ~3));
			buf.writeInt32BE(arg.length);
			arg.copy(buf, 4);
			argBuffers.push(buf);
		}
	}

	appendString(parts, typeTagChars.join(''));
	parts.push(...argBuffers);

	return Buffer.concat(parts);
}
