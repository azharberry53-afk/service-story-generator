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
        staffList.push(`${data.staffName1} (Staff ID: ${data.staffId1})`);
    }
    if (data.staffName2) {
        staffNames.push(data.staffName2);
        staffList.push(`${data.staffName2} (Staff ID: ${data.staffId2})`);
    }
    if (data.staffName3) {
        staffNames.push(data.staffName3);
        staffList.push(`${data.staffName3} (Staff ID: ${data.staffId3})`);
    }
    if (data.staffName4) {
        staffNames.push(data.staffName4);
        staffList.push(`${data.staffName4} (Staff ID: ${data.staffId4})`);
    }

    const allStaffStr = staffNames.join(', ');
    const staffCount = staffNames.length;
    const primaryStaff = staffNames[0];
    const otherStaff = staffNames.slice(1);
    const randomSeed = Math.floor(Math.random() * 100000);

    // Random opening styles
    const openings = [
        `On ${data.date} at around ${data.time},`,
        `On ${data.date}, at about ${data.time},`,
        `At ${data.time} on ${data.date},`,
        `On ${data.date} at ${data.time},`,
        `During the shift on ${data.date} at around ${data.time},`
    ];
    const randomOpening = openings[Math.floor(Math.random() * openings.length)];

    // Random found locations within station
    const foundLocations = [
        'at the platform',
        'near the faregates',
        'at the passenger service centre',
        'on a bench at the concourse',
        'near the ticketing machine',
        'at the platform seating area',
        'near the station entrance',
        'at the staircase landing',
        'inside the lift',
        'near the exit gate'
    ];
    const randomFoundLocation = foundLocations[Math.floor(Math.random() * foundLocations.length)];

    // Random discovery scenarios - HOW the item was found
    const discoveryScenarios = [
        `${primaryStaff} was doing routine patrol when he/she spotted the ${data.lostItem} ${randomFoundLocation}.`,
        `During station rounds, ${primaryStaff} noticed a ${data.lostItem} left ${randomFoundLocation}.`,
        `A passenger informed ${primaryStaff} that there was a ${data.lostItem} left ${randomFoundLocation}.`,
        `While checking the station, ${primaryStaff} found a ${data.lostItem} ${randomFoundLocation}.`,
        `${primaryStaff} was at the PSC when a kind passenger handed in a ${data.lostItem} found ${randomFoundLocation}.`,
        `${primaryStaff} spotted an unattended ${data.lostItem} ${randomFoundLocation} during patrol.`,
        `A commuter alerted ${primaryStaff} about a ${data.lostItem} left ${randomFoundLocation}.`
    ];
    const randomDiscovery = discoveryScenarios[Math.floor(Math.random() * discoveryScenarios.length)];

    // Random passenger approach scenarios
    const approachScenarios = [
        `Not long after, ${data.passengerTitle} ${data.passengerName} came to the PSC looking worried and asked the staff if anyone had handed in a ${data.lostItem}.`,
        `Shortly after, ${data.passengerTitle} ${data.passengerName} approached the staff at the PSC to enquire about ${data.lostItem === 'Handphone' ? 'his/her handphone' : `his/her ${data.lostItem}`}.`,
        `A while later, ${data.passengerTitle} ${data.passengerName} came back to the station looking for ${data.lostItem === 'Handphone' ? 'his/her handphone' : `his/her ${data.lostItem}`}.`,
        `${data.passengerTitle} ${data.passengerName} then approached the staff and explained that ${data.lostItem === 'Handphone' ? 'his/her handphone' : `his/her ${data.lostItem}`} was missing.`,
        `Later, ${data.passengerTitle} ${data.passengerName} walked up to the PSC to ask about a missing ${data.lostItem}.`,
        `${data.passengerTitle} ${data.passengerName} returned to the station and asked the staff for help in finding ${data.lostItem === 'Handphone' ? 'his/her handphone' : `his/her ${data.lostItem}`}.`
    ];
    const randomApproach = approachScenarios[Math.floor(Math.random() * approachScenarios.length)];

    // Random verification methods
    const verificationMethods = [
        `${primaryStaff} asked ${data.passengerTitle} ${data.passengerName} to describe the ${data.lostItem} to confirm ownership.`,
        `The staff verified by asking ${data.passengerTitle} ${data.passengerName} a few details about the ${data.lostItem}.`,
        `${primaryStaff} asked ${data.passengerTitle} ${data.passengerName} to describe the colour and contents of the ${data.lostItem} to verify.`,
        `The staff did a verification check by asking ${data.passengerTitle} ${data.passengerName} about the details of the ${data.lostItem}.`,
        `${primaryStaff} confirmed ownership by asking ${data.passengerTitle} ${data.passengerName} to describe what was inside the ${data.lostItem}.`
    ];
    const randomVerification = verificationMethods[Math.floor(Math.random() * verificationMethods.length)];

    // Random handover descriptions
    const handoverDescriptions = [
        `Once verified, the ${data.lostItem} was returned to ${data.passengerTitle} ${data.passengerName}.`,
        `After confirming ownership, the staff handed the ${data.lostItem} back to ${data.passengerTitle} ${data.passengerName}.`,
        `The ${data.lostItem} was then returned to ${data.passengerTitle} ${data.passengerName}.`,
        `The staff handed over the ${data.lostItem} to ${data.passengerTitle} ${data.passengerName} after verification.`,
        `${primaryStaff} returned the ${data.lostItem} to ${data.passengerTitle} ${data.passengerName} after the checks were done.`
    ];
    const randomHandover = handoverDescriptions[Math.floor(Math.random() * handoverDescriptions.length)];

    // Random gratitude/compliment scenarios
    const gratitudeScenarios = [
        `${data.passengerTitle} ${data.passengerName} was very thankful and praised the staff for their quick response.`,
        `${data.passengerTitle} ${data.passengerName} thanked the staff and later sent in a compliment letter for their good service.`,
        `${data.passengerTitle} ${data.passengerName} expressed appreciation and wrote a compliment for the staff.`,
        `${data.passengerTitle} ${data.passengerName} was grateful and wrote in a compliment to thank the staff.`,
        `${data.passengerTitle} ${data.passengerName} thanked the team and gave a compliment for their helpful service.`,
        `${data.passengerTitle} ${data.passengerName} was relieved and happy, and gave a compliment to the staff.`
    ];
    const randomGratitude = gratitudeScenarios[Math.floor(Math.random() * gratitudeScenarios.length)];

    // Random closing lines
    const closingLines = [
        `Well done to ${primaryStaff}${otherStaff.length > 0 ? ` and ${otherStaff.join(', ')}` : ''} for the great teamwork and service.`,
        `Good job to ${primaryStaff}${otherStaff.length > 0 ? `, ${otherStaff.join(', ')}` : ''} for the prompt action.`,
        `Kudos to ${primaryStaff}${otherStaff.length > 0 ? ` and team` : ''} for the helpful service.`,
        `Great service shown by ${primaryStaff}${otherStaff.length > 0 ? ` and ${otherStaff.join(', ')}` : ''}.`,
        `Well done to the team for handling the situation well.`,
        `Good service by ${primaryStaff}${otherStaff.length > 0 ? ` and ${otherStaff.join(', ')}` : ''}.`
    ];
    const randomClosing = closingLines[Math.floor(Math.random() * closingLines.length)];

    // Random LPO action descriptions
    const lpoActions = [
        `${primaryStaff} immediately sent out an LPO email and a WhatsApp message to all stations to inform them about the found ${data.lostItem}.`,
        `An LPO email was sent out together with a WhatsApp broadcast to all stations regarding the found ${data.lostItem}.`,
        `The staff sent an LPO email and notified all stations through WhatsApp about the ${data.lostItem}.`,
        `${primaryStaff} alerted all stations by sending out an LPO email and a WhatsApp message about the found ${data.lostItem}.`,
        `An LPO notification email and WhatsApp message were sent to all stations to broadcast the found ${data.lostItem}.`
    ];
    const randomLpoAction = lpoActions[Math.floor(Math.random() * lpoActions.length)];

    const prompt = `Write a short, simple, natural-sounding incident report for an MRT station lost and found case in Singapore. Write like a real MRT staff writing a normal report - NOT like a novel or dramatic story.

Use SIMPLE ENGLISH. Short sentences. No fancy or exaggerated words.

Random seed for variation: ${randomSeed}

DETAILS:
- Date: ${data.date}
- Time: ${data.time}
- Station: Woodlands North MRT Station
- Passenger: ${data.passengerTitle} ${data.passengerName}
- Lost Item: ${data.lostItem}
- Staff on duty: ${allStaffStr}

USE THESE EXACT DETAILS IN YOUR REPORT (rewrite slightly if needed but keep the meaning):

Opening: "${randomOpening}"
Discovery: "${randomDiscovery}"
LPO Action: "${randomLpoAction}"
Passenger Approach: "${randomApproach}"
Verification: "${randomVerification}"
Handover: "${randomHandover}"
Gratitude: "${randomGratitude}"
Closing: "${randomClosing}"

RULES:
- Write 2 to 3 short paragraphs only
- Use the exact details above to build the report naturally
- Connect the sentences smoothly
- Use SIMPLE words only (no "meticulously", "diligently", "exemplary", "magnificent", "extraordinary", etc.)
- Do NOT exaggerate or be dramatic
- Sound like a normal staff report
- Do NOT add any title, heading, or label
- Do NOT use bullet points or numbering
- Just plain paragraphs
- Mention staff names naturally
- Keep it factual and simple`;

    const chatCompletion = await groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "You are a Singapore MRT station staff writing a simple incident report. Use plain, simple English. Short sentences. No dramatic words. Sound like a normal real person, not AI. Never exaggerate."
            },
            { role: "user", content: prompt }
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.8,
        max_tokens: 700,
        top_p: 0.9,
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
