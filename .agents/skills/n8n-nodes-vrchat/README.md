# VRChat Nodes for n8n

Community-contributed n8n nodes for VRChat API integration.

## Installation

```bash
npm install n8n-nodes-vrchat
```

Then enable the nodes in your n8n settings.

## Credentials

### VRChatApi

Required for all VRChat nodes:

| Field | Description |
|-------|-------------|
| API Key | Your VRChat API key (from VRChat account settings) |
| Username | Your VRChat username |
| Password | Your VRChat password |

---

## VRChat Node (`CUSTOM.vrChat`)

Perform various VRChat API operations.

### Operations

#### Get User Info

Fetch detailed information about a VRChat user by their ID.

```json
{
  "type": "CUSTOM.vrChat",
  "parameters": {
    "function": "Get User Info",
    "UserID": "usr_998c68e1-dbd2-4c57-981e-c827faf7dee4",
    "requestOptions": {}
  }
}
```

**Output:**
```json
{
  "id": "usr_xxx",
  "displayName": "Username",
  "bio": "User bio text",
  "status": "online",
  "friends": ["usr_yyy", "usr_zzz"]
}
```

#### Get Current User

Get information about the authenticated user.

```json
{
  "type": "CUSTOM.vrChat",
  "parameters": {
    "function": "Get Current User",
    "requestOptions": {}
  }
}
```

#### Change User Info

Update the authenticated user's profile.

```json
{
  "type": "CUSTOM.vrChat",
  "parameters": {
    "function": "Change User Info",
    "OwnUserid": "={{ $json.id }}",
    "additionalFields": {
      "bio": "New bio text"
    },
    "requestOptions": {}
  }
}
```

**Supported Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `bio` | string | User biography text |
| `status` | string | User status (ask_me, busy, join me) |
| `statusDescription` | string | Custom status message |

#### Get World Info

Get information about a VRChat world.

```json
{
  "type": "CUSTOM.vrChat",
  "parameters": {
    "function": "Get World Info",
    "worldId": "wrld_13a51056-a064-4bdb-9621-f3cffb8a1d3c",
    "additionalinfo": {
      "instanceId": "49877~group(grp_e86e0e8a-c933-48c1-aae3-26490d7a54a4)~public~jp"
    },
    "requestOptions": {}
  }
}
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `worldId` | string | The world ID (e.g., `wrld_xxx`) |
| `additionalinfo.instanceId` | string | Optional instance identifier |

**Output:**
```json
{
  "id": "wrld_xxx",
  "name": "World Name",
  "description": "World description",
  "thumbnailUrl": "https://...",
  "capacity": 40,
  "tags": ["system:trusted", "language:ja"],
  "releaseStatus": "public",
  "worldVersion": 5,
  "n_users": 2
}
```

#### Get Mutual Friends

Get mutual friends between you and another user.

```json
{
  "type": "CUSTOM.vrChat",
  "parameters": {
    "function": "Get Mutual Friends",
    "UserID": "usr_998c68e1-dbd2-4c57-981e-c827faf7dee4",
    "requestOptions": {}
  }
}
```

#### Get Notifications

Fetch your VRChat notifications.

```json
{
  "type": "CUSTOM.vrChat",
  "parameters": {
    "function": "Get Notifications",
    "requestOptions": {}
  }
}
```

#### Accept Friend Request

Accept an incoming friend request.

```json
{
  "type": "CUSTOM.vrChat",
  "parameters": {
    "function": "Accept Friend Request",
    "requestOptions": {}
  }
}
```

---

## VRChat Trigger Node (`CUSTOM.vrchatTrigger`)

Listen for VRChat events in real-time using WebSocket.

### Events

#### friend-location

Triggers when a friend's location changes.

```json
{
  "type": "CUSTOM.vrchatTrigger",
  "parameters": {
    "wsevent": ["friend-location"]
  }
}
```

**Output Data:**
```json
{
  "content": {
    "user": {
      "id": "usr_f17f3e66-62d4-4aec-b23f-eec12edb7984",
      "displayName": "FriendName"
    },
    "location": "wrld_41efe3b1-9931-40ab-a15d-6946d22481b5:49877~group(grp_xxx)~public~jp",
    "worldId": "wrld_41efe3b1-9931-40ab-a15d-6946d22481b5"
  },
  "type": "friend-location",
  "timestamp": "2026-04-18T12:21:10.009Z"
}
```

### Location Format

| Value | Meaning |
|-------|---------|
| `traveling` | User is traveling between worlds |
| `offline` | User is offline |
| `wrld_xxx:instance~tags~region` | User is in a world |

### Instance Tags

| Tag | Meaning |
|-----|---------|
| `~private` | Private instance |
| `~group(grp_xxx)` | Group instance |
| `~hidden` | Hidden instance |
| `~friends` | Friends-only instance |

---

## Workflow Examples

### Example 1: Monitor Friend's Private Rooms

```json
{
  "name": "Monitor Private Rooms",
  "nodes": [
    {
      "type": "CUSTOM.vrchatTrigger",
      "name": "Friend Activity",
      "parameters": {
        "wsevent": ["friend-location"]
      }
    },
    {
      "type": "n8n-nodes-base.if",
      "name": "Is Private?",
      "parameters": {
        "conditions": {
          "conditions": [
            {
              "leftValue": "={{ $json.content.location }}",
              "rightValue": "private",
              "operator": { "type": "string", "operation": "contains" }
            }
          ]
        }
      }
    },
    {
      "type": "n8n-nodes-base.httpRequest",
      "name": "Notify",
      "parameters": {
        "method": "POST",
        "url": "https://notify.example.com/webhook",
        "jsonBody": "={{ { \"msg\": $json.content.user.displayName + \" is in a private room!\" } }}"
      }
    }
  ],
  "connections": {
    "Friend Activity": { "main": [[{ "node": "Is Private?", "type": "main", "index": 0 }]] },
    "Is Private?": { "main": [[{ "node": "Notify", "type": "main", "index": 0 }]] }
  }
}
```

### Example 2: Track User Online Status

```json
{
  "name": "Track Online Status",
  "nodes": [
    {
      "type": "n8n-nodes-base.scheduleTrigger",
      "name": "Every Hour",
      "parameters": {
        "rule": { "interval": [{ "field": "hours", "hours": 1 }] }
      }
    },
    {
      "type": "CUSTOM.vrChat",
      "name": "Get Target User",
      "parameters": {
        "function": "Get User Info",
        "UserID": "usr_target_id"
      }
    },
    {
      "type": "CUSTOM.vrChat",
      "name": "Update Status",
      "parameters": {
        "function": "Change User Info",
        "OwnUserid": "={{ $('Get Target User').first().json.id }}",
        "additionalFields": {
          "bio": "={{ 'Last seen: ' + $now }}"
        }
      }
    }
  ],
  "connections": {
    "Every Hour": { "main": [[{ "node": "Get Target User", "type": "main", "index": 0 }]] },
    "Get Target User": { "main": [[{ "node": "Update Status", "type": "main", "index": 0 }]] }
  }
}
```

---

## API Reference

- [VRChat API Documentation](https://vrchatapi.github.io/)
- [VRChat API on GitHub](https://github.com/vrchatapi/home)

## License

MIT