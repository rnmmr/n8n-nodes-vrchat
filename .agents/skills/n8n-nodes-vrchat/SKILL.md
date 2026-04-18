---
name: n8n-nodes-vrchat
description: >-
  When the user needs to configure VRChat nodes in n8n workflows.
  Triggers when user mentions: VRChat, friend location, world info, user info,
  notifications, friend requests, VRChat API, or configuring custom n8n nodes.
  Provides operation parameters, credential setup, and workflow patterns for VRChat integration.
---

# n8n VRChat Nodes Skill

## Overview

This skill provides AI assistants with the knowledge to configure and use VRChat nodes in n8n workflow automation.

## Available Nodes

| Node | Type | Version | Description |
|------|------|---------|-------------|
| VRChat | `CUSTOM.vrChat` | 1 | Perform VRChat API operations |
| VRChat Trigger | `CUSTOM.vrchatTrigger` | 1 | Listen for VRChat WebSocket events |

## Credentials

Both nodes require `VRChatApi` credentials:

```json
{
  "credentials": {
    "VRChatApi": {
      "id": "your-credential-id",
      "name": "VRChat account"
    }
  }
}
```

---

## VRChat Node (`CUSTOM.vrChat`)

### Operations

| Operation | Description | Required Parameters |
|-----------|-------------|---------------------|
| `Get User Info` | Fetch user profile by ID | `UserID` |
| `Get Current User` | Get authenticated user info | (none) |
| `Change User Info` | Update user bio/status | `OwnUserid`, `additionalFields` |
| `Get World Info` | Fetch world instance details | `worldId` |
| `Get Mutual Friends` | Find mutual friends | `UserID` |
| `Get Notifications` | Fetch user notifications | (none) |
| `Accept Friend Request` | Accept incoming friend request | (none) |

### Configuration Template

```json
{
  "type": "CUSTOM.vrChat",
  "typeVersion": 1,
  "parameters": {
    "function": "<OPERATION_NAME>",
    "//": "Add operation-specific parameters here"
  },
  "credentials": {
    "VRChatApi": {
      "id": "credential-id",
      "name": "VRChat account"
    }
  }
}
```

### Operation Examples

#### Get User Info

```json
{
  "parameters": {
    "function": "Get User Info",
    "UserID": "usr_998c68e1-dbd2-4c57-981e-c827faf7dee4",
    "requestOptions": {}
  }
}
```

#### Change User Bio

```json
{
  "parameters": {
    "function": "Change User Info",
    "OwnUserid": "={{ $json.id }}",
    "additionalFields": {
      "bio": "Updated bio text"
    }
  }
}
```

#### Get World Info

```json
{
  "parameters": {
    "function": "Get World Info",
    "worldId": "={{ $json.worldId }}",
    "additionalinfo": {
      "instanceId": "={{ $json.instanceId }}"
    },
    "requestOptions": {}
  }
}
```

---

## VRChat Trigger Node (`CUSTOM.vrchatTrigger`)

### Events

| Event | Description |
|-------|-------------|
| `friend-location` | Triggered when a friend's location changes |

### Configuration Template

```json
{
  "type": "CUSTOM.vrchatTrigger",
  "typeVersion": 1,
  "parameters": {
    "wsevent": ["friend-location"]
  },
  "credentials": {
    "VRChatApi": {
      "id": "credential-id",
      "name": "VRChat account"
    }
  }
}
```

### Output Data Structure

```json
{
  "content": {
    "user": {
      "id": "usr_xxx",
      "displayName": "Username"
    },
    "location": "wrld_xxx:instance~region(jp)",
    "worldId": "wrld_xxx"
  },
  "type": "friend-location",
  "timestamp": "2026-04-18T12:21:10.009Z"
}
```

### Location Values

| Value | Meaning |
|-------|---------|
| `traveling` | User is traveling between worlds |
| `offline` | User is offline |
| `wrld_xxx:instance~tags~region` | User is in a world |

---

## Workflow Patterns

### Pattern 1: Friend Location Monitor

```
[VRChat Trigger] → [IF: check user] → [HTTP Request: notify]
```

**Use case:** Notify when a specific friend enters a private room

### Pattern 2: Periodic Status Update

```
[Schedule Trigger] → [Get Current User] → [Change User Info]
```

**Use case:** Auto-update your VRChat bio with current status

### Pattern 3: Notification Handler

```
[Schedule Trigger] → [Get Notifications] → [Loop] → [Process Each]
```

**Use case:** Process friend requests automatically

---

## Common Expressions

```javascript
// Access user ID from trigger output
{{ $json.content.user.id }}

// Access user's display name
{{ $json.content.user.displayName }}

// Access world ID
{{ $json.worldId }}

// Access instance ID (full string)
{{ $json.content.location }}

// Check if in private room
{{ $json.content.location.includes('private') }}

// Check if traveling
{{ $json.content.location === 'traveling' }}

// Extract world ID from location
{{ $json.content.location.split(':')[0] }}
```

---

## Node Search Keywords

When searching for VRChat nodes, use:

- `vrchat`
- `vr chat`
- `friend location`
- `world info`
- `user info`

---

## Related Documentation

- [VRChat API Documentation](https://vrchatapi.github.io/)
- [n8n Workflow Patterns](https://github.com/czlonkowski/n8n-skills)
- [Detailed Node Reference](./README.md)