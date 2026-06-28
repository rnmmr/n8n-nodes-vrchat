/* eslint-disable n8n-nodes-base/node-filename-against-convention */
import {
    INodeType,
    INodeTypeDescription,
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties,
    IDataObject,
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

function analyzeLogFile(filePath: string): RoomState {
    const state: RoomState = {
        location: '',
        worldName: '',
        joinedAt: '',
        players: new Map(),
        currentVideo: null,
        videoHistory: [],
    };

    const content = fs.readFileSync(filePath, 'utf-8');
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
                if (info.displayName || info.userId) {
                    state.players.set(info.displayName, {
                        ...info,
                        joinedAt: timestamp,
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
                state.players.delete(info.displayName);
            }
        }

        // Video Play
        // [Video Playback] URL:https://... DisplayName:xxx VideoName:xxx
        if (body.includes('[Video Playback] URL:')) {
            const urlMatch = body.match(/URL:(\S+)/);
            const nameMatch = body.match(/VideoName:(.+)/);
            const displayMatch = body.match(/DisplayName:(.+?)(?:\s+VideoName:|$)/);
            const video: VideoInfo = {
                url: urlMatch?.[1] || '',
                name: nameMatch?.[1]?.trim() || '',
                displayName: displayMatch?.[1]?.trim() || '',
                timestamp,
            };
            state.currentVideo = video;
            state.videoHistory.push(video);
        }

        // AVPro Video Play (another format)
        // [Behaviour] [Video Playback] URL:https://...
        if (body.includes('[Behaviour] [Video Playback] URL:')) {
            const urlMatch = body.match(/URL:(\S+)/);
            if (urlMatch && !state.currentVideo?.url) {
                const video: VideoInfo = {
                    url: urlMatch[1],
                    name: '',
                    displayName: '',
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
        inputs: ['main'],
        outputs: ['main'],
        properties: [
            {
                displayName: 'Log Directory',
                name: 'logDir',
                type: 'string',
                default: '',
                placeholder: 'Leave empty for auto-detect',
                description: 'Path to VRChat log directory. Leave empty to auto-detect.',
            },
            {
                displayName: 'Output',
                name: 'output',
                type: 'options',
                options: [
                    { name: 'Full Snapshot', value: 'snapshot' },
                    { name: 'Player List Only', value: 'players' },
                    { name: 'Current Video Only', value: 'video' },
                    { name: 'Room Info Only', value: 'room' },
                ],
                default: 'snapshot',
                description: 'What data to output',
            },
        ] as INodeProperties[],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        let logDir = (this.getNodeParameter('logDir', 0, '') as string).trim();
        const output = this.getNodeParameter('output', 0, 'snapshot') as string;

        // Auto-detect
        if (!logDir) {
            const localAppData = process.env.LOCALAPPDATA || '';
            logDir = path.join(localAppData, 'Low', 'VRChat', 'VRChat');
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
            default: // snapshot
                result = {
                    location: state.location,
                    worldName: state.worldName,
                    joinedAt: state.joinedAt,
                    players: Array.from(state.players.values()),
                    playerCount: state.players.size,
                    currentVideo: state.currentVideo || null,
                    videoHistory: state.videoHistory.slice(-10),
                    logFile: files[0],
                };
        }

        return [this.helpers.returnJsonArray([result])];
    }
}
