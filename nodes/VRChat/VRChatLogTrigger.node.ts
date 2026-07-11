/* eslint-disable n8n-nodes-base/node-filename-against-convention */
/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import {
    ITriggerFunctions,
    INodeType,
    INodeTypeDescription,
    ITriggerResponse,
    INodeProperties,
    IDataObject,
} from 'n8n-workflow';
import * as fs from 'fs';
import * as path from 'path';
import { setTimeout as nodeSetTimeout, clearTimeout as nodeClearTimeout } from 'timers';

// ==================== Log Parser ====================

interface ParsedEvent {
    type: string;
    timestamp: string;
    data: Record<string, unknown>;
}

function parseTimestamp(line: string): string {
    // "2026.06.28 20:30:15" → ISO 8601
    const match = line.match(/^(\d{4}\.\d{2}\.\d{2}) (\d{2}:\d{2}:\d{2})/);
    if (!match) return new Date().toISOString();
    const [date, time] = [match[1], match[2]];
    const [y, m, d] = date.split('.');
    const dt = new Date(`${y}-${m}-${d}T${time}`);
    return dt.toISOString();
}

function parseUserInfo(str: string): { displayName: string; userId: string } {
    // "Natsumi-sama (usr_032383a7-...)" or just "Natsumi-sama"
    const match = str.match(/^(.+?)\s*\((usr_[a-f0-9-]+)\)\s*$/);
    if (match) return { displayName: match[1].trim(), userId: match[2] };
    return { displayName: str.trim(), userId: '' };
}

