/* eslint-disable n8n-nodes-base/node-filename-against-convention */
/* eslint-disable @n8n/community-nodes/node-filename-against-convention */
/* eslint-disable @n8n/community-nodes/require-continue-on-fail */
import {
    INodeType,
    INodeTypeDescription,
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties,
    IDataObject,
    NodeConnectionTypes,
    NodeOperationError,
} from 'n8n-workflow';
import * as fs from 'fs';
import * as path from 'path';

// ==================== Log Parser ====================

interface PlayerInfo {
    displayName: string;
    userId: string;
    joinedAt: string;
}

interface VideoInfo {
    url: string;
    name: string;
    displayName: string;
    timestamp: string;
}

interface RoomState {
    location: string;
    worldName: string;
    joinedAt: string;
    players: Map<string, PlayerInfo>;
    currentVideo: VideoInfo | null;
    videoHistory: VideoInfo[];
    activityLog: Array<{
        type: 'joined' | 'left';
        displayName: string;
        userId: string;
        timestamp: string;
    }>;
}

function parseTimestamp(line: string): string {
    const match = line.match(/^(\d{4}\.\d{2}\.\d{2}) (\d{2}:\d{2}:\d{2})/);
    if (!match) return new Date().toISOString();
    const [y, m, d] = match[1].split('.');
    return new Date(`${y}-${m}-${d}T${match[2]}`).toISOString();
}

function parseUserInfo(str: string): { displayName: string; userId: string } {
    const match = str.match(/^(.+?)\s*\((usr_[a-f0-9-]+)\)\s*$/);
    if (match) return { displayName: match[1].trim(), userId: match[2] };
    return { displayName: str.trim(), userId: '' };
}

/**
 * Read from the tail of the log file, find the most recent room join event,
 * and return everything from that point onward.
 *
 * Strategy: start with 64KB from the end, search backwards for the last
 * `Joining` event. If not found (unlikely for normal gameplay), double
 * the chunk size up to 2MB. Falls back to full file read if still not found.
 */
function readTailFromLastJoining(filePath: string): string {
    const MAX_CHUNK = 2 * 1024 * 1024;
    let chunkSize = 64 * 1024;

    try {
        const stats = fs.statSync(filePath);
        const fileSize = stats.size;

        while (chunkSize <= MAX_CHUNK) {
            const readSize = Math.min(chunkSize, fileSize);
            const buf = Buffer.alloc(readSize);
            const fd = fs.openSync(filePath, 'r');
            try {
                fs.readSync(fd, buf, 0, readSize, fileSize - readSize);
            } finally {
                fs.closeSync(fd);
            }

            let content = buf.toString('utf-8');

            // Skip first (possibly partial) line — synchronize to \n boundary
            const firstNewline = content.indexOf('\n');
            if (firstNewline >= 0) {
                content = content.substring(firstNewline + 1);
            }

            const lines = content.split('\n');
            let lastJoinIdx = -1;

            for (let i = 0; i < lines.length; i++) {
                const trimmed = lines[i].trim();
                if (trimmed.length < 35) continue;
                const body = trimmed.substring(34);
                if (body.includes('[Behaviour] Joining ') &&
                    !body.includes('Joining or Creating Room') &&
                    !body.includes('Joining friend')) {
                    lastJoinIdx = i;
                }
            }

            if (lastJoinIdx >= 0) {
                return lines.slice(lastJoinIdx).join('\n');
            }

            if (readSize >= fileSize) break;
            chunkSize *= 2;
        }
    } catch {
        // fall through
    }

    // Fallback: full file read
    try {
        return fs.readFileSync(filePath, 'utf-8');
    } catch {
        return '';
    }
}

