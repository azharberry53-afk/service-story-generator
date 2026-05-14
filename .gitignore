const express = require('express');
const multer = require('multer');
const Groq = require('groq-sdk');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPG and PNG files are allowed'));
        }
    }
});

app.use(express.static('public'));
app.use(express.json());

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

async function generateStory(data) {
    const staffNames = [];
    const staffList = [];
    if (data.staffName1) {
        staffNames.push(data.staffName1);
        staffList.push(`${data.staffName1} (ID: ${data.staffId1})`);
    }
    if (data.staffName2) {
        staffNames.push(data.staffName2);
        staffList.push(`${data.staffName2} (ID: ${data.staffId2})`);
    }
    if (data.staffName3) {
        staffNames.push(data.staffName3);
        staffList.push(`${data.staffName3} (ID: ${data.staffId3})`);
    }
    if (data.staffName4) {
        staffNames.push(data.staffName4);
        staffList.push(`${data.staffName4} (ID: ${data.staffId4})`);
    }

    const allStaffStr = staffNames.join(', ');
    const randomSeed = Math.floor(Math.random() * 100000);
    const styles = [
        'Start with the time of day and atmosphere at the station.',
        'Begin by describing the staff member performing their routine duties.',
        'Open with the moment the lost item was discovered.',
        'Start with a general statement about service excellence.',
        'Begin by setting the scene at Woodlands North MRT Station.',
        'Open with the staff member noticing something unusual.',
        'Start with describing the busy station environment.',
        'Begin with the importance of lost and found procedures.'
    ];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];

    const prompt = `You are a professional writer for MRT station service stories in Singapore. Write a unique service story. Use random variation seed: ${randomSeed}.

CREATIVE DIRECTION: ${randomStyle}

DETAILS:
- Date: ${data.date}
- Time: ${data.time}
- Location: Woodlands North MRT Station, Singapore
- Passenger: ${data.passengerTitle} ${data.passengerName}
- Lost Item: ${data.lostItem}
- Staff Involved: ${allStaffStr}
- Staff Details: ${staffList.join('; ')}

THE STORY MUST INCLUDE THESE EVENTS (in order, but described creatively):

1. Staff found the lost ${data.lostItem} at Woodlands North MRT Station during their duties.
2. Staff immediately sent out an LPO (Lost Property Office) email notification and a WhatsApp message to all stations.
3. ${data.passengerTitle} ${data.passengerName} approached the station staff to ask about their lost ${data.lostItem}.
4. Staff carefully verified the passenger's identity and confirmed ownership.
5. Staff handed over the ${data.lostItem} to ${data.passengerTitle} ${data.passengerName}.
6. ${data.passengerTitle} ${data.passengerName} was grateful and gave a compliment to the staff.

WRITING RULES:
- Past tense narrative
- 3-5 paragraphs
- Professional but warm tone
- Mention date and time naturally
- End by complimenting the staff's dedication
- Make it UNIQUE - different from previous stories
- No title or heading
- Vary vocabulary and sentence structure`;

    const chatCompletion = await groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "You are an expert service story writer for Singapore MRT stations. Every story must be completely unique with different openings, structures, and descriptions."
            },
            { role: "user", content: prompt }
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.95,
        max_tokens: 1024,
        top_p: 0.95,
    });

    return chatCompletion.choices[0]?.message?.content || 'Story generation failed.';
}

async function saveToGoogleSheets(data, story, passengerPhotoBase64, complimentLetterBase64) {
    const payload = {
        date: data.date,
        time: data.time,
        passengerTitle: data.passengerTitle,
        passengerName: data.passengerName,
        lostItem: data.lostItem,
        staffName1: data.staffName1 || '',
        staffId1: data.staffId1 || '',
        staffName2: data.staffName2 || '',
        staffId2: data.staffId2 || '',
        staffName3: data.staffName3 || '',
        staffId3: data.staffId3 || '',
        staffName4: data.staffName4 || '',
        staffId4: data.staffId4 || '',
        story: story,
        passengerPhoto: passengerPhotoBase64 || '',
        complimentLetter: complimentLetterBase64 || ''
    };

    const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        redirect: 'follow'
    });

    const result = await response.json();
    console.log('Google Sheets response:', result);

    if (!result.success) {
        throw new Error(result.error || 'Failed to save to Google Sheets');
    }

    return result;
}

app.post('/api/generate', upload.fields([
    { name: 'passengerPhoto', maxCount: 1 },
    { name: 'complimentLetter', maxCount: 1 }
]), async (req, res) => {
    try {
        console.log('Received request');

        const { date, time, passengerName, lostItem, staffName1, staffId1 } = req.body;

        if (!date || !time || !passengerName || !lostItem || !staffName1 || !staffId1) {
            return res.status(400).json({ error: 'Please fill in all required fields' });
        }

        if (!req.files || !req.files.passengerPhoto || !req.files.complimentLetter) {
            return res.status(400).json({ error: 'Please upload both photos' });
        }

        const passengerPhotoBase64 = req.files.passengerPhoto[0].buffer.toString('base64');
        const complimentLetterBase64 = req.files.complimentLetter[0].buffer.toString('base64');

        console.log('Generating story...');
        const story = await generateStory(req.body);
        console.log('Story generated!');

        console.log('Saving to Google Sheets...');
        await saveToGoogleSheets(req.body, story, passengerPhotoBase64, complimentLetterBase64);
        console.log('Saved!');

        res.json({
            success: true,
            story: story,
            message: 'Story generated and saved!'
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            error: error.message || 'Something went wrong'
        });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});