function parseLine(line: string): ParsedEvent | null {
    if (line.length < 35) return null;

    const timestamp = parseTimestamp(line);
    const body = line.substring(34); // skip timestamp prefix

    // Player Joined
    // [Behaviour] OnPlayerJoined Natsumi-sama (usr_xxx)
    if (body.includes('OnPlayerJoined') && !body.includes('OnPlayerJoined:')) {
        const idx = body.lastIndexOf('OnPlayerJoined');
        if (idx < 0) return null;
        const info = parseUserInfo(body.substring(idx + 15));
        if (!info.displayName && !info.userId) return null;
        if (info.displayName.startsWith('/ player=')) return null;
        return { type: 'player-joined', timestamp, data: info };
    }

    // Player Left
    // [Behaviour] OnPlayerLeft Natsumi-sama (usr_xxx)
    if (body.includes('OnPlayerLeft') && !body.includes('OnPlayerLeftRoom') && !body.includes('OnPlayerLeft:')) {
        const idx = body.lastIndexOf('OnPlayerLeft');
        if (idx < 0) return null;
        const info = parseUserInfo(body.substring(idx + 13));
        if (!info.displayName && !info.userId) return null;
        if (info.displayName.startsWith('/ player=')) return null;
        return { type: 'player-left', timestamp, data: info };
    }

    // Entering Room (world name)
    // [Behaviour] Entering Room: VRChat Home
    if (body.includes('Entering Room: ')) {
        const idx = body.lastIndexOf('Entering Room: ');
        if (idx < 0) return null;
        const worldName = body.substring(idx + 15).trim();
        return { type: 'entering-room', timestamp, data: { worldName } };
    }

    // Joining (location)
    // [Behaviour] Joining wrld_xxx:instance~tags
    if (body.includes('[Behaviour] Joining ') &&
        !body.includes('Joining or Creating Room') &&
        !body.includes('Joining friend')) {
        const idx = body.lastIndexOf('] Joining ');
        if (idx < 0) return null;
        const location = body.substring(idx + 10).replace(/\//g, '').trim();
        return { type: 'joining', timestamp, data: { location } };
    }

    // Destination set
    // [Behaviour] Destination set: wrld_xxx
    if (body.includes('[Behaviour] Destination set: ')) {
        const idx = body.lastIndexOf('Destination set: ');
        if (idx < 0) return null;
        const worldId = body.substring(idx + 17).trim();
        return { type: 'destination', timestamp, data: { worldId } };
    }

    return null;
}

// ==================== Log File Watcher ====================

function findLatestLogFile(logDir: string): string | null {
    try {
        const files = fs.readdirSync(logDir)
            .filter(f => f.startsWith('output_log') && f.endsWith('.txt'))
            .sort()
            .reverse();
        return files.length > 0 ? path.join(logDir, files[0]) : null;
    } catch {
        return null;
    }
}

// ==================== Node ====================

export class VRChatLogTrigger implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'VRChat Log Trigger',
        name: 'vrchatLogTrigger',
        icon: 'file:../../icons/vrchat.svg',
        group: ['trigger'],
        version: 1,
        description: 'Triggers on VRChat events by reading game log files in real-time. No credentials required.',
        defaults: { name: 'VRChat Log Trigger' },
        subtitle: '={{$parameter["eventTypes"].toString()}}',
        inputs: [],
        outputs: ['main'],
        credentials: [
            { name: 'VRChatApi', required: false },
        ],
        properties: [
            {
                displayName: 'Event Types',
                name: 'eventTypes',
                type: 'multiOptions',
                options: [
                    { name: 'Player Joined', value: 'player-joined' },
                    { name: 'Player Left', value: 'player-left' },
                    { name: 'Entering Room', value: 'entering-room' },
                    { name: 'Joining (Location)', value: 'joining' },
                    { name: 'Destination Set', value: 'destination' },
                ],
                default: ['player-joined', 'player-left', 'entering-room', 'joining'],
                description: 'Which events to trigger on. Leave empty for all events.',
            },
            {
                displayName: 'Poll Interval (ms)',
                name: 'pollInterval',
                type: 'number',
                default: 1000,
                description: 'How often to check for new log lines (milliseconds)',
            },
        ] as INodeProperties[],
    };

    async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
        const eventTypes = this.getNodeParameter('eventTypes', []) as string[];
        const pollInterval = this.getNodeParameter('pollInterval', 1000) as number;

        // Resolve log directory: credential → auto-detect
        let logDir = '';
        try {
            const creds = await this.getCredentials('VRChatApi');
            logDir = ((creds?.logDirectory as string) || '').trim();
        } catch {
            // credential not configured, fall through
        }
        if (!logDir) {
            const userProfile = process.env.USERPROFILE || '';
            logDir = path.join(userProfile, 'AppData', 'LocalLow', 'VRChat', 'VRChat');
        }

        if (!fs.existsSync(logDir)) {
            this.logger.error(`VRChat log directory not found: ${logDir}`);
            throw new Error(`VRChat log directory not found: ${logDir}`);
        }

        this.logger.info(`Watching VRChat logs in: ${logDir}`);

        let currentFile: string | null = null;
        let currentSize = 0;
        let fileWatcher: fs.FSWatcher | null = null;
        let pollTimer: ReturnType<typeof nodeSetTimeout> | null = null;
        let isStopping = false;

        // Buffer for partial lines
        let lineBuffer = '';

        const self = this;

        function processNewData(data: string) {
            lineBuffer += data;
            const lines = lineBuffer.split('\n');
            lineBuffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.length < 35) continue;

                const parsed = parseLine(trimmed);
                if (!parsed) continue;

                if (eventTypes.length > 0 && !eventTypes.includes(parsed.type)) continue;

                self.emit([
                    self.helpers.returnJsonArray({
                        event: parsed.type,
                        timestamp: parsed.timestamp,
                        data: parsed.data,
                        source: 'vrchat-log',
                    } as unknown as IDataObject),
                ]);
            }
        }

        const readNewData = () => {
            if (!currentFile || !fs.existsSync(currentFile)) return;

            try {
                const stats = fs.statSync(currentFile);
                if (stats.size > currentSize) {
                    const fd = fs.openSync(currentFile, 'r');
                    const buffer = Buffer.alloc(stats.size - currentSize);
                    fs.readSync(fd, buffer, 0, buffer.length, currentSize);
                    fs.closeSync(fd);
                    currentSize = stats.size;
                    processNewData(buffer.toString('utf-8'));
                } else if (stats.size < currentSize) {
                    // File was truncated/rotated, reset
                    currentSize = 0;
                }
            } catch {
                // File might be locked, ignore
            }
        };

        const checkForNewFile = () => {
            const latest = findLatestLogFile(logDir);
            if (latest && latest !== currentFile) {
                // New log file detected (VRChat restart)
                if (fileWatcher) {
                    fileWatcher.close();
                    fileWatcher = null;
                }

                currentFile = latest;
                currentSize = 0; // Read from beginning of new file
                lineBuffer = '';

                this.logger.info(`New log file: ${path.basename(currentFile)}`);

                // Watch the file for changes
                try {
                    fileWatcher = fs.watch(currentFile, { persistent: false }, () => {
                        readNewData();
                    });
                } catch {
                    // Fallback to polling only
                }
            }
        };

        // Main polling loop
        const poll = () => {
            if (isStopping) return;

            checkForNewFile();
            readNewData();

            pollTimer = nodeSetTimeout(poll, pollInterval);
        };

        // Initial setup
        checkForNewFile();
        if (currentFile) {
            // Start from end of existing file (don't process old events)
            try {
                currentSize = fs.statSync(currentFile).size;
            } catch {
                currentSize = 0;
            }
        }

        // Start polling
        poll();

        return {
            closeFunction: async () => {
                isStopping = true;
                if (pollTimer) nodeClearTimeout(pollTimer);
                if (fileWatcher) {
                    fileWatcher.close();
                    fileWatcher = null;
                }
                this.logger.info('VRChat Log Trigger stopped');
            },
        };
    }
}
