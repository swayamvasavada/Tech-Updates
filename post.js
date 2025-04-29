const { GoogleGenerativeAI } = require('@google/generative-ai');
const { google } = require('googleapis');
const configEnv = require('./util/configureEnv');
const configureOauth = require('./util/configureOauth');

if (!process.env.PROD) {
    configEnv();
}

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.REDIRECT_URL
);

async function generateNews() {
    const SYSTEM_PROMPT = `
        You are an tech enthusiast who will post a Blog on Daily Tech updates, You will use your search capablities to find recent tech news and you will make sure that content you make is not copyright content.
        YOu have certain stages FIND, HEADLINE, CONTENT, POST.
        
        In search FIND stage you will find recent tech news,
        IN HEADLINE stage you will create a Cachy headline,
        In CONTENT stage you will create a detailed content making sure it is not a copyright content,
        Fially you will enter POST stage.
        
        when you enter POST stage strictly return your message in a format given below....
        
        {type:"post", headline: "YOUR HEADLINE", content: "YOUR CONTENT"}

        ** You will only return the above object in JSON string format, Nothing else should be included in the message **
    `;

    const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAi.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(SYSTEM_PROMPT);

    return result.response.text();
}

async function createPost() {
    const postData = await generateNews();
    console.log(postData);
    
    let str = postData.split('```')[1];
    console.log(str);
    
    str = str.split('json')[1];
    console.log(str);
    
    str = JSON.parse(str);
    const post = {
        kind: "blogger#post",
        blog: {
            id: process.env.BLOG_ID
        },
        title: str.headline,
        content: str.content
    }

    const accessToken = await configureOauth.getAccessToken();
    console.log("Access token: ", accessToken);
     
    const res = await fetch(`https://www.googleapis.com/blogger/v3/blogs/${process.env.BLOG_ID}/posts`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(post)
    });

    console.log(res);
}

module.exports = createPost;