function analyzeLogFile(filePath: string): RoomState {
    const state: RoomState = {
        location: '',
        worldName: '',
        joinedAt: '',
        players: new Map(),
        currentVideo: null,
        videoHistory: [],
        activityLog: [],
    };

    const content = readTailFromLastJoining(filePath);
    const lines = content.split('\n');

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (line.length < 35) continue;

        const timestamp = parseTimestamp(line);
        const body = line.substring(34);

        // Entering Room (world name)
        if (body.includes('[Behaviour] Entering Room: ')) {
            const idx = body.lastIndexOf('Entering Room: ');
            if (idx >= 0) {
                state.worldName = body.substring(idx + 15).trim();
            }
        }

        // Joining (location) — clear player list
        if (body.includes('[Behaviour] Joining ') &&
            !body.includes('Joining or Creating Room') &&
            !body.includes('Joining friend')) {
            const idx = body.lastIndexOf('] Joining ');
            if (idx >= 0) {
                state.location = body.substring(idx + 10).replace(/\//g, '').trim();
                state.joinedAt = timestamp;
                state.players.clear();
                state.currentVideo = null;
            }
        }

        // Player Joined
        if (body.includes('OnPlayerJoined') && !body.includes('OnPlayerJoined:')) {
            const idx = body.lastIndexOf('OnPlayerJoined');
            if (idx >= 0) {
                const info = parseUserInfo(body.substring(idx + 15));
                if ((info.displayName || info.userId) && !info.displayName.startsWith('/ player=')) {
                    state.players.set(info.displayName, {
                        ...info,
                        joinedAt: timestamp,
                    });
                    state.activityLog.push({
                        type: 'joined',
                        displayName: info.displayName,
                        userId: info.userId,
                        timestamp,
                    });
                }
            }
        }

        // Player Left
        if (body.includes('OnPlayerLeft') &&
            !body.includes('OnPlayerLeftRoom') &&
            !body.includes('OnPlayerLeft:')) {
            const idx = body.lastIndexOf('OnPlayerLeft');
            if (idx >= 0) {
                const info = parseUserInfo(body.substring(idx + 13));
                if (!info.displayName.startsWith('/ player=')) {
                    state.players.delete(info.displayName);
                    state.activityLog.push({
                        type: 'left',
                        displayName: info.displayName,
                        userId: info.userId,
                        timestamp,
                    });
                }
            }
        }

        // Video Play — modern VRChat format (v1.2.0+)
        //   [AVProVideo] Opening https://... (offset 0) with API MediaFoundation
        if (body.includes('[AVProVideo] Opening ')) {
            const urlMatch = body.match(/Opening\s+(\S+)/);
            if (urlMatch && urlMatch[1].length > 3) {
                const cleanUrl = urlMatch[1].replace(/^["']|["']$/g, '');
                const video: VideoInfo = {
                    url: cleanUrl,
                    name: '',
                    displayName: '',
                    timestamp,
                };
                state.currentVideo = video;
                state.videoHistory.push(video);
            }
        }

        // [Video Playback] URL '...' resolved to '...'  (fallback for resolved URLs)
        if (body.includes("[Video Playback] URL '") && body.includes("' resolved to '")) {
            const match = body.match(/'([^']+)'\s+resolved to\s+'([^']+)'/);
            if (match && !state.currentVideo?.url) {
                const video: VideoInfo = {
                    url: match[2],
                    name: '',
                    displayName: '',
                    timestamp,
                };
                state.currentVideo = video;
                state.videoHistory.push(video);
            }
        }

        // Legacy format (pre-v1.2.0): [Video Playback] URL:https://... DisplayName:xxx VideoName:xxx
        if (body.includes('[Video Playback] URL:')) {
            const urlMatch = body.match(/URL:(\S+)/);
            if (urlMatch && urlMatch[1].length > 3 && !state.currentVideo?.url) {
                const cleanUrl = urlMatch[1].replace(/^["']|["']$/g, '');
                const nameMatch = body.match(/VideoName:(.+?)(?:\]|\s+\[|$)/);
                const displayMatch = body.match(/DisplayName:(.+?)(?:\s+VideoName:|\]|$)/);
                const video: VideoInfo = {
                    url: cleanUrl,
                    name: nameMatch?.[1]?.trim() || '',
                    displayName: displayMatch?.[1]?.trim() || '',
                    timestamp,
                };
                state.currentVideo = video;
                state.videoHistory.push(video);
            }
        }
    }

    return state;
}

// ==================== Node ====================

export class VRChatLogAnalyzer implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'VRChat Log Analyzer',
        name: 'vrchatLogAnalyzer',
        icon: 'file:../../icons/vrchat.svg',
        group: ['transform'],
        version: 1,
        subtitle: '={{$parameter["output"]}}',
        description: 'Analyze VRChat log file to get current room state, player list, and video info.',
        defaults: { name: 'VRChat Log Analyzer' },
        inputs: [NodeConnectionTypes.Main],
        outputs: [NodeConnectionTypes.Main],
        credentials: [
            { name: 'vRChatApi', required: false },
        ],
        properties: [
            {
                displayName: 'Output',
                name: 'output',
                type: 'options',
                options: [
                    { name: 'Activity Log', value: 'activity' },
                    { name: 'Current Video', value: 'video' },
                    { name: 'Full Snapshot', value: 'snapshot' },
                    { name: 'Player List', value: 'players' },
                    { name: 'Room Info', value: 'room' },
                    { name: 'Unique Players (Historical)', value: 'uniquePlayers' },
                ],
                default: 'snapshot',
                description: 'What data to output',
            },
        ] as INodeProperties[],
		usableAsTool: true,
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const output = this.getNodeParameter('output', 0, 'snapshot') as string;

        // Resolve log directory: credential → auto-detect
        let logDir = '';
        try {
            const creds = await this.getCredentials('vRChatApi');
            logDir = ((creds?.logDirectory as string) || '').trim();
        } catch {
            // credential not configured, fall through
        }
        if (!logDir) {
            const userProfile = process.env.USERPROFILE || '';
            logDir = path.join(userProfile, 'AppData', 'LocalLow', 'VRChat', 'VRChat');
        }

        if (!fs.existsSync(logDir)) {
            throw new NodeOperationError(this.getNode(), `VRChat log directory not found: ${logDir}`);
        }

        // Find latest log file
        const files = fs.readdirSync(logDir)
            .filter(f => f.startsWith('output_log') && f.endsWith('.txt'))
            .sort()
            .reverse();

        if (files.length === 0) {
            throw new NodeOperationError(this.getNode(), 'No VRChat log files found');
        }

        const logFile = path.join(logDir, files[0]);
        const state = analyzeLogFile(logFile);

        let result: IDataObject;

        switch (output) {
            case 'players':
                result = {
                    players: Array.from(state.players.values()),
                    playerCount: state.players.size,
                    location: state.location,
                    worldName: state.worldName,
                };
                break;
            case 'video':
                result = {
                    currentVideo: state.currentVideo || {},
                    videoHistory: state.videoHistory.slice(-10),
                    location: state.location,
                };
                break;
            case 'room':
                result = {
                    location: state.location,
                    worldName: state.worldName,
                    joinedAt: state.joinedAt,
                    playerCount: state.players.size,
                    hasVideo: !!state.currentVideo,
                };
                break;
            case 'activity':
                result = {
                    activityLog: state.activityLog.slice(-100),
                    totalEvents: state.activityLog.length,
                    location: state.location,
                    worldName: state.worldName,
                };
                break;
            case 'uniquePlayers':
                {
                    const uniqueSet = new Map<string, { displayName: string; userId: string }>();
                    for (const entry of state.activityLog) {
                        if (entry.type === 'joined') {
                            uniqueSet.set(entry.displayName, {
                                displayName: entry.displayName,
                                userId: entry.userId,
                            });
                        }
                    }
                    result = {
                        players: Array.from(uniqueSet.values()),
                        playerCount: uniqueSet.size,
                        location: state.location,
                        worldName: state.worldName,
                    };
                }
                break;
            default: // snapshot
                result = {
                    location: state.location,
                    worldName: state.worldName,
                    joinedAt: state.joinedAt,
                    players: Array.from(state.players.values()),
                    playerCount: state.players.size,
                    currentVideo: state.currentVideo || null,
                    videoHistory: state.videoHistory.slice(-10),
                    activityLog: state.activityLog.slice(-100),
                    logFile: files[0],
                };
        }

        return [this.helpers.returnJsonArray([result])];
    }
}
