import { configWithoutCloudSupport } from '@n8n/node-cli/eslint';

// ws is required at runtime by VRChatTrigger (WebSocket). 
// n8n's no-runtime-dependencies rule conflicts with legitimate runtime deps,
// so we disable it for package.json only.
export default [
	...configWithoutCloudSupport,
	{
		files: ['package.json'],
		rules: {
			'@n8n/community-nodes/no-runtime-dependencies': 'off',
		},
	},
];
